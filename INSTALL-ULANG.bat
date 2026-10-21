@echo off
:: =====================================================================
:: BANK DATA DIGITAL & ARSIP ELEKTRONIK - PA GUNUNG SUGIH
:: One-Click Auto Installer & Repair Engine
:: =====================================================================
cd /d "%~dp0"
title ⚡ Auto Installer & Repair Engine - Bank Data Digital PA Gunung Sugih
chcp 65001 >nul

:: Cek apakah file scripts\installer.ps1 tersedia
if exist "%~dp0scripts\installer.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\installer.ps1"
    if %errorlevel% equ 0 exit /b 0
)

:: Fallback jika PowerShell dinonaktifkan di sistem
color 0B
cls
echo =====================================================================
echo       INSTALL ULANG DEPENDENSI - BANK DATA DIGITAL
echo =====================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [PERINGATAN] Node.js belum terpasang di komputer ini!
    echo.
    where winget >nul 2>nul
    if %errorlevel% equ 0 (
        echo Terdeteksi Windows Package Manager (winget).
        echo Sedang mengunduh dan memasang Node.js LTS secara otomatis...
        winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
        echo.
        echo Instalasi Node.js selesai. Silakan tutup dan buka kembali file ini.
        pause
        exit /b
    )
    echo Silakan install Node.js terlebih dahulu dari: https://nodejs.org/
    start https://nodejs.org/
    pause
    exit /b
)

if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [INFO] File .env berhasil dibuat dari .env.example.
    )
)

echo [1/3] Menjalankan npm install...
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] npm install gagal. Periksa koneksi internet Anda.
    pause
    exit /b
)

echo.
echo [2/3] Memeriksa database dan seed user admin...
call node prisma/seed.js

echo.
echo [3/3] Melakukan build aplikasi (npm run build)...
call npm run build

echo.
echo =====================================================================
echo  INSTALL SELESAI!
echo  Untuk menjalankan aplikasi, cukup klik dua kali file: START.bat
echo =====================================================================
echo.
pause
