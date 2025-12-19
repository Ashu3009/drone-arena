@echo off
title Drone Arena Launcher - Development Mode
color 0E
cls

echo.
echo ========================================
echo    DRONE ARENA - DEVELOPMENT MODE
echo    (Using MongoDB Atlas Cloud)
echo ========================================
echo.
echo Initializing application...
echo.

REM Start Backend Server
echo [1/2] Starting Backend Server (Development Mode)...
start "Drone Arena - Backend (Dev)" cmd /k "cd /d "%~dp0backend" && npm run dev"
echo [OK] Backend server starting on http://localhost:5000
echo [OK] Using MongoDB Atlas Cloud Database
timeout /t 8 /nobreak >nul

REM Start Frontend
echo [2/2] Starting Frontend...
start "Drone Arena - Frontend" cmd /k "cd /d "%~dp0frontend" && npm start"
echo [OK] Frontend starting on http://localhost:3000
echo.

echo ========================================
echo   APPLICATION STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Mode:     DEVELOPMENT (Cloud Database)
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Browser will open automatically in 10 seconds...
echo.
echo Press any key to close this window...
pause >nul
