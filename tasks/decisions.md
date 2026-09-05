# decisions.md — Dashboard (tchwrk2)

## 2026-05-12 — Schema collections Firestore

**pfs_segnalati:**
{ nome_pfs, nuovo_indirizzo, comune, tecnico, orario, timestamp_raw, lat?, lng? }

**Aziende (Materiali):**
{ tecnico, ultimo_aggiornamento, appalto, dispositivo, versione_app, materiali: {...}, ordine: [...] }
*Nota:* Questi documenti vengono sovrascritti interamente ad ogni sync dall'app Android, permettendo l'eliminazione effettiva delle righe rimosse.

## 2026-05-13 — Architettura Real-Time e Notifiche

**Full Real-Time:** 
- Passaggio massivo a `onSnapshot()` per i tab (Aree, Tecnici, PFS). Per evitare drain di mem/firebase reads, il router `app.js` forza un "kill" dei listener tramite handler `stop*Listeners()` prima di istanziare la nuova vista.

**Notifiche PFS Globali:**
- L'app aggancia un singolo listener silente al login Admin (`startGlobalPfsNotifications`) su `pfs_segnalati`. Sfrutta l'API Web Notification per i push OS, e fa fallback ai Toast in-app se la tab è a fuoco. Questo garantisce notifiche PWA.

**Sync Snapshot Date (Hash Routing):**
- Gestione della data "visibile" (`currentDate`) spinta nell'hash router. Quando si cambia giorno o si preme "Torna a Oggi", i link della sidebar si modificano retroattivamente, così la navigazione tra Appalti diversi preserva la ricerca dello snapshot storico, e anche i badge dei contatori usano una fetch mirata per la data.

## 2026-05-13 — Listener Globali e Scritture Isolate

**Listener Persistenti (No router cleanup):**
- A differenza dei listener associati alle viste (es. tab Tecnici, Aree), i listener associati a componenti globali (come la Sidebar e la Topbar `presence`) NON vengono uccisi dal router (`stop*Listeners`). Devono sopravvivere al cambio pagina per mantenere sincronizzati i preferiti e il contatore utenti in tutte le schermate.

**Isolamento Payload (Anti Race-Condition):**
- Le routine automatiche di tracciamento hardware/sessione (es. `registerWebUser`) non devono inviare in scrittura l'intero oggetto di configurazione utente (es. con `merge: true`). Se lo facessero, sovrascriverebbero con la propria cache locale i dati custom (es. `name` o `pfsAreas`) appena modificati via Admin Panel.
- *Decisione:* `registerWebUser` invia solo `baseName`, `os`, `browser` etc. Il nome visuale modificabile dall'admin vive nel campo `name` e viene letto con la priorità `name || baseName`. Le preferenze utente (`pfsAreas`) vengono scritte solo dagli handler diretti (click stellina o save admin).

## 2026-05-15 — Prevenzione Billing Spike (Firestore vs RTDB)

**Divieto Heartbeat su Firestore:**
- *Problema:* Il sistema di presenza online faceva ping ogni 45 secondi aggiornando un timestamp su Firestore, generando decine di migliaia di scritture giornaliere.
- *Decisione:* Per qualsiasi sistema di "Presence", utilizzare **sempre e solo Firebase Realtime Database (RTDB)**. Sfruttando le connessioni WebSockets (`.info/connected` e `onDisconnect()`), RTDB scala gratuitamente in background chiudendo le connessioni lato server senza bruciare quota di scritture.

**Divieto Read Massivi per Sidebar Counts:**
- *Problema:* Per mostrare il numerino blu affianco ad ogni azienda nella sidebar, venivano agganciati multipli `onSnapshot()` su tutte le collection.
- *Decisione:* Disabilitare le letture massive asincrone. I counter (badges) della sidebar si popolano *solo* per l'azienda correntemente selezionata nella tab attiva, lasciando il tratto "—" per le altre, abbattendo le letture del 90%.

## 2026-05-16 — Divieto Write Automatiche in Listener Real-Time

**Divieto `checkStaleHashes` dentro `onSnapshot`:**
- *Problema:* `checkStaleHashes()` veniva chiamata ad ogni fire dell'`onSnapshot` live (ogni volta che un qualsiasi tecnico sincronizzava materiali). Con 30 tecnici × 16 sync/giorno × 2 dashboard aperte = ~960 write/giorno solo da questa funzione.
- *Decisione:* `checkStaleHashes()` DEVE essere eseguita **una sola volta** al primo caricamento dell'appalto, e il risultato cachato in `_staleCacheMap` per i render successivi. Il reset avviene solo al cambio appalto (`_staleCheckedForAppalto = null`).

**Divieto Write su Ogni Page Load (`registerWebUser`):**
- *Problema:* `registerWebUser()` usava `updatedAt: Date.now()` che rendeva ogni write sempre diversa, anche se i dati non erano cambiati. Questo generava ~20 write/giorno inutili e attivava in cascata tutti i 2-4 listener su `devices_names`.
- *Decisione:* Utilizzare `sessionStorage` per garantire che la registrazione avvenga **una sola volta per sessione browser**. I dati hardware (OS, browser, cores) non cambiano durante una sessione.

## 2026-05-17 — Paginazione DOM per Ricerca PFS (Evitare OOM Safari)

**Motivazione:**
Con aree geografiche di dimensioni eccezionali (es. area "Roma" ~5800 PFS), l'iniezione massiva nel DOM tramite `content.innerHTML = ...` causava l'esaurimento istantaneo di memoria del browser (freeze o crash WebKit su Safari/iOS).

**Decisione:**
* Creata costante `MAX_VISIBLE_ITEMS = 100`.
* Dopo il parsing dei dati JSON regionali, l'array completo viene trattenuto unicamente in memoria (scoped a livello di modulo) senza caricarlo nel DOM.
* Al rendering iniziale, vengono iniettati solo i primi 100 elementi.
* Se l'array supera i 100 elementi, viene creato un pulsante dinamico `#pfs-load-more` ("Mostra altri"). Al click, appende blocchi da 100 elementi e aggiorna il contatore, rimuovendosi automaticamente quando tutti i dati sono esposti.
* La barra di ricerca text filter opera dinamicamente sull'array in memoria e rigenera il rendering partendo sempre da zero (con limite a 100 + "Mostra altri").

## 2026-05-31 — Sincronizzazione visibilità tecnici in tempo reale & Cache sincrona

**Motivazione:**
Per evitare Roundtrip di rete e chiamate `getDoc` asincrone ripetute su Firestore per recuperare la lista dei tecnici nascosti durante ogni rendering (sia della lista tecnici che della tabella principale), e per far riflettere in tempo reale la deattivazione/attivazione di un tecnico tra dashboard diverse o al cambio di vista.

**Decisione:**
* Sostituita la chiamata asincrona `await getHiddenTecnici()` con la funzione sincrona `getHiddenTecniciSync()`, la quale legge direttamente da una cache in memoria RAM (`_hiddenCache`).
* Introdotto un listener `onSnapshot` globale sul documento `settings/hidden_tecnici` caricato in avvio che aggiorna la cache locale in tempo reale, scatena l'aggiornamento dei badge counts della sidebar, e forza il re-rendering sincrono della tabella dei materiali se l'utente si trova sulla dashboard.
* Rimosse le chiamate manuali e distruttive a `showTecnici()` all'interno delle azioni (Rename, Delete, Toggle) in `tecnici.js`. Il refresh della UI ora avviene in maniera reattiva e nativa tramite i listener `onSnapshot` attivi sugli appalti e sui bannati.

## 2026-05-31 — Editor inline delle quantità materiali

**Motivazione:**
Fornire all'amministratore la capacità di modificare le quantità dei materiali visualizzate nella dashboard in modo immediato, senza aprire modali ingombranti e supportando sia numeri sia espressioni testuali (es. `10 + 2 sparati`).

**Decisione:**
* Le celle della griglia materiali (`.td-value`) espongono l'attributo `data-raw` (contenente la stringa originale) ed espongono un handler `ondblclick` che attiva l'editing.
* Al doppio click, la cella si trasforma in un input di testo che cattura il focus.
* Al `blur` o premendo `Enter`, la modifica viene inviata come update su Firestore. L'`onSnapshot` dell'appalto cattura la modifica e aggiorna la singola cella via rendering incrementale.
* Premendo `Escape`, l'editing viene annullato ripristinando il valore originale in locale.

## 2026-07-04 — CSS Component Splitting e Ottimizzazione Moduli
**Motivazione:**
Il file `css/components.css` conteneva oltre 1200 righe di CSS misto per decine di componenti differenti. Questa struttura monolitica rendeva difficile la manutenzione grafica e favoriva errori di sovrascrittura.
**Decisione:**
* Dividere `css/components.css` in fogli di stile modularizzati e focalizzati per singolo componente sotto la nuova cartella `css/components/`.
* Mantenere `css/components.css` come mero indice composto da regole `@import` per agganciare in automatico i nuovi file e permettere a Vite di compilarli in un unico foglio di stile ottimizzato in produzione.

## 2026-07-04 — Pattern Pub/Sub per settings/devices_names
**Motivazione:**
Molti file caricati in parallelo avevano bisogno di monitorare il documento `settings/devices_names` (per i preferiti delle aree, i nomi dei tecnici online, la lista neri e i tecnici della dashboard). Questo causava registrazioni multiple di `onSnapshot` che duplicavano i dati letti da Firestore.
**Decisione:**
* Centralizzare in `js/state.js` un singolo listener `onSnapshot` su `settings/devices_names` che si attiva solo al login/session restore e si distrugge al logout.
* Esporre le funzioni `subscribeToDevicesNames` e `unsubscribeFromDevicesNames` per consentire ai moduli (`app.js`, `pfsLookup.js`, `tecnici.js` e `aree.js`) di abbonarsi reattivamente alle variazioni del documento leggendo direttamente dalla cache locale senza consumare letture Firebase aggiuntive.

## 2026-07-04 — Accessibilità WCAG 2.2 e Selettori Custom
**Motivazione:**
Le celle modificabili con doppio click non fornivano affordance o supporto per la navigazione a tastiera e screen reader. Inoltre, i tag `<select>` nativi mostravano l'overlay blu standard dei browser e sistemi operativi che stonava con la grafica scura e moderna dell'app.
**Decisione:**
* **Accessibilità**: Aggiunti attributi `tabindex="0"`, `role="button"` e `aria-label` descrittivi dinamici per ciascuna cella modificabile. Registrato un gestore tastiera (`keydown` per `Enter` / `Space`) per aprire l'editor inline ed implementato lo stile CSS `:focus-visible` per un indicatore di fuoco visibile ad alto contrasto.
* **Custom Dropdown Select**: Sostituiti tutti i tag `<select>` delle modali e dei confirm box con un componente custom select (`.custom-select`) formato da trigger button, menu a comparsa div ad hoc e un tag `<input type="hidden">`. Quest'ultimo preserva l'identificativo ID del vecchio select nativo, garantendo il corretto funzionamento di tutta la logica asincrona esistente senza costringere a modifiche dei parser.

## 2026-07-31 — Gestione Richiesta Sync Appalto & Colonna Nascosta/Disabilitata Admin

**Richiesta Sync Appalto On-Demand:**
- Per consentire all'amministratore di forzare l'allineamento dei dati di un determinato appalto (es. *Elecnor*) senza inviare chiamate massive o attivare heartbeat costosi, il pulsante nel drawer scrive un unico timestamp sul documento `settings/dashboard` con i campi `forceSyncAppalto` e `forceSyncRequest`.
- Gli eventi vengono intercettati in tempo reale dagli agenti Android collegati che rispondono avviando il sync della propria azienda.

**Distinzione Permessi per Tecnici Nascosti (Admin vs User):**
- Per gli utenti comuni (Non-Admin), i tecnici compresi nella lista `hidden_tecnici` vengono totalmente filtrati ed omessi dalla griglia materiali.
- Per l'amministratore, l'omissione impediva il ripristino o la diagnosi. Pertanto, nel ramo Admin i documenti nascosti vengono preservati nell'array con la flag `_isHiddenByAdmin = true`.
- La tabella applica lo stile CSS `opacity: 0.45` e `filter: grayscale(0.5)` all'intera colonna del tecnico (header + celle dati), esponendo in cima al nome il pulsante `👁️ Riabilita Lista` per consentire il ripristino istantaneo senza ricaricare la pagina.

## 2026-09-05 — Migrazione Firebase Authentication & Separazione Dati Sensibili

**Motivazione:**
Eliminare le credenziali e gli hash SHA-256 memorizzati in chiaro nel frontend pubblico (`js/state.js`) e consentire l'applicazione di Security Rules native su Firestore e RTDB per proteggere i dati personali (GDPR) e l'integrità dei cantieri a costo zero (Piano Spark).

**Decisioni Architetturali:**
1. **Firebase Authentication nativo**: Sostituita l'autenticazione manuale client-side con Firebase Auth (`signInWithEmailAndPassword`, `signOut`, `onAuthStateChanged`). Supporto trasparente sia per email completa che per username diretto (`Stefano` / `Piero` con dominio automatico `@technicalwork.it`).
2. **Gestione Ruoli server-side (`userRoles/{uid}`)**: I ruoli (`admin` vs `viewer`) vivono in documenti Firestore con ID = `uid` utente. Le regole di sicurezza impediscono qualsiasi scrittura via client a questa collezione, rendendo i ruoli gestibili unicamente tramite Console Firebase.
3. **Segregazione Dati Sensibili Tecnici (`tecniciPrivate/{deviceId}`)**: I campi relativi al domicilio privato dei tecnici (`homeAddress`, `homeLat`, `homeLng`) sono stati spostati dalla collezione generale alla collezione riservata `tecniciPrivate`, accessibile e modificabile unicamente da utenti con ruolo `admin`.
4. **Strategia Regole a Due Fasi (Versione A e B)**: 
   - *Versione A*: Protegge immediatamente dashboard, ruoli e dati sensibili, mantenendo attive le scritture anonime dei materiali per preservare la compatibilità con l'applicazione Android dei tecnici sul campo.
   - *Versione B*: Blindatura totale con autenticazione obbligatoria per qualsiasi richiesta (da pubblicare solo dopo aggiornamento dell'app Android con `signInAnonymously`).

## Stack e Vincoli — Dashboard (tchwrk2)

Stack:
- **Build / Packaging:** Vite 8.x + `vite-plugin-pwa` (Service Worker, Workbox).
- **Frontend:** Vanilla JavaScript (ES modules, nessun framework UI come React/Vue/Angular).
- **Backend / Database:** Firebase Firestore (dati principali) + Firebase Realtime Database (RTDB per presence online).
- **CSS:** Design system custom (CSS custom properties, tema light/dark, layout responsive mobile-first, safe areas per PWA).
- **Hosting / Deployment:** GitHub Pages (`docs/` folder).
- **Esternalità / CDN:** Firebase JS SDK (caricato via CDN gstatic), Google Fonts (Inter, JetBrains Mono), ExcelJS (CDN per export), Nominatim OpenStreetMap (geocoding).

Vincoli:
- **Budget:** Zero-costo (Piano Spark di Firebase, servizi e CDN gratuiti). Nessun servizio o dipendenza a pagamento è consentito.
- **Servizi vietati:** Qualsiasi heartbeat periodico/polling frequente su Firebase Firestore (vietato per evitare addebiti o superamento quota di scrittura).
- **Lingua di lavoro:** Italiano per spiegazioni, commenti, commit e file `tasks/`.




