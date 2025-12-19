@echo off
title Drone Arena - Backend Server (Local Mode)
color 0A
cls

echo.
echo ========================================
echo   DRONE ARENA - BACKEND SERVER
echo   Local Offline Mode
echo ========================================
echo.

REM Check MongoDB
echo [CHECK] Checking MongoDB service...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo [ERROR] MongoDB is not running!
    echo [INFO] Please start MongoDB first
    echo.
    pause
    exit /b 1
)
echo [OK] MongoDB is running
echo.

REM Navigate to backend directory
cd /d "%~dp0"

echo [INFO] Starting backend server...
echo [INFO] Environment: LOCAL
echo [INFO] Database: mongodb://localhost:27017/drone-arena
echo.
echo ========================================
echo.

REM Start the server
npm run start:local

pause
