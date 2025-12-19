@echo off
title Create Matches for Aerial Knights Championship
color 0E
cls

echo.
echo ========================================
echo   CREATE TOURNAMENT MATCHES
echo   Aerial Knights Championship
echo ========================================
echo.

cd /d "%~dp0"

echo [INFO] Starting script...
echo [INFO] Using Local MongoDB Database
echo.

node create-matches.js

echo.
echo [DONE] Press any key to close...
pause >nul
