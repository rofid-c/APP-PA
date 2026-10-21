@echo off
:: Pastikan bekerja di direktori tempat file bat ini berada
cd /d "%~dp0"

title Link Akses Jaringan - Bank Data Digital PA Gunung Sugih
color 0B
cls

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js belum terpasang. Jalankan START.bat terlebih dahulu.
    pause
    exit /b
)

echo =====================================================================
echo       BAGIKAN LINK AKSES KE HP / LAPTOP LAIN DI WI-FI
echo =====================================================================
node scripts/detect-ip.js --copy --qr

echo.
echo  TIPS:
echo  1. Pastikan server aplikasi sudah berjalan (START.bat aktif).
echo  2. Rekan kerja atau HP harus terhubung ke Wi-Fi / Hotspot yang sama.
echo  3. Link di atas sudah otomatis DISALIN ke clipboard laptop ini.
echo.
echo =====================================================================
echo  Tekan tombol apa saja untuk menutup jendela ini...
echo =====================================================================
pause >nul
