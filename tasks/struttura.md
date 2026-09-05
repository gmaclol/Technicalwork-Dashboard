# struttura.md — Dashboard (tchwrk2)

*Ultimo aggiornamento: 2026-07-02 — Fix editing materiali (FieldPath), modale aggiunta tecnici globali, scroll/click-outside modal*

---

## 1. Architettura Generale

**Pattern:** Vanilla JS SPA + Hash Router + Firebase Real-Time push

**Stack:**
- **Build:** Vite 8.x + vite-plugin-pwa (Service Worker, Workbox)
- **Frontend:** Vanilla JavaScript (ES modules, nessun framework UI)
- **Backend/Database:** Firebase Firestore (dati principali) + Firebase Realtime Database (presenza online)
- **CSS:** Custom design system (4 file CSS, CSS custom properties, tema chiaro/scuro, responsive mobile-first)
- **PWA:** Deploy su GitHub Pages (docs/), Web App Manifest, Service Worker con caching intelligente
- **Esternalità:** Firebase JS SDK (caricato via CDN), Google Fonts (Inter, JetBrains Mono), ExcelJS (caricato on-demand via CDN), Nominatim OpenStreetMap (geocoding)

**Layer applicativi:**

| Layer | Descrizione | File |
|-------|-------------|------|
| Entry Point / Router | Shell HTML, hash routing, theme, presence, offline | `index.html`, `js/app.js` |
| Autenticazione | Firebase Auth (Email/Password), ruoli Firestore userRoles/{uid} | `js/auth.js` |
| Stato Globale | Config, utente corrente, appalto/data correnti | `js/state.js` |
| Firebase Init | Inizializzazione Firestore + RTDB, export funzioni | `js/firebase.js` |
| Core Dati | Fetch liste, render griglia materiali, KPI, snapshot | `js/data.js` |
| Admin: PFS | Gestione segnalazioni e log PFS (real-time) | `js/pfs.js` |
| Admin: Tecnici | Elenco tecnici, rinomina, nascondi, killswitch/blocco | `js/tecnici.js` |
| Admin: Aree | Gestione aree preferite per dispositivo | `js/aree.js` |
| PFS Lookup | Ricerca PFS da GitHub (tutti gli utenti) | `js/pfsLookup.js` |
| Export | Esportazione Excel e Stampa tabella | `js/export.js` |
| Utility | Escape HTML, toast, modali, date, parsing quantità | `js/utils.js` |
| Design Tokens | Variabili CSS, reset, animazioni | `css/variables.css` |
| Componenti | Foglio di stile indice (importa i singoli moduli) | `css/components.css` |
| Componenti Modulari | forms, sidebar, table, modal, toast, kpi, pfs, pfs-lookup, misc | `css/components/*.css` |
| Tema Chiaro | Override light theme | `css/themes.css` |
| Responsive | Mobile, print, PWA safe-areas | `css/responsive.css` |

**Confini architetturali:**
- `js/app.js` è l'orchestrator: inizializza sidebar, gestisce hash routing, cleanup listener, presenza online
- Ogni modulo admin esporta `stop*Listeners()` per la pulizia centralizzata nel router
- I listener globali (sidebar favoriti, presenza online) NON vengono dismessi dal router
- I dati Firebase vengono letti in real-time (`onSnapshot`) per tutte le viste admin; le viste utente normale usano snapshot storici

---

## 2. Flussi Dati Principali

### 2.1 Login e Sessione
1. Utente inserisce credenziali (username o email) → `auth.js:doLogin()`
2. `signInWithEmailAndPassword` autentica con Firebase Auth lato server
3. Al login riuscito: recupera il documento `userRoles/{uid}` da Firestore per il ruolo (`admin` / `viewer`)
4. Se autorizzato: `setCurrentUser({ uid, email, name, role })`, chiama `showApp()`
5. `showApp()` → avvia notifiche globali PFS (admin), preloadCounts, init presence, dispatch hashchange
6. Al refresh o riapertura: `checkSession()` in `auth.js` ascolta `onAuthStateChanged()` ripristinando la sessione nativa Firebase

### 2.2 Navigazione SPA (Hash Router)
1. `window.location.hash` cambia → `app.js:handleHashChange()`
2. Prima di instanziare nuova vista: chiama tutti gli `stop*Listeners()` dei moduli uscenti
3. Tre famiglie di route:
   - `#/appalti/<nome>/<dateKey>` → carica griglia materiali (live o snapshot)
   - `#/admin/<sub>` → pannelli admin (Tecnici, PFS, Aree, Bloccati)
   - `#/pfs-lookup/<area>` → Ricerca PFS per area
4. Route `#/pfs-lookup` (senza area) → Region Browser

### 2.3 Caricamento Griglia Materiali (Flusso Principale)
1. `loadAppalto(appalto, dateKey)` in `data.js`
2. Se live: aggancia `onSnapshot` sulla collection Firestore dell'appalto
3. Se snapshot: `getDocs` + filtro `endsWith('_' + dateKey)`
4. `fetchRawMasterList(appalto)` → da GitHub o cache 24h
5. `checkStaleHashes()` → una tantum al primo caricamento (confronta hash materiali, badge "invariata dal")
6. `renderTable()` → costruisce HTML della tabella materiali × tecnici
7. Aggiornamento incrementale: se stesso appalto/data, aggiorna solo celle cambiate
8. Filtro materiali: `filterMaterials()` opera lato client sul DOM

### 2.4 Presenza Online (RTDB)
1. `app.js:initPresence()` → aggancia `.info/connected` su RTDB
2. Ogni tab apre una connessione univoca (`connections/conId`)
3. `onDisconnect()` rimuove la connessione quando il client si disconnette
4. `visibilitychange` → stato offline quando in background, online quando in foreground
5. Admin vede contatore utenti online da RTDB + nomi custom da `settings/devices_names`

### 2.5 PFS Lookup (Ricerca Aree)
1. `initPfsLookup()` → carica aree preferite da Firestore, fetch JSON regioni da GitHub
2. `showPfsLookupContent(area)` → fetch lista PFS per area da GitHub (JSON regionale → `.txt` fallback)
3. `parsePfsList()` → parsing `::::` e `::` separators, costruisce array oggetti
4. Render paginato: `MAX_VISIBLE_ITEMS = 100`, bottone "Mostra altri"
5. Espansione accordion: `pfsItemToggle(idx)`
6. Segnalazione PFS mancante → `submitMissingAddress()` → write su `pfs_segnalati`
7. Stelle preferiti → localStorage + sync Firestore `settings/devices_names`

### 2.6 Notifiche Globali PFS
1. `pfs.js:startGlobalPfsNotifications()` → `onSnapshot` su `pfs_segnalati` (solo admin)
2. Al primo load: skip (isInitialLoad)
3. A ogni nuovo documento: Web Notification (se background) o Toast (se foreground)
4. Badge contatore sidebar `#cnt-pfs` se non si è nella tab PFS

### 2.7 Export e Stampa
1. `export.js:exportToExcel()` → carica ExcelJS (CDN), costruisce workbook, trigger download
2. `export.js:printTable()` → apre finestra con HTML formattato, scala per A4 landscape, window.print()

---

## 3. Mappa dei File

### 3.1 JavaScript Core

#### `js/app.js` (400 righe)
**Responsabilità:** Entry point SPA, hash router, orchestra inizializzazione e cleanup listener. Gestisce tema, presence online (RTDB), offline banner, PWA auto-update.

**Funzioni:** `handleHashChange()`, `buildSidebar()`, `initPresence()`, `stopPresence()`, `applyTheme()`, `toggleTheme()`, `updateOnlineStatus()`

**Dipendenze:** tutti i moduli JS, firebase.js (RTDB e Firestore)

**Entry point:** `DOMContentLoaded → buildSidebar()`, `hashchange → handleHashChange()`

**Side effects:** Scrive su RTDB `/status/*` per presenza, scrive su localStorage per tema

**Stato:** stabile

#### `js/auth.js`
**Responsabilità:** Autenticazione con Firebase Authentication (email/password o username con suffissione automatica), lettura ruoli da `userRoles/{uid}` su Firestore, gestione sessione nativa con `onAuthStateChanged`, logout sicuro e pulizia stato.

**Funzioni:** `doLogin()`, `doLogout()`, `checkSession()`, `showApp()`

**Dipendenze:** firebase.js (auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, db, doc, getDoc), state.js (APPALTI, currentUser, setCurrentUser), utils.js (showConfirm), data.js (preloadCounts), pfs.js (startGlobalPfsNotifications, stopGlobalPfsNotifications)

**Stato:** stabile

#### `js/state.js`
**Responsabilità:** Stato globale condiviso (APPALTI, currentUser, currentAppalto, currentDate). Caricamento configurazione da GitHub (`config.json`) con cache 24h. Pub/Sub globale per `devices_names`.

**Funzioni:** `loadConfig()`, `invalidateConfigCache()`, `setCurrentUser()`, `setCurrentAppalto()`, `setCurrentDate()`, `subscribeToDevicesNames()`, `unsubscribeFromDevicesNames()`

**Dipendenze:** firebase.js (db, doc, onSnapshot)

**Stato:** stabile — rimossa la costante `USERS` (migrata a Firebase Auth e Firestore `userRoles`)

#### `js/firebase.js`
**Responsabilità:** Inizializzazione Firebase (Firestore, RTDB, Auth), export funzioni SDK

**Esporta:** `db`, `rtdb`, `auth`, `FieldPath`, funzioni Firestore/RTDB (collection, doc, getDocs, setDoc, updateDoc, onSnapshot, ref, onValue, set, update, onDisconnect, serverTimestamp) e funzioni Auth (signInWithEmailAndPassword, signOut, onAuthStateChanged)

**Dipendenze:** Firebase SDK via CDN

**Stato:** stabile

#### `js/data.js` (1680 righe)
**Responsabilità:** Core del caricamento dati e rendering. Fetch materiali da GitHub, rendering tabella, KPI, snapshot storici, stale hash detection, geocoding, filtro materiali, incremental render, scroll helpers, mini-editor inline delle quantità, aggiunta materiali con modale tecnici globali.

**Funzioni chiave:** `loadAppalto()`, `renderTable()`, `preloadCounts()`, `updateSidebarCountsForDate()`, `fetchRawMasterList()`, `checkStaleHashes()`, `filterMaterials()`, `loadGeo()`, `exportToExcel()` (delega), `printTable()` (delega), `forceListUpdateFromGithub()`, `getHiddenTecnici()`, `saveHiddenTecnici()`, `getHiddenTecniciSync()`, `setHiddenCache()`, `initGlobalHiddenListener()`, `editQuantityInline()`, `addMaterialRow()`

**Dipendenze:** firebase.js (incluso FieldPath), state.js, utils.js, export.js

**Side effects:** Scrive su Firestore `settings/stale_hashes` (una tantum per appalto), `settings/hidden_tecnici`, `settings/devices_names` (lettura tecnici globali), e `materiali` degli appalti (via edit inline e addMaterialRow). Usa `FieldPath` per chiavi con punto (es. "ONT ZTE 2.5 G").

**Stato:** stabile — fixati: bug FieldPath per nomi materiali con punto, editing inline bloccato dopo primo salvataggio, modale aggiunta materiali con tecnici globali (devices_names + documenti appalto, filtro web/hidden)

#### `js/pfs.js` (345 righe)
**Responsabilità:** Sezione admin "Gestione PFS" — visualizzazione duale (segnalazioni + log) in tempo reale, notifiche globali, badge contatore, eliminazione singola/bulk

**Funzioni:** `showPfsDashboard()`, `startGlobalPfsNotifications()`, `stopGlobalPfsNotifications()`, `deletePfsItem()`, `deleteSelectedPfs()`, `toggleAllPfs()`, `updatePfsToolbar()`, `clearUnseenPfsCount()`

**Dipendenze:** firebase.js, utils.js, state.js

**Entry points:** chiamato da `app.js` sul route `#/admin/pfs`

**Stato:** stabile

#### `js/pfsLookup.js` (858 righe)
**Responsabilità:** Sezione "Ricerca PFS" (tutti gli utenti). Replica l'Activity Android PfsActivity. Fetch JSON regionale da GitHub, parsing liste, paginazione DOM (100 items), accordion cards, stelline preferiti, segnalazione PFS mancante, region browser con chip filter e cross-area search.

**Funzioni:** `initPfsLookup()`, `initPfsLookupSidebar()`, `showPfsLookupContent()`, `showPfsRegionBrowser()`, `pfsToggleRegion()`, `pfsRegionSearch()`, `pfsLookupSearch()`, `pfsLookupSelectArea()`, `pfsLookupToggleStar()`, `pfsItemToggle()`, `pfsSubmitAddress()`, `pfsCopyAddress()`, `pfsRegionToggleStar()`, `getWebDeviceId()`, `stopPfsLookupListener()`

**Dipendenze:** firebase.js, state.js, utils.js

**Entry points:** chiamato da `app.js` su route `#/pfs-lookup/*` e buildSidebar

**Side effects:** Scrive su Firestore `devices_names` (registrazione web user, sync preferiti, segnalazione PFS), cache localStorage

**Stato:** stabile — fixata XSS (importato escapeHtml, escaping nomi PFS e indirizzi), .catch vuoti convertiti in warn log

#### `js/tecnici.js` (680 righe)
**Responsabilità:** Sezione admin "Tecnici" — elenco in tempo reale con separazione Android/Web. Rinomina, nascondi/mostra, eliminazione completa. Gestione blocco dispositivi (killswitch) con conteggio documenti, eliminazione dati su blocco. Device name resolution (reverse lookup marca→modello).

**Funzioni:** `showTecnici()`, `showBanned()`, `deleteTecnico()`, `renameTecnico()`, `toggleTecnico()`, `handleTogglePfsAccess()`, `handleToggleTechActive()`, `renameWebTecnico()`, `deleteWebTecnico()`, `resolveDeviceName()`, `stopTecniciListeners()`, `stopBannedListeners()`

**Dipendenze:** firebase.js, state.js, utils.js, data.js

**Entry points:** chiamato da `app.js` su route `#/admin/tecnici` e `#/admin/banned`

**Side effects:** Scrive su Firestore (rename, hide/show, delete, ban), fetch GitHub per brand models

**Stato:** stabile

#### `js/aree.js` (218 righe)
**Responsabilità:** Sezione admin "Aree Preferite" — modifica in tempo reale delle aree preferite per ogni dispositivo. Supporta legacy (string) e nuovo formato (oggetto). Rinomina dispositivo.

**Funzioni:** `showAreeDashboard()`, `savePfsAreas()`, `deleteDeviceAreas()`, `renameDevice()`, `stopAreeListener()`

**Dipendenze:** firebase.js, utils.js, state.js

**Entry points:** chiamato da `app.js` su route `#/admin/aree`

**Side effects:** Scrive su Firestore `settings/devices_names`

**Stato:** stabile

#### `js/export.js` (237 righe)
**Responsabilità:** Esportazione tabella materiali in Excel (ExcelJS) e stampa A4 landscape

**Funzioni:** `exportToExcel()`, `printTable()`

**Dipendenze:** utils.js (escapeHtml, showToast, parseQuantity, formatQuantityTotal)

**Stato:** stabile

#### `js/utils.js` (316 righe)
**Responsabilità:** Funzioni trasversali: escape HTML (XSS), date helpers, toast, modali conferma/rinomina (con supporto htmlContent e campi custom), parsing quantità (free + "sparati"), focus trap

**Funzioni:** `escapeHtml()`, `isToday()`, `parseTimestamp()`, `relativeTime()`, `dateOnlyRelativeTime()`, `techStatus()`, `formatDateLabel()`, `showToast()`, `showConfirm()`, `showRenameModal()`, `trapFocus()`, `parseQuantity()`, `formatQuantityTotal()`

**Dipendenze:** nessuna

**Stato:** stabile — fix: showRenameModal ora supporta htmlContent con select/input custom, click-outside persistente (rimosso `once:true` sul listener overlay che veniva consumato dal primo click interno)

### 3.2 HTML / Config / Build

#### `index.html` (191 righe)
**Responsabilità:** Shell HTML SPA: login screen, app shell (topbar, sidebar, content), modali (conferma, rinomina), toast container. Meta tag PWA, skip link, font loading.

**Dipendenze:** js/app.js (entry point module), css/variables.css, css/components.css, css/themes.css, css/responsive.css

**Stato:** stabile

#### `vite.config.js` (70 righe)
**Responsabilità:** Configurazione build Vite + PWA plugin. Output in `docs/`, base `./` per GitHub Pages. Service Worker caching per GitHub raw content e Google Fonts.

**Stato:** stabile

#### `package.json` (19 righe)
**Dipendenze:** vite ^8.0.3, vite-plugin-pwa ^1.2.0

**Scripts:** `dev` (vite), `build` (vite build), `preview` (vite preview)

**Stato:** stabile

### 3.3 CSS

#### `css/variables.css` (143 righe)
**Responsabilità:** Design tokens (colori dark/light, font, radius, shadow, transitions). Reset CSS. Animazioni sfondo (glowing orbs). Focus-visible accessibility. Reduced motion.

**Stato:** stabile

#### `css/components.css` (1123 righe)
**Responsabilità:** Tutti gli stili dei componenti: login, topbar, sidebar, table, toggle switch, content header, snapshot dropdown, button, KPI cards, toast, confirm/rename modals, PFS cards, PFS lookup accordion, region browser, search, spinner, stale badge, scrollbar, status circles, tooltip. Oltre 1100 righe.

**Stato:** stabile — candidato a split (1123 righe, molti componenti). Fix: aggiunta `max-height: calc(100vh - 48px)` e `overflow-y: auto` a `.confirm-box` per scrollabilità modali con contenuto lungo.

#### `css/themes.css` (126 righe)
**Responsabilità:** Override tema chiaro per tutti i componenti (sidebar, table, input, modal, KPI, snapshot, search, ecc.)

**Stato:** stabile

#### `css/responsive.css` (279 righe)
**Responsabilità:** Stili print (A4 landscape), mobile <900px (sidebar drawer, layout stacking, touch targets 44px, iOS zoom prevention, safe-area-inset, bottom sheet modal)

**Stato:** stabile

### 3.4 Documenti e Task

#### `tasks/decisions.md`
Registro decisioni architetturale: schema Firestore, real-time con onSnapshot, presenza RTDB, prevenzione billing spike, paginazione DOM, isolamento payload, divieto write in listener.

#### `tasks/lessons.md`
Errori passati e pattern: toast HTML escaping, DOM sync con onSnapshot, memory leak listener, race condition merge:true, billing spike, write amplification, iOS crash.

#### `tasks/todo.md`
Task completati e rimanenti (PFS Lookup fingerprint più robusto).

#### `tasks/review.md`
Review sessioni passate con cosa/perché/rischi/follow-up.

### 3.5 Altri File

#### `avvia_progetto.bat`
Script Windows: kill process su porta 8000, avvia `npm run dev`, apre browser su localhost:8000.

#### `aggiorna_github.bat`
Script Windows: `npm run build` → `git add/commit/push -f` verso GitHub.

#### `sertori.json`, `sirti.json`
File JSON binari (dati di esempio o cache).

#### `public/icons/icon-192.png`, `public/icons/icon-512.png`
Icone PWA.

#### `.gitignore`
node_modules/, .env, .DS_Store

---

## 4. Punti di Attenzione

### Debito Tecnico / Aree di Miglioramento

1. **`js/data.js` (1680 righe) e `js/pfsLookup.js` (858 righe):** File molto grandi con responsabilità multiple. `data.js` mescola fetch, rendering, stale detection, geocoding, scroll helpers, modale aggiunta materiali con caricamento tecnici globali. `pfsLookup.js` mescola parsing, rendering, region browser, sync Firestore.

2. **[Risolto] `css/components.css`:** Splittato con successo in fogli stile specifici per componente sotto `css/components/`.

3. **[Risolto] Listener multipli su `settings/devices_names`:** Centralizzati in un unico listener globale tramite Pub/Sub in `state.js`, riducendo drasticamente le letture sul database.

4. **Dipendenza Firebase via CDN:** La dashboard carica Firebase JS SDK via URL CDN (`https://www.gstatic.com/...`), non via npm. Questo rende il version tracing difficile e impedisce tree-shaking.

5. **[Risolto] Credenziali e hash hardcoded:** Rimossa la tabella `USERS` e gli hash SHA-256 da `state.js`; l'autenticazione è ora interamente demandata a Firebase Auth con ruoli in Firestore `userRoles/{uid}`.

6. **Geocoding lato client:** `loadGeo()` chiama Nominatim (OpenStreetMap) senza rate limiting né caching persistente. In caso di molti click su location, si rischia rate limiting.

7. **`registerWebUser()` semantica mista:** Registra l'utente web ma se trova `pfsAreas` fa early return — la logica è fragile. Se un admin rimuove le aree preferite da remoto, il web user non sincronizza perché lo skip blocca anche l'aggiornamento `updatedAt`.

### Dipendenze Circolari / Accoppiamenti
- `state.js` non ha dipendenze (pulito)
- `app.js` dipende da TUTTI i moduli (naturale per entry point)
- `auth.js` importa da `data.js` e `pfs.js` (accoppiamento alto)
- `tecnici.js` importa da `data.js` (hidden tecnici, preloadCounts) — accoppiamento stretto
- `pfsLookup.js` e `aree.js` scrivono entrambi su `devices_names` (nessuna coordinazione)

### Codice Duplicato
- `parseOrario()` in `pfs.js` e `parseTimestamp()` in `utils.js` fanno parsing temporale simile
- `pfsLookupToggleStar()` e `pfsRegionToggleStar()` quasi identici
- Logica di toggle/expand PFS cards duplicata tra `pfsLookup.js` (search results) e `showPfsRegionBrowser()` (region browser)

### Rischi Noti
- `exceljs` caricato via CDN on-demand — se CDN non raggiungibile, export fallisce
- [Risolto] Autenticazione backend: migrata a Firebase Authentication nativo con ruoli server-side e security rules
- Cache 24h per liste materiali — dopo modifica lista su GitHub, admin deve premere "Forza Liste/Appalti"
- Gestione multi-tab per presenza RTDB funziona ma aggiunge complessità (`connections/` strategy)
