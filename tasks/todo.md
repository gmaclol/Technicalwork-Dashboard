# todo.md — Dashboard (tchwrk2)

## Obiettivi della Sessione Attuale
- [x] Migrazione da fetch statico (`getDocs`) a realtime (`onSnapshot`) su tutte le tab principali (Tecnici, PFS, Aree).
- [x] Prevenzione leak listener: implementazione distruzione automatica (`stop*Listeners`) in `app.js` al cambio tab.
- [x] Sincronizzazione Real-Time UI (mantieni stato selezioni checkbox e focus cursori testuali durante re-render in background).
- [x] Sistema di Notifiche Globali per nuovi PFS: allerta PWA nativa in background e in-app toast se l'app è in uso (solo account Admin).
- [x] Badge "Segnalazioni non lette" nella barra laterale: counter in tempo reale che si auto-azzera entrando nella tab PFS.
- [x] Ottimizzazione permessi visualizzazione Non-Admin: nascondi orario esatto per `Ieri` e date passate (usa formato "Mer 13/05"), consenti visione KPI Cards.
- [x] Sincronizzazione Navigazione Globale Snapshot: cambio data snapshot propaga a tutti gli appalti nella barra laterale usando logica dell'hash router (`#/appalti/NOME/DATAKEY`).
- [x] **PFS Lookup Sidebar** (2026-05-13): nuova sezione nella sidebar (visibile a tutti, admin e non) sotto APPALTI. Fetch GitHub JSON/txt per area, barra ricerca, stelline preferiti, identificazione utente web (fingerprint → localStorage → Firestore `settings/devices_names` con `type:'web'`, OS, browser, core, RAM). Route `#/pfs-lookup/<area>`. Tab Tecnici: badge 🖥 WEB / 📱 Android.
- [x] UI/UX: Rendere il bottone "Ricerca PFS" più evidente utilizzando la classe `btn-outline` e icona dedicata.
- [x] Topbar: Aggiunto tooltip custom per l'indicatore degli utenti online per supportare l'interazione touch (hold/click) su dispositivi mobili e PWA.
- [x] PWA iOS & Accessibilità: Prevenzione iOS input zoom, target touch aumentati a 44px e supporto safe-area-inset per PWA fullscreen.
- [x] Bugfix: Risolto mancato aggiornamento background del drawer in light mode e crash ricerca PFS su Safari iOS tramite debounce.
- [x] Bugfix (Presence): Gestione `visibilitychange` su PWA per disconnessione tempestiva (chiusura tab, background su iOS/Android) tramite RTDB senza poller Firestore.
- [x] Ottimizzazione Cache/Sync: Aggiunto ricaricamento PWA automatico e risveglio sicuro di Firebase Firestore al rientro dalla modalità sleep senza esaurire i Read Quota gratuiti.

- [x] PFS Lookup: sync stelline bidirezionale con aree preferite Android (oggi solo write Firestore, non lettura remota nella sidebar lookup).
- [x] PFS Lookup: Fix persistenza nomi web user nel pannello Admin (rimossa sovrascrittura in `registerWebUser`).
- [x] PFS Lookup: Fix scomparsa listener sidebar uscendo dalla vista Ricerca (tolto unsubscribe da `stopPfsLookupListener`).
- [x] Dashboard Tecnici: implementato rendering utenti Web e fix stile header divisorio.
- [x] PFS Lookup DOM Pagination: Refactoring rendering DOM per aree massicce (es. Roma ~5800 elementi) con costante `MAX_VISIBLE_ITEMS = 100` e pulsante "Mostra altri" per evitare crash WebKit/Safari su iOS.
- [ ] PFS Lookup: aggiungere fingerprint più robusto (WebGL hash) se necessaria maggiore unicità cross-session.
## 2026-06-23 — Sessione Correzione Bug Router (DeepSeek Regressions)
- [x] Risolto bug parsing hash del router in `app.js` che causava caricamento errato dell'appalto e snapshot (slicing non corretto del prefisso `#/`).
- [x] Sincronizzato correttamente l'indicatore dell'appalto attivo in topbar (`#tb-appalto`) in risposta all'evento `hashchange`.
- [x] Eseguito build del bundle di produzione (`npm run build`) per riflettere le modifiche.
- [x] Eseguito `graphify update .` per mantenere aggiornato il grafo della conoscenza.

## 2026-06-23 — Sessione Revisione Sicurezza e Bug Critici
- [x] Fix crash: window.open() null guard (export.js)
- [x] Fix crash: .toFixed() su lat/lng undefined (pfs.js)
- [x] Fix crash: stale currentAppalto inline editor (data.js)
- [x] Fix crash: listener controllerchange duplicato (app.js)
- [x] Fix XSS: showConfirm() textContent sempre (utils.js)
- [x] Fix XSS: escape nomi tecnici/materiali Firestore (data.js)
- [x] Fix XSS: escape dati stampa popup (export.js)
- [x] Fix XSS: escapeHtml in aree.js, pfsLookup.js, app.js sidebar
- [x] Fix iOS: -webkit-appearance su select/button (components.css)
- [x] Fix iOS: 100vh → 100dvh (responsive.css)
- [x] Fix: logout icon SVG power-off (responsive.css)
- [x] Fix: location mobile mostra indirizzo al 1° click (responsive.css)
- [x] Fix: localStorage try/catch (state.js, auth.js)
- [x] Fix: try/catch in async onSnapshot callback (data.js)
- [x] Fix: guard listener arrays tecnici.js
- [x] Fix: .catch(()=>{}) → warn log (pfsLookup.js)

## 2026-06-20 — Sessione Corrente
- [x] Ottimizzazione PWA mobile — tabella materiali/appalti: layout compatto, KPI su riga singola, sticky header/colonna rafforzata, font/padding ridotti, `tech-location` → icona 📍.
- [x] Aggiunto `KEYS.md` e `tasks/KEYS.md` a `.gitignore`.
- [x] Documentata sezione **Stack e Vincoli** in `tasks/decisions.md` (budget zero-costo).


## 2026-05-28 — Sessione Precedente
- [x] Scansione completa codebase e popolamento `tasks/struttura.md`
- [x] Aggiornamento `tasks/review.md` con resoconto finale

## 2026-05-31 — Sessione Corrente
- [x] Correzione ed attivazione dei tasti "Rinomina" ed "Elimina" sulle righe materiale dei tecnici in dashboard.
- [x] Risoluzione ReferenceError `modalMsg` ed errata logica di annullamento `choice` in `data.js`.
- [x] Miglioramento sicurezza stringhe con l'uso dei data-attributes per l'handling dell'evento click sui materiali in `renderTable`.
- [x] Correzione precompilazione input modal in `renameWebTecnico` (`tecnici.js`) ed incremento robustezza in `showRenameModal` (`utils.js`).
- [x] Sincronizzazione in tempo reale delle modifiche/deattivazioni dei tecnici in dashboard (rimossi refresh forzati, aggiunto listener globale su `hidden_tecnici` ed in-memory cache).
- [x] Listener in tempo reale per la lista dei dispositivi bloccati (Killswitch) in `showBanned()`.
- [x] Implementazione mini-editor inline per la modifica istantanea delle quantità (doppio click sulle celle materiali Admin Live).
- [x] Fix: aggiunto optimistic DOM update immediato in `editMaterialRow`, `deleteMaterialRow` e `addMaterialRow` (`data.js`) per feedback UI istantaneo.
- [x] Feature: pulsante (+) nella tabella (accanto a "Materiale") per aggiungere righe materiali custom con "Aggiungi per tutti" / "Solo per selezionato".
- [x] Feature: tasto elimina adesso supporta "Elimina per tutti" / "Solo per selezionato" con select tecnico (stessa UX della rinomina).

## 2026-06-22 — Sessione Corrente
- [x] **Fix bug tecnico nascosto ricompare come attivo:** Risolto il bug per cui un tecnico disattivato (nella lista `hidden_tecnici`) ricompariva come attivo sulla tabella della dashboard ogni volta che l'app Android eseguiva un sync o uno scambio QR. Il filtro `.filter(d => !hidden.includes(d.tecnico || d.id))` usava il corto-circuito dell'operatore `||`: poiché `d.tecnico` (il nome display) è sempre truthy, `d.id` (il deviceId stabile) non veniva mai valutato e il filtro fallirà se il nome utente non fa match perfetto con quello nella lista `hidden`.
- [x] **Fix "ogni tanto" — tecnici disabilitati riappaiono senza causa apparente:** Risolti 4 bug residui che causavano la riapparizione intermittente dei tecnici disabilitati:
  - **Bug 1 (critico, `data.js`):** `_hiddenCache = null` in `loadAppalto()` e `selectAppalto()` azzerava la cache in-memory. Il listener `onSnapshot` su `hidden_tecnici` non rifà fuoco se i dati non cambiano, quindi `getHiddenTecniciSync()` restituiva `[]` finché un altro toggle non riattivava il listener. Rimossi entrambi gli azzeramenti.
  - **Bug 2 (`data.js:951`):** Ramo snapshot di `loadAppalto` usava ancora `.filter(d => !hidden.includes(d.tecnico || d.id))` (vecchio pattern buggato) invece di `isHiddenDoc(d, hidden)`.
  - **Bug 3 (`data.js:214`):** `updateSidebarCountsForDate` in modalità snapshot usava `currentHidden.includes(data.tecnico || d.id.split('_')[0])` invece di `isHiddenDoc`.
  - **Bug 4 (`tecnici.js:183`):** `showTecnici` controllava la visibilità con `!hidden.includes(name)` (case-sensitive, solo per nome), sostituito con `!hidden.some(h => h.toLowerCase() === name.toLowerCase())`.

## 2026-06-22 — Sessione 2
- [x] **Fix scrollabilità menu admin su mobile PWA:** I pannelli admin (`.tecnici-panel`) su mobile non avevano scroll proprio e il container `.content` aveva `overflow: hidden !important`, intrappolando il contenuto fuori viewport. Aggiunte 3 righe CSS in `responsive.css` dentro `@media (max-width: 900px)`: `.tecnici-panel { overflow-y: auto; flex: 1; min-height: 0; }`.
- [x] **Fix race condition `_hiddenCache` all'avvio + badge sidebar non aggiornato:** Due bug combinati facevano sì che un tecnico nascosto riapparisse nella griglia materiali e nel badge sidebar dopo sync dal telefono, persistendo fino a F5:
  - **Bug 1 (race condition, `data.js`):** `_hiddenCache = null` all'avvio — i listener `onSnapshot` sugli appalti si attivavano prima del listener su `hidden_tecnici`, ricevendo `[]` come hidden list e filtrando nessun tecnico. **Fix:** Eager fetch di `_hiddenCache` in `preloadCounts()` con `getDoc` prima di montare i listener.
  - **Bug 2 (badge non aggiornato, `data.js`):** Quando il listener `hidden_tecnici` finalmente si attivava, chiamava `triggerTableRenderWithHidden()` che ri-filtrava correttamente la tabella ma non aggiornava `_liveCounts[currentAppalto]` né il badge `cnt-*` nella sidebar. **Fix:** Aggiunto aggiornamento di `_liveCounts` e `cnt-<appalto>` dopo il re-render in `triggerTableRenderWithHidden()`.
  - **Fix accessorio (`app.js`):** `buildSidebar()` chiamava `preloadCounts()` senza `await`, quindi `handleHashChange()` poteva scatenare il primo render prima che `_hiddenCache` fosse popolato. Aggiunto `await preloadCounts()`.

## 2026-06-23 — Sessione PWA Bugfix (Theme Switcher, Online Count, Routing e Tooltip)
- [x] **Riparato Theme Switcher su mobile/PWA:** Risolto bug per cui il pulsante cambia tema (`.btn-theme`) appariva come cerchio vuoto senza icona. Aggiunto pseudo-elemento `.btn-theme::before` con SVG mask di una luna crescente (`🌙`) per il tema dark e di un sole (`☀️`) per il tema light.
- [x] **Riparato Contatore Online su mobile/PWA:** Risolto bug per cui l'indicatore degli utenti online (`#topbar-online`) rimaneva nascosto anche per l'amministratore a causa di `style="display:none;"` inline. Abilitato a `flex` all'avvio in `app.js` e nascosto a `none` su logout.
- [x] **Risolto blocco caricamento Bloccati e PFS Lookup:** Sistemato il router in `app.js` importando correttamente `showBanned` e `showPfsRegionBrowser` e chiamandole direttamente invece di controllare i riferimenti inesistenti `window.showBanned` e `window.showPfsRegionBrowser`.
- [x] **Riparato Hold Utenti Online su Mobile:** Aggiunto il container `.online-tooltip` dentro l'HTML di `#topbar-online` ed associati i listener per eventi `pointerdown`, `pointerup` e `pointerleave` per mostrare e nascondere la lista degli utenti online sul tocco senza attivare menu contestuali nativi.
- [x] **Uniformità e Allineamento Topbar:** Ridimensionato il pulsante cambia tema a `36px` per allinearsi perfettamente con le dimensioni del pulsante logout su mobile.
- [x] **Build di Produzione:** Ricompilata l'applicazione (`npm run build`) per rigenerare la cartella `docs/` e aggiornato il grafo della conoscenza.

## 2026-06-23 — Sessione Accessibilità PWA, Gestione Scroll-Lock e Icone Dispositivo
- [x] **Riparato click-to-close del Drawer:** Associato evento `pointerdown` su `#sidebar-overlay` per chiudere istantaneamente il drawer su mobile senza ritardi.
- [x] **Scroll Lock sui Modali:** Configurato il blocco dello scroll del body all'apertura dei modali di conferma e rinomina, oltre che del Drawer.
- [x] **Tasto Escape (Esc) globale sui Modali:** Abilitata la chiusura dei modali alla pressione di `Escape` indipendentemente dall'elemento attualmente a fuoco.
- [x] **Emoji di Presenza:** Configurato l'indicatore di presenza online per distinguere PC (`💻`) e smartphone (`📱`).
- [x] **Build di Produzione:** Rigenerato il bundle pre-compilato nella cartella `docs/` ed allineato il grafo.

## 2026-06-27 — Sessione Overhaul Sistema Aggiunta/Modifica/Eliminazione Materiali
- [x] **Supporto HTML nei Confirm Dialogs:** Aggiunto il parametro `asHtml: true` a `showConfirm` per supportare il rendering di tag HTML (come il dropdown `<select>` dei tecnici) ed evitare che venisse renderizzato come testo semplice per via di `.textContent`.
- [x] **Overhaul addMaterialRow, editMaterialRow, deleteMaterialRow:**
  - Letto l'elemento di selezione del tecnico PRIMA della chiusura del modale per evitare race condition ed elementi persi.
  - Implementata la validazione dei nomi dei materiali inseriti dall'utente (no stringhe vuote, lunghezza massima 120 caratteri, e divieto di caratteri speciali non ammessi da Firestore quali `.` `/` `[` `]` `~` `*`).
  - Ottimizzate le scritture Firestore rendendole parallele tramite `Promise.all` invece di cicli sequenziali lenti.
- [x] **Prevenzione Modifica Materiali Standard:**
  - Integrata una restrizione per impedire modifiche o eliminazioni dei materiali standard dell'appalto (come modems/ONT, drop cable, ecc., contenuti nelle liste `lista.txt` o `Nomeappalto.txt` scaricate da GitHub).
  - Rimossi i pulsanti delle azioni rapide per i materiali standard dalla visualizzazione della tabella materiali, lasciandoli attivi solo per i materiali custom (extra).
- [x] **Refactoring Import Dinamici Redondanti:** Rimossi gli import dinamici non necessari all'interno di `js/tecnici.js` per risolvere i warning `[INEFFECTIVE_DYNAMIC_IMPORT]` di Vite e rendere il bundle di produzione più pulito.
- [x] **Tracciamento Ultima Sessione Utenti Web:** Nella tab dei Tecnici, sotto la sezione "Dashboard Web", lo stato di presenza online e l'ultima sessione attiva vengono ora letti in real-time da Firebase Realtime Database (RTDB) e visualizzati esplicitamente (con etichetta "Ultima sessione: [data]" o "🟢 Online ora").
- [x] **Build di Produzione:** Rigenerata la build di produzione (`npm run build`) in `docs/` e service worker.
