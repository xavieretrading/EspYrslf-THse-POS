@echo off
setlocal enabledelayedexpansion
title XP Thermal Print Service Manager

echo ========================================================
echo           XP THERMAL SERVICE LAUNCHER ^& SPOOLER
echo ========================================================
echo.

:: Best-effort Spooler check
net start spooler >nul 2>&1

echo [1/3] Locating service directory and Node.js...

set "TARGET_DIR="
if exist "%~dp0src\api\server.ts" (
    set "TARGET_DIR=%~dp0"
) else if exist "%~dp0xp-thermal-service\src\api\server.ts" (
    set "TARGET_DIR=%~dp0xp-thermal-service"
) else (
    for /d %%D in ("%~dp0xp-thermal-service*") do (
        if exist "%%D\src\api\server.ts" set "TARGET_DIR=%%D"
        if exist "%%D\xp-thermal-service\src\api\server.ts" set "TARGET_DIR=%%D\xp-thermal-service"
    )
)

if not defined TARGET_DIR (
    echo.
    echo   ========================================================
    echo   [ERROR] Could not find xp-thermal-service folder!
    echo   Running from: %~dp0
    echo   ========================================================
    echo   Please make sure START_XP_THERMAL_SERVICE.bat is placed
    echo   inside or next to the xp-thermal-service folder.
    echo   ========================================================
    echo.
    pause
    exit /b 1
)

cd /d "!TARGET_DIR!"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo   ========================================================
    echo   [ERROR] Node.js is NOT installed on this computer!
    echo   ========================================================
    echo   To use 1-Click Silent Thermal Printing on this PC:
    echo   1. Download and install Node.js LTS from https://nodejs.org
    echo   2. Re-run this START_XP_THERMAL_SERVICE.bat script.
    echo.
    echo   Note: You can also use standard Browser Print without Node.js
    echo   ========================================================
    echo.
    pause
    exit /b 1
)
echo   [OK] Working folder: !TARGET_DIR!
echo   [OK] Node.js is detected.

echo.
echo [2/3] Checking dependencies and build files...
if not exist "logs" mkdir "logs"
if not exist "data" mkdir "data"

if not exist "node_modules\express" (
    echo   [INFO] First-time setup: Installing required dependencies...
    call npm install
)

if not exist "dist\index.js" (
    echo   [INFO] First-time setup: Building XP Thermal Service...
    call npm run build
)

:: Clear stale lock file if port 9100 is not actually running
powershell -NoProfile -Command "if (-not (Get-NetTCPConnection -LocalPort 9100 -ErrorAction SilentlyContinue)) { if (Test-Path 'data\service.lock') { Remove-Item 'data\service.lock' -Force } }" >nul 2>&1

echo.
echo [3/3] Checking XP Thermal Service on port 9100...
powershell -NoProfile -Command "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:9100/health' -TimeoutSec 2; exit 0 } catch { exit 1 }"
if %errorlevel% equ 0 (
    echo   [OK] XP Thermal Service is ALREADY running on port 9100!
) else (
    echo   Starting XP Thermal Service in background...
    start "XP Thermal Service" /min cmd /c "node dist/index.js >> logs\console.log 2>&1"
    timeout /t 3 /nobreak >nul

    powershell -NoProfile -Command "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:9100/health' -TimeoutSec 3; exit 0 } catch { exit 1 }"
    if %errorlevel% equ 0 (
        echo   [OK] Successfully connected to XP Thermal Service on port 9100!
    ) else (
        echo.
        echo   ========================================================
        echo   [WARNING] Service failed to start on port 9100!
        echo   ========================================================
        echo   Console log output:
        if exist "logs\console.log" (
            type "logs\console.log"
        )
        echo.
        echo   ========================================================
        echo   Tip: You can also open PowerShell inside xp-thermal-service
        echo   and run: node dist/index.js
        echo   ========================================================
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ========================================================
echo   SUCCESS: XP Thermal Service is Active on port 9100!
echo   Opening Dashboard...
echo ========================================================
echo.
explorer "http://127.0.0.1:9100/dashboard"
ping 127.0.0.1 -n 3 >nul
