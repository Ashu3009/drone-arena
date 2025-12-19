@echo off
title Drone Arena - Frontend
color 0B
cls

echo.
echo ========================================
echo   DRONE ARENA - FRONTEND
echo ========================================
echo.

REM Navigate to frontend directory
cd /d "%~dp0"

echo [INFO] Starting React development server...
echo [INFO] URL: http://localhost:3000
echo.
echo [INFO] Browser will open automatically
echo.
echo ========================================
echo.

REM Start the frontend
npm start

pause
