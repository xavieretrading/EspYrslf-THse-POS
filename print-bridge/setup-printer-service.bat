@echo off
setlocal enabledelayedexpansion
title POS Print Bridge Setup

echo =======================================================
echo     POS-80C Silent Print Bridge - Windows Setup
echo =======================================================
echo.

cd /d "%~dp0"

:: 1. Check / Enable Windows Print Spooler Service
echo [1/4] Ensuring Windows Print Spooler service is running...
sc config spooler start= auto >nul 2>&1
net start spooler >nul 2>&1
for /f "tokens=3 delims=: " %%H in ('sc query spooler ^| findstr "STATE"') do (
    if /I "%%H"=="RUNNING" (
        echo   [OK] Print Spooler service is active.
    ) else (
        echo   [WARNING] Could not start Print Spooler directly.
        echo   Tip: Right-click this script and choose "Run as administrator" if printing is blocked.
    )
)
echo.

:: 2. Generate Localhost SSL Certificate for Google Cloud Run (HTTPS)
echo [2/4] Configuring localhost HTTPS certificate for Cloud Run...
if not exist "certs" mkdir certs
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$certDir = Join-Path (Get-Location) 'certs';" ^
    "$certFile = Join-Path $certDir 'localhost.crt';" ^
    "$keyFile = Join-Path $certDir 'localhost.key';" ^
    "if (-not (Test-Path $certFile)) {" ^
    "   $cert = New-SelfSignedCertificate -DnsName 'localhost', '127.0.0.1' -CertStoreLocation 'Cert:\CurrentUser\My' -NotAfter (Get-Date).AddYears(10);" ^
    "   $rootStore = New-Object System.Security.Cryptography.X509Certificates.X509Store('Root','CurrentUser');" ^
    "   $rootStore.Open('ReadWrite');" ^
    "   $rootStore.Add($cert);" ^
    "   $rootStore.Close();" ^
    "   Export-Certificate -Cert $cert -FilePath $certFile | Out-Null;" ^
    "   $rsa = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert);" ^
    "   $keyBytes = $rsa.ExportPkcs8PrivateKey();" ^
    "   $base64Key = [System.Convert]::ToBase64String($keyBytes, [System.Base64FormattingOptions]::InsertLineBreaks);" ^
    "   $pem = \"-----BEGIN PRIVATE KEY-----`r`n$base64Key`r`n-----END PRIVATE KEY-----\";" ^
    "   [System.IO.File]::WriteAllText($keyFile, $pem);" ^
    "   $certPem = \"-----BEGIN CERTIFICATE-----`r`n\" + [System.Convert]::ToBase64String($cert.RawData, [System.Base64FormattingOptions]::InsertLineBreaks) + \"`r`n-----END CERTIFICATE-----\";" ^
    "   [System.IO.File]::WriteAllText($certFile, $certPem);" ^
    "   Write-Host '  [OK] Localhost certificate generated and trusted.';" ^
    "} else {" ^
    "   Write-Host '  [OK] Existing localhost certificate found.';" ^
    "}"
echo.

:: 3. Configure Windows Auto-Start (Startup folder)
echo [3/4] Installing silent background service to Windows Startup...
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\POS-Print-Bridge.lnk"
set "TARGET_VBS=%~dp0start-silent.vbs"

powershell -NoProfile -Command ^
    "$ws = New-Object -ComObject WScript.Shell;" ^
    "$s = $ws.CreateShortcut('%SHORTCUT_PATH%');" ^
    "$s.TargetPath = 'wscript.exe';" ^
    "$s.Arguments = '\"%TARGET_VBS%\"';" ^
    "$s.WorkingDirectory = '%~dp0';" ^
    "$s.Description = 'POS-80C Silent Print Bridge';" ^
    "$s.Save();"
echo   [OK] Windows will now start the Print Bridge automatically on boot.
echo.

:: 4. Start the Print Bridge immediately
echo [4/4] Starting POS Print Bridge now...
wscript.exe "%TARGET_VBS%"
timeout /t 2 /nobreak >nul

powershell -NoProfile -Command ^
    "try {" ^
    "   $res = Invoke-RestMethod -Uri 'http://localhost:9100/health' -TimeoutSec 3;" ^
    "   Write-Host '  [SUCCESS] Print Bridge is RUNNING on http://localhost:9100' -ForegroundColor Green;" ^
    "   Write-Host ('  Active Printer: ' + $res.activePrinter) -ForegroundColor Cyan;" ^
    "} catch {" ^
    "   Write-Host '  [WARNING] Print Bridge did not reply immediately, but process was launched.' -ForegroundColor Yellow;" ^
    "}"

echo.
echo =======================================================
echo   Setup Complete! Your POS is ready for 1-click print.
echo =======================================================
echo.
pause
