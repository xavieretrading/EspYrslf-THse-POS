@echo off
setlocal enabledelayedexpansion
title XP Thermal Print Service Manager

:: Check Administrator Privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ========================================================
    echo   Requesting Administrator permission...
    echo ========================================================
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

echo ========================================================
echo           XP THERMAL SERVICE LAUNCHER ^& SPOOLER
echo ========================================================
echo.

echo [1/3] Ensuring Windows Print Spooler is running...
sc config spooler start= auto >nul 2>&1
net start spooler >nul 2>&1
echo   [OK] Print Spooler is running.

echo.
echo [2/3] Checking XP Thermal Service on port 9100...
cd /d "%~dp0xp-thermal-service"

powershell -NoProfile -Command "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:9100/health' -TimeoutSec 2; exit 0 } catch { exit 1 }"
if %errorlevel% equ 0 (
    echo   [OK] XP Thermal Service is ALREADY running on port 9100!
) else (
    if not exist "dist\index.js" (
        echo   [INFO] First-time setup: Building XP Thermal Service...
        call npm run build
    )
    echo   Starting XP Thermal Service...
    start /min "XP Thermal Service" node dist/index.js
    timeout /t 3 /nobreak >nul
    powershell -NoProfile -Command "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:9100/health' -TimeoutSec 3; Write-Host '  [OK] Successfully connected to XP Thermal Service!' -ForegroundColor Green } catch { Write-Host '  [WARN] Service is starting up...' -ForegroundColor Yellow }"
)

echo.
echo [3/3] Opening XP Thermal Service Dashboard...
start http://127.0.0.1:9100/dashboard

echo.
echo ========================================================
echo   SUCCESS: XP Thermal Service is Active on port 9100!
echo   Dashboard: http://127.0.0.1:9100/dashboard
echo ========================================================
echo.
timeout /t 5
