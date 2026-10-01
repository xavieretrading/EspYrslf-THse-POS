$startupFolder = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupFolder 'XP_Thermal_Service.lnk'
$targetBat = Join-Path $PSScriptRoot 'START_XP_THERMAL_SERVICE.bat'

$wshShell = New-Object -ComObject WScript.Shell
$shortcut = $wshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetBat
$shortcut.WorkingDirectory = $PSScriptRoot
$shortcut.WindowStyle = 7 # Minimized
$shortcut.Save()

Write-Host ""
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host "      XP THERMAL SERVICE AUTOMATIC STARTUP SETUP" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host ""

if (Test-Path $shortcutPath) {
    Write-Host "  [OK] Successfully registered in Windows Startup!" -ForegroundColor Green
    Write-Host "  Shortcut: $shortcutPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  From now on, XP Thermal Service will start AUTOMATICALLY" -ForegroundColor Cyan
    Write-Host "  in the background every time this computer turns on." -ForegroundColor Cyan
    Write-Host "  You will NEVER have to run it manually again!" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Could not create startup shortcut." -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Yellow
