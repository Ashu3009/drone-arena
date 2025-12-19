@echo off
setlocal enabledelayedexpansion
REM ============================================
REM  DRONE ARENA LAUNCHER (AUTO ADMIN MODE)
REM  Automatically requests admin privileges
REM ============================================

REM Check for admin privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting Administrator privileges...
    echo.

    REM Re-run this script with admin rights
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

REM If we reach here, we have admin rights
title Drone Arena Launcher (Admin Mode)
color 0E
cls

echo.
echo ========================================
echo    DRONE ARENA - OFFLINE MODE
echo    Running with Administrator Rights
echo ========================================
echo.
echo Initializing application...
echo.

REM Check MongoDB service
echo [1/4] Checking MongoDB service...

set "USE_ATLAS=false"

REM First check if MongoDB service is already running
sc query MongoDB 2>nul | findstr /C:"RUNNING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] MongoDB is already running (Local Mode)
    echo.
    goto :MONGO_READY
)

REM Try to start MongoDB service
net start MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] MongoDB started successfully (Local Mode)
    echo.
    goto :MONGO_READY
)

REM Check again if it's running (in case error was "already started")
sc query MongoDB 2>nul | findstr /C:"RUNNING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] MongoDB is running (Local Mode)
    echo.
    goto :MONGO_READY
)

REM MongoDB not available - ask user
echo [WARNING] MongoDB service not found or not running
echo.
echo Do you want to:
echo [1] Continue WITHOUT MongoDB (Use Atlas Cloud - needs internet)
echo [2] Cancel and install MongoDB first
echo.
choice /C 12 /N /M "Select 1 or 2: "

if %errorlevel% equ 2 (
    echo.
    echo [INFO] Please install MongoDB from:
    echo https://www.mongodb.com/try/download/community
    echo.
    echo Run this script again after installation.
    pause
    exit /b 1
)

echo.
echo [INFO] Continuing with Atlas Cloud Database (requires internet)
set "USE_ATLAS=true"
echo.
goto :START_SERVERS

:MONGO_READY
REM MongoDB is running - use local mode
echo [INFO] Using Local MongoDB (Offline Mode)
echo.
timeout /t 2 /nobreak >nul

:START_SERVERS

REM Start Backend Server
echo [2/4] Starting Backend Server...
if "%USE_ATLAS%"=="true" (
    echo [INFO] Using MongoDB Atlas (Cloud Database)
    start "Drone Arena - Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
) else (
    echo [INFO] Using MongoDB Local (Offline Database)
    start "Drone Arena - Backend" cmd /k "cd /d "%~dp0backend" && npm run start:local"
)
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
if "%USE_ATLAS%"=="true" (
    echo Database: MongoDB Atlas ^(Cloud - Online^)
) else (
    echo Database: MongoDB Local ^(Offline Mode^)
)
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Browser will open automatically in 10 seconds...
echo.
echo Press any key to close this window...
pause >nul
