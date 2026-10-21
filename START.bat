@echo off
:: Pastikan bekerja di direktori tempat file bat ini berada
cd /d "%~dp0"

title Bank Data Digital - PA Gunung Sugih
color 0A
cls

echo =====================================================================
echo           BANK DATA DIGITAL - PA GUNUNG SUGIH
echo                  One-Click Starter Script
echo =====================================================================
echo.

:: 1. Cek apakah Node.js sudah terpasang
where node >nul 2>nul
if %errorlevel% neq 0 goto NODE_TIDAK_ADA

echo [1/5] Memeriksa Node.js... OK!
node -v
echo.
goto CEK_ENV

:NODE_TIDAK_ADA
color 0C
echo [PERINGATAN] Node.js BELUM TERPASANG di komputer / laptop ini!
echo Aplikasi ini membutuhkan Node.js agar dapat berjalan.
echo.
where winget >nul 2>nul
if %errorlevel% neq 0 goto BUKA_WEB_NODE

echo [INFO] Terdeteksi Windows Package Manager winget.
echo Ingin menginstall Node.js LTS secara otomatis?
set /p PILIH_INSTALL="Install otomatis sekarang? (Y/N): "
if /i "%PILIH_INSTALL%"=="Y" (
    echo.
    echo Sedang mengunduh dan memasang Node.js LTS secara otomatis...
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    echo.
    echo =====================================================================
    echo  Instalasi Node.js selesai!
    echo  Silakan tutup jendela ini, lalu klik dua kali START.bat kembali.
    echo =====================================================================
    pause
    exit /b
)

:BUKA_WEB_NODE
echo.
echo Langkah mudah:
echo 1. Kunjungi website https://nodejs.org
echo 2. Download versi LTS
echo 3. Install file yang diunduh sampai selesai
echo 4. Jalankan kembali file START.bat ini
echo.
echo Tekan tombol apa saja untuk membuka website download Node.js...
pause >nul
start https://nodejs.org/
goto SELESAI

:CEK_ENV
:: 2. Pastikan file .env ada
if exist ".env" goto ENV_SUDAH_ADA

echo [2/5] Menyiapkan file konfigurasi .env...
if exist ".env.example" (
    copy .env.example .env >nul
    echo       File .env berhasil dibuat dari .env.example.
) else (
    echo JWT_SECRET="arsip-pags-secret-9b2f6c8d1e4a3b7c8d9e0f1a2b3c4d5e" > .env
    echo GOOGLE_DRIVE_FOLDER_ID="1TQ4uJrd64oMTTbncXQUWfC4LQgSCaRui" >> .env
    echo       File .env default berhasil dibuat.
)
goto CEK_MODULES

:ENV_SUDAH_ADA
echo [2/5] File konfigurasi .env... OK!

:CEK_MODULES
echo.
:: 3. Cek apakah node_modules sudah terinstall
if exist "node_modules\" goto MODULES_SUDAH_ADA

echo [3/5] Dependensi belum terpasang.
echo       Sedang menginstall library aplikasi (npm install)...
echo       Proses ini butuh waktu beberapa menit, harap tunggu...
echo.
call npm install
if %errorlevel% neq 0 goto GAGAL_INSTALL
goto CEK_DATABASE

:GAGAL_INSTALL
color 0C
echo.
echo [ERROR] Gagal menginstall library! Pastikan laptop terhubung ke internet.
echo.
goto SELESAI

:MODULES_SUDAH_ADA
echo [3/5] Memeriksa dependensi aplikasi... OK!
:: Periksa apakah modul native (better-sqlite3) kompatibel dengan versi Node.js yang aktif di mesin ini
node -e "require('better-sqlite3')" >nul 2>nul
if %errorlevel% equ 0 goto CEK_DATABASE

echo       [INFO] Terdeteksi perbedaan versi Node.js pada komputer ini.
echo       Menyelaraskan binary database dengan versi Node aktif...
call npm rebuild better-sqlite3
if %errorlevel% neq 0 (
    echo       Mencoba install ulang dependensi...
    call npm install
)
echo       Penyelarasan dependensi... Selesai!

:CEK_DATABASE
echo.
:: 4. Buat akun admin dan pastikan database siap
echo [4/5] Memeriksa database...
call node prisma/seed.js
echo.

:: 5. Cek apakah project sudah dibuild (.next)
if exist ".next\" goto BUILD_SUDAH_ADA

echo [5/5] Menyiapkan build produksi pertama kali (npm run build)...
echo       Harap tunggu sebentar...
echo.
call npm run build
if %errorlevel% neq 0 goto GAGAL_BUILD
goto JALANKAN_PROD

:BUILD_SUDAH_ADA
echo [5/5] Build aplikasi (.next)... OK!

:JALANKAN_PROD
:: Cek konfigurasi PORT (default: 3000 atau dari .env)
set APP_PORT=3000
if exist ".env" (
    for /f "tokens=1,2 delims==" %%A in (.env) do (
        if /i "%%A"=="PORT" set APP_PORT=%%B
    )
)
set PORT=%APP_PORT%

:: Deteksi alamat IP jaringan dan salin link secara otomatis ke clipboard
call node scripts/detect-ip.js --copy

:: Buka browser otomatis di laptop ini setelah delay 3 detik
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:%APP_PORT%"

:: Jalankan server produksi
if exist "node_modules\next\dist\bin\next" (
    node node_modules\next\dist\bin\next start -H 0.0.0.0 -p %APP_PORT% <nul
) else (
    call npm start <nul
)
if %errorlevel% neq 0 goto COBA_DEV
goto SELESAI

:GAGAL_BUILD
echo.
echo [INFO] Build produksi bermasalah, mencoba mode development...
goto COBA_DEV

:COBA_DEV
echo.
echo [INFO] Menjalankan via mode Development (npm run dev)...
call node scripts/detect-ip.js --copy
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:%APP_PORT%"
if exist "node_modules\next\dist\bin\next" (
    node node_modules\next\dist\bin\next dev -H 0.0.0.0 -p %APP_PORT% <nul
) else (
    call npm run dev <nul
)

:SELESAI
exit /b
