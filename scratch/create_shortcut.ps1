$desktop = [Environment]::GetFolderPath('Desktop')
$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut("$desktop\START_XP_THERMAL_SERVICE.lnk")
$shortcut.TargetPath = "c:\Users\Philippines Freight\MainSystems\POS\START_XP_THERMAL_SERVICE.bat"
$shortcut.WorkingDirectory = "c:\Users\Philippines Freight\MainSystems\POS"
$shortcut.Save()
Write-Host "Created Desktop Shortcut: $desktop\START_XP_THERMAL_SERVICE.lnk"
