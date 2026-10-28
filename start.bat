@echo off
TITLE Smart Industry 360 - Launcher
echo ===================================================
echo     SMART INDUSTRY 360 - LAUNCHING LOCAL SERVERS
echo ===================================================
echo.

:: 1. Start Backend in a new window
echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000...
if exist ".venv\Scripts\uvicorn.exe" (
    start "Smart Industry 360 - Backend" cmd /k ".\.venv\Scripts\uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"
) else (
    start "Smart Industry 360 - Backend" cmd /k "uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"
)

:: 2. Start Frontend in a new window
echo [2/2] Starting React Vite Frontend on http://localhost:5173...
cd frontend
start "Smart Industry 360 - Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ===================================================
echo   Servers are starting up!
echo   - Web Dashboard:  http://localhost:5173
echo   - Backend Docs:   http://localhost:8000/docs
echo   - Health Check:   http://localhost:8000/api/health
echo ===================================================
echo Press any key to open the dashboard in your default browser...
pause >nul
start http://localhost:5173
