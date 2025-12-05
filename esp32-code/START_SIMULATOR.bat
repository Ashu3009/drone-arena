@echo off
title ESP32 Simulator - Drone Arena
color 0A
echo.
echo ========================================
echo    ESP32 SIMULATOR - DRONE ARENA
echo ========================================
echo.
echo MAC Address: AA:BB:CC:DD:EE:09
echo Server: http://localhost:5000
echo Mode: Moving (Circular pattern)
echo.
echo ========================================
echo  Press ENTER to start simulation...
echo ========================================
echo.
pause
python esp32-simulator.py
pause
