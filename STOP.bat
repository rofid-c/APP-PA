@echo off
cd /d "%~dp0"
title Hentikan Server - Bank Data Digital PA Gunung Sugih
color 0C
cls

echo =====================================================================
echo              MENGHENTIKAN SERVER APLIKASI
echo =====================================================================
echo.

set TARGET_PORT=3000
if exist ".env" (
    for /f "tokens=1,2 delims==" %%A in (.env) do (
        if /i "%%A"=="PORT" set TARGET_PORT=%%B
    )
)

echo Mencari server aktif pada port %TARGET_PORT%...

set FOUND=0
for /f "tokens=5" %%P in ('netstat -aon ^| findstr ":%TARGET_PORT% " ^| findstr "LISTENING"') do (
    set FOUND=1
    taskkill /F /PID %%P >nul 2>&1
)

if "%FOUND%"=="1" (
    echo.
    echo [BERHASIL] Server aplikasi berhasil dihentikan.
) else (
    echo.
    echo [INFO] Tidak ada server yang sedang aktif pada port %TARGET_PORT%.
)

echo.
echo =====================================================================
echo  Jendela ini akan tertutup otomatis dalam 2 detik...
echo =====================================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 2" >nul 2>&1
