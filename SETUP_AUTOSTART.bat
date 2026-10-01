@echo off
setlocal
title Enable XP Thermal Service Auto-Start
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_autostart.ps1"
echo.
pause
