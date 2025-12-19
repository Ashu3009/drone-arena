@echo off
title Stop Drone Arena
color 0C
cls

echo.
echo ========================================
echo    STOPPING DRONE ARENA
echo ========================================
echo.

echo [1/2] Stopping Node.js processes...

REM Kill all node processes (backend and frontend)
taskkill /F /IM node.exe /T >nul 2>&1

REM Also kill any nodemon processes
taskkill /F /IM nodemon.exe /T >nul 2>&1

echo [OK] Node.js processes stopped
echo.

echo [2/2] Stopping MongoDB service (optional)...
echo Do you want to stop MongoDB service? (Y/N)
choice /C YN /N /M "Press Y for Yes, N for No: "

if %errorlevel% equ 1 (
    net stop MongoDB >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] MongoDB stopped successfully
    ) else (
        echo [INFO] MongoDB may already be stopped or requires admin rights
    )
) else (
    echo [INFO] MongoDB service left running
)

echo.
echo ========================================
echo   DRONE ARENA STOPPED SUCCESSFULLY!
echo ========================================
echo.
timeout /t 3 /nobreak >nul
