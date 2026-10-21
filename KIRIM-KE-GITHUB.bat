@echo off
:: =====================================================================
::        BANK DATA DIGITAL - PA GUNUNG SUGIH
::     Script Kirim (Push) Update ke GitHub dari Laptop Dev
:: =====================================================================
cd /d "%~dp0"
title Kirim Update ke GitHub - PA Gunung Sugih
color 0B
cls

echo =====================================================================
echo           BANK DATA DIGITAL - PA GUNUNG SUGIH
echo                  Kirim Update ke GitHub
echo =====================================================================
echo.
echo Menyiapkan berkas-berkas yang diperbarui...

git add .
git commit -m "Update otomatis: %date% %time%"

echo.
echo Sedang mengirim (push) ke GitHub...
git push -u origin main

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo =====================================================================
    echo  [GAGAL] Tidak dapat mengirim ke GitHub.
    echo  Pastikan laptop terhubung ke internet dan Anda sudah login ke GitHub.
    echo =====================================================================
    echo.
    pause
    exit /b
)

color 0A
cls
echo =====================================================================
echo                 BERHASIL DIKIRIM KE GITHUB!
echo =====================================================================
echo.
echo  Pembaruan sudah tersimpan di:
echo  https://github.com/rofid-c/APP-PA.git
echo.
echo  Langkah selanjutnya di Laptop B (Kantor):
echo  - Cukup klik dua kali file UPDATE-APLIKASI.bat di Laptop B.
echo  - Pembaruan akan otomatis terpasang tanpa perlu mengetik apapun!
echo.
echo =====================================================================
echo Waktu: %date% %time%
echo =====================================================================
echo.
pause
