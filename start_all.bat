@echo off
echo ======================================================================
echo   PRAHARI (प्रहरी): AI/NLP Engine for SIF Precursor Detection (SIH26165)
echo   Oil India Limited (OIL) HSE Framework
echo ======================================================================

echo Freeing ports 8001, 5000, 3000 if in use...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8001" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

start "PRAHARI ML NLP Service (FastAPI :8001)" cmd /k "cd /d %~dp0ml_service && python -m uvicorn main:app --host 127.0.0.1 --port 8001"
timeout /t 2 /nobreak > nul

start "PRAHARI Backend API (Express :5000)" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 2 /nobreak > nul

start "PRAHARI Frontend (Vite :3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo All PRAHARI services launched in separate windows!
echo - Frontend:  http://localhost:3000
echo - Backend:   http://127.0.0.1:5000
echo - ML API:    http://127.0.0.1:8001/docs
echo ======================================================================
