@echo off
cls
echo ========================================
echo ESP32 Simulator - Drone Arena
echo ========================================
echo.
echo Select Backend:
echo 1. Local Backend (http://localhost:5000)
echo 2. Deployed Backend (Render)
echo.
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Starting simulator with LOCAL backend...
    echo.
    python esp32-simulator.py
) else if "%choice%"=="2" (
    echo.
    echo Enter your Render backend URL:
    echo Example: https://your-app.onrender.com
    set /p backend_url="Backend URL: "

    echo.
    echo Updating SERVER_URL in simulator...
    powershell -Command "(Get-Content esp32-simulator.py) -replace 'SERVER_URL = \".*\"', 'SERVER_URL = \"%backend_url%\"' | Set-Content esp32-simulator-temp.py"

    echo Starting simulator with DEPLOYED backend...
    echo.
    python esp32-simulator-temp.py
    del esp32-simulator-temp.py
) else (
    echo Invalid choice!
    pause
)
