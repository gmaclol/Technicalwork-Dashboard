@echo off
:: Naviga nella cartella del progetto
cd /d "%~dp0"

echo.
echo ===========================================
echo   AVVIO TECHNICALWORK DASHBOARD (Vite)
echo ===========================================
echo.

echo 1. Chiusura di eventuali server rimasti aperti...
FOR /F "tokens=5" %%a IN ('netstat -aon ^| find "8000" ^| find "LISTENING"') DO taskkill /F /PID %%a >nul 2>&1

echo 2. Avvio server locale Vite su porta 8000...
:: Avvia il server Vite in una nuova finestra
start "TW_Server" cmd /k "title Server Dashboard (Chiudi per spegnere) && npm run dev"

:: Aspetta che Vite sia pronto
timeout /t 3 /nobreak >nul

echo 2. Apertura del browser...
:: Comando PowerShell per Brave o fallback su predefinito
powershell -Command "try { Start-Process brave 'http://localhost:8000' -ErrorAction Stop } catch { Start-Process 'http://localhost:8000' }"

echo.
echo Operazione completata.
timeout /t 3 >nul
exit
