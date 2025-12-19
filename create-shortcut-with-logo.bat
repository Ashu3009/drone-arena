@echo off
title Create Shortcut with Drone Logo
color 0B
cls

echo.
echo ========================================
echo   Creating Shortcut with Your Logo
echo ========================================
echo.

REM Get paths
set "SCRIPT_DIR=%~dp0"
set "LOGO_PNG=%SCRIPT_DIR%frontend\src\assets\logo.png"
set "ICON_FILE=%SCRIPT_DIR%drone-icon.ico"
set "TARGET=%SCRIPT_DIR%START-DRONE-ARENA-AUTO.bat"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT=%DESKTOP%\Drone Arena.lnk"

REM Check if logo.png exists
if not exist "%LOGO_PNG%" (
    echo [ERROR] Logo not found at:
    echo %LOGO_PNG%
    echo.
    pause
    exit /b 1
)

echo [1/3] Found logo.png
echo.

REM Check if icon already converted
if not exist "%ICON_FILE%" (
    echo [2/3] Converting logo to icon format...
    echo.

    REM Run Node.js conversion script
    node convert-logo-to-icon.js

    if %errorlevel% neq 0 (
        echo.
        echo [WARNING] Conversion failed!
        echo [INFO] Using PNG directly (may not show icon properly)
        set "ICON_LOCATION=%LOGO_PNG%"
    ) else (
        echo.
        echo [OK] Icon converted successfully!
        set "ICON_LOCATION=%ICON_FILE%"
    )
) else (
    echo [2/3] Icon file already exists
    set "ICON_LOCATION=%ICON_FILE%"
)

echo.
echo [3/3] Creating desktop shortcut...

REM Delete old shortcut if exists
if exist "%SHORTCUT%" del "%SHORTCUT%" >nul 2>&1

REM Create shortcut with custom icon
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT%'); $Shortcut.TargetPath = '%TARGET%'; $Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; $Shortcut.Description = 'Start Drone Arena - Offline Mode'; $Shortcut.IconLocation = '%ICON_LOCATION%'; $Shortcut.Save()"

if exist "%SHORTCUT%" (
    echo [OK] Shortcut created successfully!
    echo.
    echo ========================================
    echo   SHORTCUT CREATED!
    echo ========================================
    echo.
    echo Location: %DESKTOP%
    echo Name: Drone Arena.lnk
    echo Icon: Your Custom Logo
    echo.
    echo Check your Desktop now!
    echo.
) else (
    echo [ERROR] Failed to create shortcut
    echo.
)

timeout /t 5
