@echo off
title Create Desktop Shortcut
color 0B
cls

echo.
echo ========================================
echo   Creating Desktop Shortcut
echo   with Your Drone Logo
echo ========================================
echo.

REM Get the path to the current directory
set "SCRIPT_DIR=%~dp0"
set "TARGET=%SCRIPT_DIR%START-DRONE-ARENA-AUTO.bat"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT=%DESKTOP%\Drone Arena.lnk"
set "LOGO=%SCRIPT_DIR%frontend\src\assets\logo.png"

REM Check if logo exists, otherwise use default icon
if exist "%LOGO%" (
    echo [OK] Using your custom drone logo
    set "ICON=%LOGO%"
) else (
    echo [INFO] Logo not found, using default rocket icon
    set "ICON=C:\Windows\System32\shell32.dll,137"
)
echo.

echo [INFO] Creating shortcut on Desktop...

REM Delete old shortcut if exists
if exist "%SHORTCUT%" del "%SHORTCUT%" >nul 2>&1

REM Create shortcut using PowerShell with custom icon
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT%'); $Shortcut.TargetPath = '%TARGET%'; $Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; $Shortcut.Description = 'Start Drone Arena - Offline Mode'; $Shortcut.IconLocation = '%ICON%'; $Shortcut.Save()"

if exist "%SHORTCUT%" (
    echo [OK] Shortcut created successfully!
    echo.
    echo Location: %DESKTOP%
    echo Name: Drone Arena.lnk
    echo Icon: Your Custom Logo
    echo.
    echo ========================================
    echo   SHORTCUT CREATED!
    echo ========================================
    echo.
    echo You can now double-click "Start Drone Arena"
    echo on your Desktop to launch the application.
    echo.
) else (
    echo [ERROR] Failed to create shortcut
    echo.
)

timeout /t 5
