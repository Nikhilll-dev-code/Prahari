@echo off
echo ======================================================================
echo   SIF-Sentinel: AI/NLP Engine for SIF Precursor Detection (SIH26165)
echo   Oil India Limited (OIL) HSE Framework
echo ======================================================================

start "SIF ML NLP Service (FastAPI :8001)" cmd /k "cd /d %~dp0ml_service && python -m uvicorn main:app --host 127.0.0.1 --port 8001"
timeout /t 2 /nobreak > nul

start "SIF Backend API (Express :5000)" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 2 /nobreak > nul

start "SIF Frontend (Vite :3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo All services launched in separate windows!
echo - Frontend:  http://localhost:3000
echo - Backend:   http://127.0.0.1:5000
echo - ML API:    http://127.0.0.1:8001/docs
echo ======================================================================
