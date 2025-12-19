@echo off
title Drone Arena Launcher
color 0E
cls

echo.
echo ========================================
echo    DRONE ARENA - OFFLINE MODE
echo ========================================
echo.
echo Initializing application...
echo.

REM Check if MongoDB is running
echo [1/4] Checking MongoDB service...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo [INFO] MongoDB not running, starting now...

    REM Try to start MongoDB service (requires admin rights)
    net start MongoDB >nul 2>&1

    if %errorlevel% neq 0 (
        echo [WARNING] Could not start MongoDB automatically
        echo [ACTION] Please run this file as Administrator
        echo.
        echo Right-click on start-drone-arena.bat
        echo Select "Run as administrator"
        echo.
        pause
        exit /b 1
    )

    echo [OK] MongoDB started successfully
    timeout /t 3 /nobreak >nul
) else (
    echo [OK] MongoDB is already running
)
echo.

REM Start Backend Server
echo [2/4] Starting Backend Server (Local Mode)...
start "Drone Arena - Backend" cmd /k "cd /d "%~dp0backend" && npm run start:local"
echo [OK] Backend server starting on http://localhost:5000
timeout /t 8 /nobreak >nul

REM Start Frontend
echo [3/4] Starting Frontend...
start "Drone Arena - Frontend" cmd /k "cd /d "%~dp0frontend" && npm start"
echo [OK] Frontend starting on http://localhost:3000
echo.

echo [4/4] All services started!
echo.
echo ========================================
echo   APPLICATION STARTED SUCCESSFULLY!
echo ========================================
echo.
echo MongoDB:  Running
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Browser will open automatically in 10 seconds...
echo.
echo Press any key to close this window...
pause >nul
