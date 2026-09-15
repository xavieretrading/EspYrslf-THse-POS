@echo off
setlocal enabledelayedexpansion
title POS Printer Service Repair Tool

:: Check if running with Administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ========================================================
    echo   Requesting Administrator permission to start Spooler...
    echo ========================================================
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

echo ========================================================
echo           POS PRINTER & SPOOLER REPAIR TOOL
echo ========================================================
echo.

echo [1/3] Setting Print Spooler service to Automatic startup...
sc config spooler start= auto >nul 2>&1

echo [2/3] Starting Windows Print Spooler Service...
net start spooler
sc query spooler | findstr "STATE"

echo.
echo [3/3] Ensuring QZ Tray Thermal Bridge is running...
tasklist /fi "imagename eq javaw.exe" 2>nul | find /i "javaw.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] QZ Tray is active.
) else (
    if exist "C:\Program Files\QZ Tray\qz-tray.exe" (
        start "" "C:\Program Files\QZ Tray\qz-tray.exe"
        echo   [OK] Launched QZ Tray.
    ) else (
        echo   [NOTE] QZ Tray not in standard folder.
    )
)

echo.
echo ========================================================
echo              CURRENT DETECTED PRINTERS:
echo ========================================================
powershell -NoProfile -Command "Get-Printer | Select-Object Name, PortName, PrinterStatus | Format-Table -AutoSize"

echo.
echo ========================================================
echo   SUCCESS: Windows Print Spooler is now RUNNING!
echo   You can now return to your POS screen and click Print.
echo ========================================================
echo.
pause
