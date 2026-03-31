@echo off
:: Naviga nella cartella del progetto
cd /d "%~dp0"

echo.
echo ===========================================
echo   COSTRUZIONE PRODUZIONE GITHUB PAGES (Vite)
echo ===========================================
echo.
echo Preparazione file ottimizzati in corso...
echo Questo processo minifica il codice JavaScript e CSS.
echo.

:: Esegue la build Vite
call npm run build

echo.
echo ===========================================
echo   BUILD COMPLETATA CON SUCCESSO!
echo ===========================================
echo.
echo I file ottimizzati si trovano ora nella cartella "docs" del tuo progetto.
echo.
echo PER PUBBLICARE SU GITHUB PAGES:
echo Visto che usi la cartella "docs" per GitHub Pages, non devi copiare nulla a mano!
echo 1. Questo script ha appena aggiornato il contenuto di "docs" automaticamente.
echo 2. Esegui semplicemente un git commit e fai push del tuo repository.
echo 3. Entro pochi minuti GitHub aggiornera' il tuo sito pubblico.
echo.
echo Premi un tasto qualsiasi per uscire...
pause >nul
exit
