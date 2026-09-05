<div align="center">

# 💻 TechnicalWork Dashboard — Web Portal

**La Web Application Progressive (PWA) moderna, ad alte prestazioni e zero-costi per il monitoraggio in tempo reale dei cantieri, dei tecnici sul campo, della movimentazione dei materiali e delle risorse geografiche PFS.**

[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/Vanilla_JS-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_RTDB-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Workbox_Service_Worker-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Deployment](https://img.shields.io/badge/GitHub_Pages-Docs-22C55E?style=for-the-badge&logo=github&logoColor=white)](https://pages.github.com/)

---

</div>

## 🌟 Funzionalità Principali

### 📊 Monitoraggio Materiali & Cantieri Live
- **Griglia Dati Reattiva in Tempo Reale**: Visualizzazione immediata della situazione materiali per ciascun tecnico divisa per appalto (*Elecnor*, *Sertori*, *Sirti*, *Consumo*).
- **Snapshot Storici con Hash Routing**: Consultazione delle registrazioni passate (*Oggi, Ieri e giorni precedenti*) con tracciamento temporale preservato.
- **Editing Inline Istantaneo**: Modifica diretta delle quantità materiali con doppio click da parte dell'Amministratore (supporta numeri ed espressioni es. `10 + 2 sparati`).
- **Pulsante "Richiedi Sync Appalto"**: Trigger on-demand nel menu Admin per sollecitare il caricamento immediato dei dati dall'app Android dei tecnici senza attese.
- **Gestione "Nascondi / Riabilita Lista"**: Possibilità per l'Admin di oscurare momentaneamente le liste errate o non desiderate (nascoste ai Non-Admin, visibili all'Admin con opacità ridotta `opacity: 0.45`).

### 👷 Gestione Tecnici & Presenza Real-Time
- **Realtime Database (RTDB) Presence**: Monitoraggio stato online/offline zero-costo tramite WebSockets senza consumo di quote scritture Firestore.
- **Identificazione Dispositivo**: Distinzione visiva tra utenti Web/PC (`💻`) e smartphone Android (`📱`).
- **Gps & Telemetria**: Visualizzazione posizione Google Maps, percentuale batteria del dispositivo e versione dell'app utilizzata.
- **Amministrazione Avanzata**: Rinomina tecnici, disattivazione visibilità e sistema di Killswitch per blocco dispositivi.

### 🗺️ Navigatore Geografico & Lookup PFS
- **PFS Lookup & Aree Preferite**: Ricerca rapidissima di snodi e PFS regionali con paginazione DOM ad alte prestazioni (limite 100 elementi per evitare crash su dispositivi mobili/iOS).
- **Gestione Notifiche PFS**: Allerta PWA nativa per nuove segnalazioni di armadi danneggiati o indirizzi errati inviate dal campo.

### 🎨 Design System & Accessibilità
- **Tema Cyberpunk Dark / Light**: Fogli di stile modularizzati con tavolozza colori ad alto contrasto per ambienti di cantiere e ufficio.
- **Mobile-First & Touch Safe**: Target touch minimi di 44px conformi alle linee guida **WCAG 2.2**, supporto gesture mobile e safe areas per iOS.
- **Esportazione & Stampa**: Export in formato Excel `.xlsx`, stampa formattata e generazione di immagini PNG ad alta risoluzione con condivisione nativa per WhatsApp.

---

## 🏗️ Architettura & Zero-Cost Policy

```mermaid
graph TD
    A[📱 App Android Tecnico] -->|1. Sync Materiali| B[(🔥 Firebase Firestore)]
    A -->|2. Status Online/Offline| C[(⚡ Firebase RTDB)]
    
    WebAdmin[👑 Admin Web Dashboard] -->|3. Richiedi Sync Appalto| B
    WebAdmin -->|4. Toggle Nascondi Lista| B
    
    B -->|Realtime Snapshot Listener| WebApp[💻 PWA Dashboard Web]
    C -->|WebSockets Presence| WebApp
```

### Principi di Ottimizzazione Billing (Piano Spark)
1. **Zero Heartbeat su Firestore**: La presenza in tempo reale utilizza esclusivamente Firebase Realtime Database (RTDB).
2. **Pub/Sub Cache in-Memory**: Un unico listener centralizzato gestisce i dispositivi senza duplicare letture Firebase.
3. **Cache-Busting CDN GitHub**: Aggiornamenti automatici delle configurazioni e masterList via query string `?t=timestamp`.

---

## 🛠️ Stack Tecnologico

- **Bundler & Dev Server**: Vite 8.x + `vite-plugin-pwa` (Workbox Service Worker, offline caching).
- **Frontend Core**: Vanilla JavaScript ES6+ (Modular architecture, Zero framework lock-in).
- **Cloud Database**: Firebase Firestore KTX + Firebase Realtime Database.
- **Styling**: CSS Custom Properties modularizzato in `css/components/` (WCAG 2.2 Accessibilità, Responsive grid).
- **Export Engine**: ExcelJS (CDN) + Canvas Image Renderer per esportazione `.png`.
- **Hosting**: GitHub Pages (`/docs` directory).

---

## 📁 Struttura del Progetto

```
tchwrk2/
├── index.html                  # HTML5 SPA Entry Point & Layout Structure
├── aggiorna_github.bat         # Script automatico di Build e Deploy su GitHub
├── js/
│   ├── app.js                  # Entry point, Router SPA, Theme & Presence Init
│   ├── data.js                 # Rendering Tabella Materiali, Inline Editor & Sync
│   ├── state.js                # Gestione Stato Globale, User Role & Caches
│   ├── tecnici.js              # Gestione Pannello Admin Tecnici e Bloccati
│   ├── pfsLookup.js            # Lookup geografico PFS e Paginazione DOM
│   ├── export.js               # Motore Esportazione Excel, Stampa e Immagini PNG
│   └── firebase.js             # Inizializzazione SDK Firebase Firestore/RTDB
├── css/
│   ├── components/             # Fogli di stile modularizzati per componente
│   ├── main.css                # Variabili cromatiche e reset base
│   └── responsive.css          # Regole Layout Mobile & Touch Targets
└── tasks/                      # Registro decisioni architetturali e storico lezioni
```

---

## 🚀 Sviluppo & Deploy

### Avvio Locale (Dev Server)
```bash
# Installazione dipendenze
npm install

# Avvio server locale Vite
npm run dev
```

### Pubblicazione Automatica su GitHub Pages
Per compilare la versione ottimizzata per la produzione e pubblicarla online con un solo click:

1. Fai doppio click sul file **`aggiorna_github.bat`**.
2. Lo script eseguirà in automatico `npm run build`, creerà il commit ed invierà l'aggiornamento su GitHub Pages!

---

## 🔒 Sicurezza & Regole Firebase (Security Rules)

L'applicazione utilizza **Firebase Authentication** con ruoli gestiti sul cloud tramite la collezione protetta `userRoles/{uid}` (solo console Firebase). I dati sensibili di domicilio e coordinate private dei tecnici sono segregati nella collezione `tecniciPrivate/{deviceId}`, accessibile esclusivamente dall'Admin.

---

### 1. Dove incollare le regole nella Console Firebase

#### Firestore Database (Regole Cloud Firestore):
1. Apri la Console Firebase sul progetto `technicalwork-cloud`.
2. Nel menu a sinistra vai su **Firestore Database** → clicca sulla scheda in alto **Regole** (o *Rules*).
3. Cancella il contenuto attuale, incolla le regole della **VERSIONE A** sottostante e clicca su **Pubblica** (*Publish*).

#### Realtime Database (Regole Presenza Online):
1. Nel menu a sinistra vai su **Realtime Database** → clicca sulla scheda in alto **Regole** (o *Rules*).
2. Incolla il blocco JSON per RTDB e clicca su **Pubblica** (*Publish*).

---

### VERSIONE A — Da pubblicare adesso (Compatibile con App Android)

Questa versione protegge la dashboard e i ruoli utente, blinda i dati sensibili dei tecnici (`tecniciPrivate`) e impedisce manomissioni dei ruoli, **mantenendo aperte le sincronizzazioni dei materiali dell'app Android** che oggi non usa ancora Firebase Auth.

#### Firestore Rules (Versione A):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: verifica se l'utente connesso ha ruolo admin
    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/userRoles/$(request.auth.uid)).data.role == 'admin';
    }

    // 1. Ruoli Utente: leggibile solo da utenti autenticati, NON modificabile dal client
    match /userRoles/{userId} {
      allow read: if request.auth != null;
      allow write: if false; // Solo console Firebase
    }

    // 2. Dati Sensibili Tecnici (Indirizzi casa, coordinate GPS private): SOLO ADMIN
    match /tecniciPrivate/{deviceId} {
      allow read, write: if isAdmin();
    }

    // 3. Impostazioni Dashboard e Dispositivi
    match /settings/{docId} {
      allow read: if true;
      allow write: if true; // Aperto per consentire registrazione dispositivi dall'app Android
    }

    // 4. Liste Materiali Cantieri (Elecnor, Sertori, Sirti, Consumo, ecc.)
    match /{appalto}/{docId} {
      allow read: if true;
      allow write: if true; // Compatibilità temporanea con l'app Android esistente
    }

    // 5. Segnalazioni e Log PFS
    match /pfs_segnalati/{pfsId} {
      allow read, write: if true;
    }
    match /pfs_logs/{logId} {
      allow read, write: if true;
    }

    // 6. Scambi Materiali QR tra tecnici
    match /exchanges/{exchangeId} {
      allow read, write: if true;
    }
  }
}
```

#### Realtime Database Rules (Presenza RTDB):
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

---

### 2. Checklist di Test Manuale nel Browser

Dopo aver pubblicato la Versione A e avviato la dashboard:

- [ ] **Login Stefano (Admin)**: Inserisci `Stefano` (o `stefano@technicalwork.it`) e la password.  
  👉 *Esito atteso*: Accesso consentito, voce "Stefano — Esci" in topbar, menu laterale con sezioni "Tecnici", "Pannello PFS", "Aree Preferite", e pulsante "Richiedi Sync".
- [ ] **Login Piero (Viewer)**: Fai logout e accedi con `Piero` (o `piero@technicalwork.it`) e la password.  
  👉 *Esito atteso*: Accesso consentito, ma le voci amministrative ("Tecnici", "Richiedi Sync", ecc.) sono nascoste.
- [ ] **Test Password Sbagliata**: Inserisci una password errata.  
  👉 *Esito atteso*: Messaggio "Email/Username o password errati", nessun accesso e nessun blocco dell'interfaccia.
- [ ] **Persistenza Sessione (Reload F5)**: Mentre sei dentro la dashboard, premi F5 o ricarica la scheda.  
  👉 *Esito atteso*: L'app si riapre direttamente sui dati senza chiedere nuovamente il login.
- [ ] **Logout Completo**: Clicca su "Esci" in alto a destra e conferma il modale.  
  👉 *Esito atteso*: Ritorno alla schermata di login con campi password resettati.
- [ ] **Caricamento Dati**: Verifica che le tabelle dei materiali e le card KPI continuino a popolarsi regolarmente con i dati dei cantieri.

---

### VERSIONE B — Regole Finali Blindate (Da applicare dopo aggiornamento App Android)

> ⚠️ **Nota:** Da applicare **soltanto** quando l'app Android dei tecnici (nel repository separato `Technicalwork-Materiali`) sarà stata aggiornata implementando il login anonimo (`FirebaseAuth.getInstance().signInAnonymously()`). Una volta applicata questa versione, qualsiasi richiesta proveniente da client non autenticati verrà respinta a monte da Google.

#### Firestore Rules (Versione B):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: verifica se la richiesta proviene da un utente autenticato (dashboard o app Android)
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper: verifica ruolo admin
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/userRoles/$(request.auth.uid)).data.role == 'admin';
    }

    // 1. Ruoli Utente: consultabile da chi è loggato, modificabile SOLO da console
    match /userRoles/{userId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }

    // 2. Dati Sensibili Tecnici: protetti ermeticamente per il solo Admin
    match /tecniciPrivate/{deviceId} {
      allow read, write: if isAdmin();
    }

    // 3. Impostazioni, Materiali, Segnalazioni e Scambi: accesso riservato ad autenticati
    match /settings/{docId} {
      allow read, write: if isAuthenticated();
    }

    match /{appalto}/{docId} {
      allow read, write: if isAuthenticated();
    }

    match /pfs_segnalati/{pfsId} {
      allow read, write: if isAuthenticated();
    }

    match /pfs_logs/{logId} {
      allow read, write: if isAuthenticated();
    }

    match /exchanges/{exchangeId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

---

<div align="center">
  <sub>Sviluppato con ❤️ per il monitoraggio centralizzato dei cantieri **Technicalwork**.</sub>
</div>

