# Graph Report - tchwrk2  (2026-09-07)

## Corpus Check
- 51 files · ~420,040 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1021 nodes · 1930 edges · 68 communities (64 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fd204dcd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- workbox-4b126c97.js
- Workflow Operativo AI-Assisted per Progetti Software
- 3.1 JavaScript Core
- pfsLookup.js
- index-BshJaYP4.js
- auth.js
- Node.js Best Practices
- Node.js Backend Patterns
- Convenzioni di Codice e Architettura — Dashboard (tchwrk2)
- showToast
- SEO optimization
- 💻 TechnicalWork Dashboard — Web Portal
- Principi Fondamentali
- Vite Features
- lessons.md — Dashboard (tchwrk2)
- tecnici.js
- app.js
- package.json
- 16. Graphify — Mappa della Conoscenza
- loadAppalto
- Rolldown Migration (Vite 8)
- WCAG 2.2 Quick Reference
- Accessibility (a11y)
- Task: Analisi Codebase e Popolamento struttura.md
- review.md — Dashboard (tchwrk2)
- Accessibility Code Patterns
- Operable
- decisions.md — Dashboard (tchwrk2)
- Environment API (Vite 6+)
- Vite
- Common ARIA patterns
- 3. Mappa del Progetto (struttura.md)
- 17. Stack Tecnologico e Vincoli di Progetto
- todo.md — Dashboard (tchwrk2)
- 1. Modalità Piano Obbligatoria
- 2. Gestione Task
- 10. Ricerca Eleganza (Bilanciata)
- 13. Review Finale (review.md)
- Understandable
- 8. Correzione Autonoma Bug
- 9. Verifica Prima del Completamento
- F
- Build and SSR
- notifications.js
- P
- Vite Configuration
- Z
- get
- data.js
- Vite Plugin API
- JavaScript API
- Integrazione Dashboard: Feature Toggle Accesso PFS per Dispositivo
- Vite-Specific Hooks
- i
- Key Config Options
- Perceivable
- Common issues by impact
- frontend-design/SKILL.md
- GENERATION.md
- 🛡️ Guida di Sicurezza: Migrazione Dashboard & Tasklist per App Android
- h

## God Nodes (most connected - your core abstractions)
1. `lessons.md — Dashboard (tchwrk2)` - 43 edges
2. `showToast()` - 39 edges
3. `n()` - 36 edges
4. `o()` - 30 edges
5. `F()` - 29 edges
6. `handleHashChange()` - 25 edges
7. `escapeHtml()` - 23 edges
8. `Workflow Operativo AI-Assisted per Progetti Software` - 22 edges
9. `t()` - 21 edges
10. `review.md — Dashboard (tchwrk2)` - 20 edges

## Surprising Connections (you probably didn't know these)
- `addMaterialRow()` --indirect_call--> `t()`  [INFERRED]
  js/data.js → docs/assets/index-BshJaYP4.js
- `renderTable()` --indirect_call--> `d()`  [INFERRED]
  js/data.js → docs/workbox-4b126c97.js
- `initGlobalHiddenListsListener()` --indirect_call--> `d()`  [INFERRED]
  js/data.js → docs/workbox-4b126c97.js
- `loadAppalto()` --indirect_call--> `d()`  [INFERRED]
  js/data.js → docs/workbox-4b126c97.js
- `triggerTableRenderWithHidden()` --indirect_call--> `d()`  [INFERRED]
  js/data.js → docs/workbox-4b126c97.js

## Import Cycles
- None detected.

## Communities (68 total, 4 thin omitted)

### Community 0 - "workbox-4b126c97.js"
Cohesion: 0.27
Nodes (7): constructor(), ct(), deleteCacheAndMetadata(), ht(), M, nt(), W()

### Community 1 - "Workflow Operativo AI-Assisted per Progetti Software"
Cohesion: 0.12
Nodes (16): 11. Protocollo Apertura Sessione, 12. Protocollo Chiusura Sessione, 14. Regole Anti-Degrado, 15. Filosofia Operativa, 18. Continuità Multi-Agente e Multi-Account, 4. Registro Decisioni (decisions.md), 5. Lessons Learned (lessons.md), 6. Analisi Parallela (senza sub-agenti) (+8 more)

### Community 2 - "3.1 JavaScript Core"
Cohesion: 0.04
Nodes (48): 1. Architettura Generale, 2.1 Login e Sessione, 2.2 Navigazione SPA (Hash Router), 2.3 Caricamento Griglia Materiali (Flusso Principale), 2.4 Presenza Online (RTDB), 2.5 PFS Lookup (Ricerca Aree), 2.6 Notifiche Globali PFS, 2.7 Export e Stampa (+40 more)

### Community 3 - "pfsLookup.js"
Cohesion: 0.09
Nodes (41): _activeRegions, _allAreas, _allPfsParsed, buildPfsItemsHtml(), _cacheArea(), _currentFilteredList, DEFAULT_FAVORITES, discoverAvailableRegions() (+33 more)

### Community 4 - "index-BshJaYP4.js"
Cohesion: 0.06
Nodes (103): An(), ar(), At(), be(), Br(), bt(), ce(), Cn() (+95 more)

### Community 5 - "auth.js"
Cohesion: 0.15
Nodes (24): checkSession(), doLogin(), doLogout(), showApp(), showLoginError(), requestNotificationPermission(), stopGlobalPfsNotifications(), APPALTI (+16 more)

### Community 6 - "Node.js Best Practices"
Cohesion: 0.05
Nodes (39): 10. Anti-Patterns to Avoid, 11. Decision Checklist, 1. Framework Selection (2025), 2. Runtime Considerations (2025), 3. Architecture Principles, 4. Error Handling Principles, 5. Async Patterns Principles, 6. Validation Principles (+31 more)

### Community 7 - "Node.js Backend Patterns"
Cohesion: 0.06
Nodes (33): API Response Format, Authentication & Authorization, Caching Strategies, Database Patterns, Dependency Injection, DI Container, JWT Authentication, MongoDB with Mongoose (+25 more)

### Community 8 - "Convenzioni di Codice e Architettura — Dashboard (tchwrk2)"
Cohesion: 0.09
Nodes (21): 1. Naming Conventions, 2. Architettura — Dove Vive la Logica, 3.1 Real-Time (onSnapshot / onValue) vs Statico (getDocs), 3.2 Prevenzione Memory Leak e Sovrascritture DOM, 3.3 Cache Sincrona in RAM, 3.4 Autenticazione e Ruoli (Firebase Auth), 3. Gestione dello Stato e Firebase, 4.1 Gestione delle Exception (+13 more)

### Community 9 - "showToast"
Cohesion: 0.14
Nodes (31): deleteDeviceAreas(), renameDevice(), savePfsAreas(), showAreeDashboard(), stopAreeListener(), addMaterialRow(), buildCustomSelect(), deleteMaterialRow() (+23 more)

### Community 10 - "SEO optimization"
Cohesion: 0.06
Nodes (34): Article, Breadcrumbs, Crawlability, Critical, FAQ, Font sizes, Heading structure, High priority (+26 more)

### Community 11 - "💻 TechnicalWork Dashboard — Web Portal"
Cohesion: 0.08
Nodes (23): 1. Dove incollare le regole nella Console Firebase, 2. Checklist di Test Manuale nel Browser, 🏗️ Architettura & Zero-Cost Policy, Avvio Locale (Dev Server), 🎨 Design System & Accessibilità, Firestore Database (Regole Cloud Firestore):, Firestore Rules (Versione A):, Firestore Rules (Versione B): (+15 more)

### Community 12 - "Principi Fondamentali"
Cohesion: 0.25
Nodes (8): Contesto Minimo Necessario, Gestione Chiavi e Segreti, Non Aggiungere Nulla di Non Richiesto, Principi Fondamentali, Quando Chiedere vs Quando Procedere, Semplicità Prima di Tutto, Standard Senior, Utente Non Tecnico

### Community 13 - "Vite Features"
Cohesion: 0.09
Nodes (22): Asset Import Queries, Built-in Constants, CSS Modules, Custom Queries, Custom Variables, Eager Loading, Environment Variables, Explicit URL (+14 more)

### Community 14 - "lessons.md — Dashboard (tchwrk2)"
Cohesion: 0.05
Nodes (43): Errore: `100vh` su iOS causa overflow layout, Errore: `appearance: none` senza prefisso iOS, Errore: Async callback dentro `onSnapshot` senza try/catch, Errore: Autenticazione solo client-side e hash password nel repository pubblico, Errore Billing Spike Firestore (Reads e Writes), Errore: Celle interattive e controlli in-app inaccessibili da tastiera e screen reader, Errore: Crash di WebKit/Safari su iOS con liste DOM massicce (~5000+ nodi), Errore Crash Ricerca iOS e Accessibilità (+35 more)

### Community 15 - "tecnici.js"
Cohesion: 0.10
Nodes (25): getCountListeners(), getHiddenTecnici(), resetHiddenCache(), resetLastRenderedKey(), saveHiddenTecnici(), setHiddenCache(), _bannedDeviceNames, _bannedDevicesCache (+17 more)

### Community 16 - "app.js"
Cohesion: 0.09
Nodes (35): applyTheme(), buildSidebar(), _deviceNamesCache, handleHashChange(), initPresence(), stopPresence(), toggleTheme(), updateSidebarHrefsAndCounts() (+27 more)

### Community 17 - "package.json"
Cohesion: 0.09
Nodes (21): baseline-browser-mapping, caniuse-lite, author, dependencies, baseline-browser-mapping, caniuse-lite, description, devDependencies (+13 more)

### Community 18 - "16. Graphify — Mappa della Conoscenza"
Cohesion: 0.29
Nodes (7): 16. Graphify — Mappa della Conoscenza, Aggiornamento Intelligente (risparmio quota gratuita), Build del grafo, Comandi utili, Credenziali, Output, Prerequisiti

### Community 19 - "loadAppalto"
Cohesion: 0.34
Nodes (14): d(), getHiddenTecniciSync(), getHiddenTodaySync(), initGlobalHiddenListener(), initGlobalHiddenListsListener(), isHiddenDoc(), loadAppalto(), preloadCounts() (+6 more)

### Community 20 - "Rolldown Migration (Vite 8)"
Cohesion: 0.17
Nodes (12): Config Migration, Custom Transform Targets, esbuild → oxc, Gradual Migration, JSX Configuration, New Capabilities, Overriding Vite in Frameworks, Performance Impact (+4 more)

### Community 21 - "WCAG 2.2 Quick Reference"
Cohesion: 0.18
Nodes (8): Level A (minimum), Level AA (standard), Level AAA (enhanced), Sources, Success criteria by level, Testing tools, WCAG 2.2 Quick Reference, What changed from 2.1 to 2.2

### Community 22 - "Accessibility (a11y)"
Cohesion: 0.20
Nodes (10): Accessibility (a11y), ARIA usage (4.1.2), Automated testing, Conformance levels, Live regions (4.1.3), Manual testing, References, Robust (+2 more)

### Community 23 - "Task: Analisi Codebase e Popolamento struttura.md"
Cohesion: 0.15
Nodes (12): 1. Architettura Generale, 2. Flussi Dati Principali, 3. Mappa dei File, 4. Punti di Attenzione, Criteri di Completamento, Istruzioni di Scansione, Obiettivo, Output Finale (+4 more)

### Community 24 - "review.md — Dashboard (tchwrk2)"
Cohesion: 0.10
Nodes (20): 2026-05-13 — Sessione Aggiornamento Real-Time & Notifiche, 2026-05-13 — Sessione Ricerca PFS Sidebar & Web Users Sync, 2026-05-15 — Fix PWA iOS Safari Crash e Accessibilità (a11y), 2026-05-15 — Ottimizzazione Firebase: Risoluzione Spike Reads e Writes, 2026-05-16 — Audit e Fix Write Firestore Eccessive, 2026-05-16 — Ottimizzazione Caching e Sincronizzazione Real-Time, 2026-05-17 — Sessione Ottimizzazione PWA iOS Safari (Pagine DOM), 2026-05-28 — Scansione Completa Codebase e Popolamento struttura.md (+12 more)

### Community 25 - "Accessibility Code Patterns"
Cohesion: 0.22
Nodes (9): Accessibility Code Patterns, ARIA tabs, Dragging movements, Error handling, Form labels, Live regions and notifications, Modal focus trap, Screen reader commands (+1 more)

### Community 26 - "Operable"
Cohesion: 0.22
Nodes (9): Dragging movements (2.5.7) — new in 2.2, Focus not obscured (2.4.11) — new in 2.2, Focus visible (2.4.7), Keyboard accessible (2.1), Motion (2.3), Operable, Skip links (2.4.1), Target size (2.5.8) — new in 2.2 (+1 more)

### Community 27 - "decisions.md — Dashboard (tchwrk2)"
Cohesion: 0.12
Nodes (15): 2026-05-12 — Schema collections Firestore, 2026-05-13 — Architettura Real-Time e Notifiche, 2026-05-13 — Listener Globali e Scritture Isolate, 2026-05-15 — Prevenzione Billing Spike (Firestore vs RTDB), 2026-05-16 — Divieto Write Automatiche in Listener Real-Time, 2026-05-17 — Paginazione DOM per Ricerca PFS (Evitare OOM Safari), 2026-05-31 — Editor inline delle quantità materiali, 2026-05-31 — Sincronizzazione visibilità tecnici in tempo reale & Cache sincrona (+7 more)

### Community 28 - "Environment API (Vite 6+)"
Cohesion: 0.22
Nodes (9): Backward Compatibility, Basic Configuration, Concept, Custom Environment Instances, Environment API (Vite 6+), Environment Options, Multiple Environments, Plugin Environment Access (+1 more)

### Community 29 - "Vite"
Cohesion: 0.22
Nodes (9): Advanced, Build & SSR, CLI Commands, Common Config, Core, Official Plugins, Preferences, Quick Reference (+1 more)

### Community 30 - "Common ARIA patterns"
Cohesion: 0.25
Nodes (8): Buttons, Common ARIA patterns, Error states, Form fields, Links, Live regions, Modals, Navigation

### Community 31 - "3. Mappa del Progetto (struttura.md)"
Cohesion: 0.33
Nodes (6): 3. Mappa del Progetto (struttura.md), Formato, Non limitarti a elencare file, Per ogni file significativo documenta, Quando aggiornare struttura.md, Regola Critica

### Community 32 - "17. Stack Tecnologico e Vincoli di Progetto"
Cohesion: 0.50
Nodes (4): 17. Stack Tecnologico e Vincoli di Progetto, All'avvio di un nuovo progetto (o se la sezione manca), Formato consigliato in decisions.md, Regola

### Community 33 - "todo.md — Dashboard (tchwrk2)"
Cohesion: 0.10
Nodes (19): 2026-05-28 — Sessione Precedente, 2026-05-31 — Sessione Corrente, 2026-06-20 — Sessione Corrente, 2026-06-22 — Sessione 2, 2026-06-22 — Sessione Corrente, 2026-06-23 — Sessione Accessibilità PWA, Gestione Scroll-Lock e Icone Dispositivo, 2026-06-23 — Sessione Correzione Bug Router (DeepSeek Regressions), 2026-06-23 — Sessione PWA Bugfix (Theme Switcher, Online Count, Routing e Tooltip) (+11 more)

### Community 34 - "1. Modalità Piano Obbligatoria"
Cohesion: 0.50
Nodes (4): 1. Modalità Piano Obbligatoria, Il piano deve contenere, Procedura, Re-plan Automatico

### Community 35 - "2. Gestione Task"
Cohesion: 0.50
Nodes (4): 2. Gestione Task, Dopo il lavoro, Durante il lavoro, Prima di iniziare

### Community 36 - "10. Ricerca Eleganza (Bilanciata)"
Cohesion: 0.67
Nodes (3): 10. Ricerca Eleganza (Bilanciata), Attenzione, Domanda obbligatoria

### Community 37 - "13. Review Finale (review.md)"
Cohesion: 0.67
Nodes (3): 13. Review Finale (review.md), Contenuti, Obiettivo

### Community 38 - "Understandable"
Cohesion: 0.25
Nodes (8): Accessible authentication (3.3.8) — new in 2.2, Consistent help (3.2.6) — new in 2.2, Consistent navigation (3.2.3), Error handling (3.3.1, 3.3.3), Form labels (3.3.2), Page language (3.1.1), Redundant entry (3.3.7) — new in 2.2, Understandable

### Community 39 - "8. Correzione Autonoma Bug"
Cohesion: 0.67
Nodes (3): 8. Correzione Autonoma Bug, Procedura, Vietato

### Community 40 - "9. Verifica Prima del Completamento"
Cohesion: 0.67
Nodes (3): 9. Verifica Prima del Completamento, Domanda Finale, Verifiche obbligatorie

### Community 42 - "F"
Cohesion: 0.23
Nodes (6): F, s, st(), y(), loadBrandModels(), resolveDeviceName()

### Community 43 - "Build and SSR"
Cohesion: 0.25
Nodes (7): Build and SSR, Library Mode, Multi-Page App, Multiple Entries, Output Formats, Package.json Setup, SSR Development

### Community 45 - "notifications.js"
Cohesion: 0.47
Nodes (8): clearBannedBadge(), clearPfsBadge(), clearTecniciBadge(), notifyBannedAccessAttempt(), notifyNewTecnico(), notifyPfsReport(), sendSystemNotification(), updateHomescreenBadge()

### Community 46 - "P"
Cohesion: 0.20
Nodes (6): B(), nt(), L(), P, r, x()

### Community 48 - "Vite Configuration"
Cohesion: 0.29
Nodes (6): Async Config, Basic Setup, Conditional Config, TypeScript Intellisense, Using Environment Variables in Config, Vite Configuration

### Community 49 - "Z"
Cohesion: 0.16
Nodes (4): et, G(), V, Z

### Community 50 - "get"
Cohesion: 0.21
Nodes (3): a, get(), k()

### Community 51 - "data.js"
Cohesion: 0.16
Nodes (27): checkStaleHashes(), _countListeners, filterMaterials(), _geoCache, _hiddenTodayCache, _lastAllDocs, _lastRenderedTecNames, _lastRenderedValues (+19 more)

### Community 53 - "Vite Plugin API"
Cohesion: 0.29
Nodes (7): Basic Structure, Client-Server Communication, Conditional Application, Plugin Ordering, Universal Hooks (from Rolldown), Virtual Modules, Vite Plugin API

### Community 54 - "JavaScript API"
Cohesion: 0.33
Nodes (6): build, createServer, JavaScript API, loadEnv, preview, resolveConfig

### Community 55 - "Integrazione Dashboard: Feature Toggle Accesso PFS per Dispositivo"
Cohesion: 0.18
Nodes (10): 1. Contesto & Obiettivo di Sicurezza, 2. Struttura Dati Firestore, 3. Requisiti UI nella Dashboard Web, 4.1. Lettura dello stato iniziale, 4.2. Salvataggio su Firestore alla commutazione dello slider, 4. Logica JavaScript da Implementare nella Dashboard, 5. Checklist di Collaudo, Esempio Record Dispositivo in `settings/devices_names` (+2 more)

### Community 56 - "Vite-Specific Hooks"
Cohesion: 0.33
Nodes (6): config, configResolved, configureServer, handleHotUpdate, transformIndexHtml, Vite-Specific Hooks

### Community 58 - "Key Config Options"
Cohesion: 0.33
Nodes (6): build.target, define (Global Constants), Key Config Options, plugins, resolve.alias, server.proxy

### Community 59 - "Perceivable"
Cohesion: 0.50
Nodes (4): Color contrast (1.4.3, 1.4.6), Media alternatives (1.2), Perceivable, Text alternatives (1.1)

### Community 60 - "Common issues by impact"
Cohesion: 0.50
Nodes (4): Common issues by impact, Critical (fix immediately), Moderate (fix soon), Serious (fix before launch)

### Community 64 - "🛡️ Guida di Sicurezza: Migrazione Dashboard & Tasklist per App Android"
Cohesion: 0.20
Nodes (9): 📌 1. Riepilogo di quanto già fatto sulla Dashboard (`Technicalwork-Dashboard`), 📱 2. Cosa bisogna fare sull'App Android (`Technicalwork-Materiali`), 🔒 3. Cosa fare su Firestore dopo aver aggiornato l'App Android (VERSIONE B - Blindatura Totale), 🧹 4. Pulizia opzionale finale dei dati vecchi (GDPR), 🛡️ Guida di Sicurezza: Migrazione Dashboard & Tasklist per App Android, Procedura:, 📋 Prompt pronto da incollare quando aprirai la sessione sul repo Android:, Regole Cloud Firestore (VERSIONE B - Definitiva): (+1 more)

## Knowledge Gaps
- **484 isolated node(s):** `_deviceNamesCache`, `_staleCacheMap`, `_lastAllDocs`, `_countListeners`, `_liveCounts` (+479 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `t()` connect `index-BshJaYP4.js` to `workbox-4b126c97.js`, `showToast`, `get`, `P`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `addMaterialRow()` connect `showToast` to `index-BshJaYP4.js`, `P`, `app.js`, `loadAppalto`, `data.js`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `d()` connect `loadAppalto` to `workbox-4b126c97.js`, `data.js`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `n()` (e.g. with `ct()` and `ft()`) actually correct?**
  _`n()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `_deviceNamesCache`, `_staleCacheMap`, `_lastAllDocs` to the rest of the system?**
  _484 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Workflow Operativo AI-Assisted per Progetti Software` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `3.1 JavaScript Core` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._