@echo off
:: =====================================================================
::        BANK DATA DIGITAL - PA GUNUNG SUGIH
::     Script Update Otomatis dari GitHub (1-Click Updater)
:: =====================================================================
cd /d "%~dp0"
title Update Bank Data Digital - PA Gunung Sugih
color 0B
cls

echo =====================================================================
echo           BANK DATA DIGITAL - PA GUNUNG SUGIH
echo                  Pembaruan Otomatis Sistem
echo =====================================================================
echo.
echo Repositori Sumber : https://github.com/rofid-c/APP-PA.git
echo Waktu Mulai       : %date% %time%
echo.
echo Sedang memeriksa koneksi internet dan pembaruan terbaru...
echo (Harap tunggu, proses ini 100%% otomatis tanpa perlu mengetik apapun)
echo.

:: Tutup server lama jika sedang berjalan agar port 3000 bebas
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>nul

:: 1. Cek apakah Git terpasang di komputer ini
where git >nul 2>nul
if %errorlevel% neq 0 goto UNDUH_POWERSHELL

:UNDUH_GIT
echo [1/3] Memeriksa repositori Git...
if not exist ".git\" (
    echo       Menginisialisasi koneksi repositori...
    git init >nul 2>nul
    git remote add origin https://github.com/rofid-c/APP-PA.git >nul 2>nul
    git branch -M main >nul 2>nul
) else (
    git remote set-url origin https://github.com/rofid-c/APP-PA.git >nul 2>nul
)

echo [2/3] Mengunduh pembaruan terbaru dari GitHub...
git fetch origin main
if %errorlevel% neq 0 goto UNDUH_POWERSHELL

:: Tarik kode terbaru, simpan file lokal yang di-ignore (.env dan data/)
git reset --hard origin/main
if %errorlevel% neq 0 git pull origin main --rebase
echo       Pembaruan berkas selesai diunduh!
echo.
goto BANGUN_APLIKASI

:UNDUH_POWERSHELL
echo [1/3] Git tidak terdeteksi. Menggunakan jalur unduhan langsung via PowerShell...
echo [2/3] Mengunduh paket pembaruan dari GitHub...

powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $wc = New-Object System.Net.WebClient; try { $wc.DownloadFile('https://github.com/rofid-c/APP-PA/archive/refs/heads/main.zip', 'update-temp.zip'); Write-Host '       Unduhan selesai!' } catch { Write-Host '       [ERROR] Gagal mengunduh: ' $_.Exception.Message; exit 1 }"
if %errorlevel% neq 0 goto GAGAL_INTERNET

echo       Mengekstrak pembaruan ke dalam aplikasi...
powershell -Command "Expand-Archive -Path 'update-temp.zip' -DestinationPath 'update-temp' -Force; Copy-Item -Path 'update-temp\APP-PA-main\*' -Destination '.' -Recurse -Force; Remove-Item -Path 'update-temp' -Recurse -Force; Remove-Item -Path 'update-temp.zip' -Force; Write-Host '       Pembaruan berkas selesai diekstrak!'"

:BANGUN_APLIKASI
echo.
echo [3/3] Membangun ulang aplikasi otomatis (npm run build)...
echo       Harap tunggu sekitar 20-40 detik hingga proses selesai...
echo.
call npm run build
if %errorlevel% neq 0 goto GAGAL_BUILD

color 0A
cls
echo =====================================================================
echo                    UPDATE BERHASIL! (SUKSES)
echo =====================================================================
echo.
echo  [V] Kode terbaru dari GitHub berhasil diunduh.
echo  [V] Build produksi (npm run build) telah berhasil dibuat.
echo  [V] Database arsip dan berkas kantor Anda TETAP AMAN dan UTUH.
echo.
echo  Aplikasi akan otomatis dijalankan dalam 3 detik...
echo =====================================================================
powershell -Command "Start-Sleep -Seconds 3"
call START.bat
exit /b

:GAGAL_INTERNET
color 0C
echo.
echo =====================================================================
echo  [ERROR] Gagal mengunduh pembaruan dari GitHub!
echo =====================================================================
echo  Pastikan laptop ini terhubung ke jaringan internet yang aktif.
echo  Alamat repositori: https://github.com/rofid-c/APP-PA.git
echo.
pause
exit /b

:GAGAL_BUILD
color 0C
echo.
echo =====================================================================
echo  [PERINGATAN] Berkas berhasil diunduh, tetapi build otomatis terkendala.
echo =====================================================================
echo  Mencoba menjalankan aplikasi secara langsung...
echo.
pause
call START.bat
exit /b
