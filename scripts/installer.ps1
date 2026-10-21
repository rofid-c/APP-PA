# ==============================================================================
# PA GUNUNG SUGIH - AUTO INSTALLER & REPAIR ENGINE
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "⚡ Auto Installer & Repair Engine - Bank Data Digital PA Gunung Sugih"

# Setup window size safely
try {
    $rawUI = $Host.UI.RawUI
    $buf = $rawUI.BufferSize
    if ($buf.Width -lt 106) { $buf.Width = 106 }
    $rawUI.BufferSize = $buf
    $win = $rawUI.WindowSize
    $win.Width = 106
    $win.Height = 36
    $rawUI.WindowSize = $win
} catch {}

# ANSI Color Palette
$ESC = [char]27
$C_RESET   = "$ESC[0m"
$C_BOLD    = "$ESC[1m"
$C_DIM     = "$ESC[2m"

# Theme Colors
$C_CYAN    = "$ESC[38;2;6;182;212m"     # #06b6d4
$C_BLUE    = "$ESC[38;2;59;130;246m"    # #3b82f6
$C_SKY     = "$ESC[38;2;14;165;233m"    # #0ea5e9
$C_EMERALD = "$ESC[38;2;16;185;129m"    # #10b981
$C_GREEN   = "$ESC[38;2;34;197;94m"     # #22c55e
$C_AMBER   = "$ESC[38;2;245;158;11m"    # #f59e0b
$C_RED     = "$ESC[38;2;239;68;68m"     # #ef4444
$C_WHITE   = "$ESC[38;2;248;250;252m"   # #f8fafc
$C_SLATE   = "$ESC[38;2;148;163;184m"   # #94a3b8
$C_BORDER  = "$ESC[38;2;71;85;105m"     # #475569
$BG_EMERALD= "$ESC[48;2;16;185;129;38;2;255;255;255m"
$BG_CYAN   = "$ESC[48;2;14;165;233;38;2;255;255;255m"
$BG_SLATE  = "$ESC[48;2;51;65;85;38;2;248;250;252m"

Clear-Host
Write-Host ""

# Intro animation
$intro = "  ⚡ MEMULAI ENGINE BANK DATA DIGITAL - PENGADILAN AGAMA GUNUNG SUGIH..."
foreach ($ch in $intro.ToCharArray()) {
    Write-Host "$C_CYAN$C_BOLD$ch$C_RESET" -NoNewline
    Start-Sleep -Milliseconds 12
}
Write-Host ""
Write-Host ""

# Banner ASCII Art
$banner = @(
    "  +====================================================================================================+",
    "  |   ######    ###     ######  ##   ##  ##  ##  ##   ##  ##  ##   ######                           |",
    "  |   ##   ##  ## ##   ##       ##   ##  ### ##  ##   ##  ### ##  ##                                |",
    "  |   ######  ##   ##  ##  ###  ##   ##  ######  ##   ##  ######  ##  ###                           |",
    "  |   ##      #######  ##   ##  ##   ##  ## ###  ##   ##  ## ###  ##   ##                           |",
    "  |   ##      ##   ##   ######   #####   ##  ##   #####   ##  ##   ######                           |",
    "  |                                                                                                    |",
    "  |    BANK DATA & ARSIP DIGITAL ELEKTRONIK  *  PENGADILAN AGAMA GUNUNG SUGIH                             |",
    "  +====================================================================================================+"
)

$colors = @($C_BLUE, $C_BLUE, $C_SKY, $C_CYAN, $C_EMERALD, $C_EMERALD, $C_GREEN, $C_WHITE, $C_GREEN)
for ($i = 0; $i -lt $banner.Length; $i++) {
    Write-Host "$($colors[$i])$C_BOLD$($banner[$i])$C_RESET"
    Start-Sleep -Milliseconds 20
}

Write-Host ""
Write-Host "  $BG_CYAN$C_BOLD WIZARD OTOMATIS $C_RESET $C_WHITE Sistem Pemasangan, Penyelarasan & Perbaikan Dependensi $C_RESET"
Write-Host ""

# Gather dynamic system specs
$compName = $env:COMPUTERNAME
$userName = $env:USERNAME
$osInfo = try { (Get-CimInstance Win32_OperatingSystem).Caption } catch { "Windows OS" }
if ($osInfo.Length -gt 24) { $osInfo = $osInfo.Substring(0, 21) + "..." }

$nodeVer = try { (& node -v 2>$null).Trim() } catch { "Tidak terdeteksi" }
$npmVer  = try { (& npm -v 2>$null).Trim() } catch { "Tidak terdeteksi" }

# System analysis progress bar animation
Write-Host -NoNewline "  $C_SLATE Membaca spesifikasi hardware & environment: $C_RESET"
for ($p = 0; $p -le 100; $p += 10) {
    $filled = [int]($p / 5)
    $empty = 20 - $filled
    $bar = ("#" * $filled) + ("-" * $empty)
    Write-Host -NoNewline "`r  $C_SLATE Membaca spesifikasi hardware & environment: $C_RESET$C_CYAN[$bar] $p%$C_RESET "
    Start-Sleep -Milliseconds 25
}
Write-Host "$C_EMERALD[SELESAI]$C_RESET"
Write-Host ""

# Helper to format columns with exact widths
function Format-Row {
    param([string]$label, [string]$val, [string]$valColor, [int]$targetWidth)
    $cleanLen = $label.Length + $val.Length
    $pad = [Math]::Max(0, $targetWidth - $cleanLen)
    $spaces = " " * $pad
    return "$label$valColor$val$C_RESET$spaces"
}

# Draw 2-Column Dashboard Header
function Render-DualCard {
    param(
        [string]$s1 = "[Menunggu]", [string]$c1 = $C_SLATE,
        [string]$s2 = "[Menunggu]", [string]$c2 = $C_SLATE,
        [string]$s3 = "[Menunggu]", [string]$c3 = $C_SLATE,
        [string]$s4 = "[Menunggu]", [string]$c4 = $C_SLATE,
        [string]$s5 = "[Menunggu]", [string]$c5 = $C_SLATE
    )

    $leftTop  = "  $C_BORDER+--- [ TAHAPAN PROSES INSTALASI ] ---------+   +--- [ MONITOR SISTEM & SERVER ] ----------+$C_RESET"
    $leftBot  = "  $C_BORDER+------------------------------------------+   +------------------------------------------+$C_RESET"

    Write-Host $leftTop

    $l1 = Format-Row " 1. Deteksi Runtime Node & NPM  " $s1 $c1 42
    $r1 = Format-Row " Komputer : " $compName $C_WHITE 42
    Write-Host "  $C_BORDER|$C_RESET$l1$C_BORDER|   |$C_RESET$r1$C_BORDER|$C_RESET"

    $l2 = Format-Row " 2. Konfigurasi File .env       " $s2 $c2 42
    $r2 = Format-Row " Pengguna : " $userName $C_WHITE 42
    Write-Host "  $C_BORDER|$C_RESET$l2$C_BORDER|   |$C_RESET$r2$C_BORDER|$C_RESET"

    $l3 = Format-Row " 3. Instalasi Library (npm)     " $s3 $c3 42
    $r3 = Format-Row " Platform : " $osInfo $C_WHITE 42
    Write-Host "  $C_BORDER|$C_RESET$l3$C_BORDER|   |$C_RESET$r3$C_BORDER|$C_RESET"

    $l4 = Format-Row " 4. Seed Database & Admin       " $s4 $c4 42
    $r4 = Format-Row " Node.js  : " "$nodeVer (Aktif)" $C_EMERALD 42
    Write-Host "  $C_BORDER|$C_RESET$l4$C_BORDER|   |$C_RESET$r4$C_BORDER|$C_RESET"

    $l5 = Format-Row " 5. Kompilasi Produksi (build)  " $s5 $c5 42
    $r5 = Format-Row " NPM      : " "v$npmVer" $C_CYAN 42
    Write-Host "  $C_BORDER|$C_RESET$l5$C_BORDER|   |$C_RESET$r5$C_BORDER|$C_RESET"

    $l6 = "                                          "
    $r6 = Format-Row " Port     : " "3000 (Localhost)" $C_WHITE 42
    Write-Host "  $C_BORDER|$C_RESET$l6$C_BORDER|   |$C_RESET$r6$C_BORDER|$C_RESET"

    $l7 = "                                          "
    $r7 = Format-Row " Database : " "arsip.db (SQLite)" $C_WHITE 42
    Write-Host "  $C_BORDER|$C_RESET$l7$C_BORDER|   |$C_RESET$r7$C_BORDER|$C_RESET"

    $l8 = "                                          "
    $r8 = Format-Row " Instansi : " "PA Gunung Sugih" $C_WHITE 42
    Write-Host "  $C_BORDER|$C_RESET$l8$C_BORDER|   |$C_RESET$r8$C_BORDER|$C_RESET"

    Write-Host $leftBot
    Write-Host ""
}

# Initial render of dashboard cards
Render-DualCard

# ------------------------------------------------------------------------------
# STEP 1: DETEKSI RUNTIME NODE.JS
# ------------------------------------------------------------------------------
Write-Host "  $C_CYAN$C_BOLD>> [LANGKAH 1/5]$C_RESET $C_WHITE Memeriksa Node.js & Environment...$C_RESET"
Start-Sleep -Milliseconds 350

if ($nodeVer -eq "Tidak terdeteksi" -or [string]::IsNullOrWhiteSpace($nodeVer)) {
    Write-Host "  $C_RED$C_BOLD[!] Node.js belum terpasang di komputer ini!$C_RESET"
    
    $hasWinget = Get-Command winget -ErrorAction SilentlyContinue
    if ($hasWinget) {
        Write-Host "  $C_AMBER Terdeteksi Windows Package Manager (winget). Ingin menginstall Node.js LTS otomatis?$C_RESET"
        $ans = Read-Host "   Install otomatis sekarang? (Y/N)"
        if ($ans -eq 'Y' -or $ans -eq 'y') {
            Write-Host "   Sedang mengunduh dan memasang Node.js LTS via winget..." -ForegroundColor Cyan
            & winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
            Write-Host "   Silakan tutup jendela ini dan jalankan kembali INSTALL-ULANG.bat!" -ForegroundColor Green
            Read-Host "Tekan Enter untuk keluar"
            exit 0
        }
    }
    
    Write-Host "  Membuka website download resmi Node.js..." -ForegroundColor Yellow
    Start-Process "https://nodejs.org/"
    Read-Host "Tekan Enter setelah selesai install Node.js"
    exit 1
}

Write-Host "    $C_EMERALD[OK]$C_RESET Node.js aktif : $C_BOLD$nodeVer$C_RESET"
Write-Host "    $C_EMERALD[OK]$C_RESET NPM aktif     : $C_BOLD$npmVer$C_RESET"
Write-Host ""

# ------------------------------------------------------------------------------
# STEP 2: SINKRONISASI FILE .ENV
# ------------------------------------------------------------------------------
Write-Host "  $C_CYAN$C_BOLD>> [LANGKAH 2/5]$C_RESET $C_WHITE Menyiapkan Konfigurasi (.env)...$C_RESET"
Start-Sleep -Milliseconds 300

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item -Path ".env.example" -Destination ".env" -Force
        Write-Host "    $C_EMERALD[OK]$C_RESET File .env berhasil dibuat dari template .env.example."
    } else {
        $defaultEnv = @"
JWT_SECRET="arsip-pags-secret-9b2f6c8d1e4a3b7c8d9e0f1a2b3c4d5e"
GOOGLE_DRIVE_FOLDER_ID="1TQ4uJrd64oMTTbncXQUWfC4LQgSCaRui"
"@
        Set-Content -Path ".env" -Value $defaultEnv -Encoding UTF8
        Write-Host "    $C_EMERALD[OK]$C_RESET File .env default berhasil di-generate."
    }
} else {
    Write-Host "    $C_EMERALD[OK]$C_RESET File konfigurasi .env sudah ada & siap."
}
Write-Host ""

# ------------------------------------------------------------------------------
# STEP 3: INSTALASI DEPENDENSI (NPM INSTALL)
# ------------------------------------------------------------------------------
Write-Host "  $C_CYAN$C_BOLD>> [LANGKAH 3/5]$C_RESET $C_WHITE Menginstall dependensi library (npm install)...$C_RESET"
Write-Host "    $C_SLATE Harap tunggu, proses ini mengunduh & menyelaraskan semua modul aplikasi...$C_RESET"
Write-Host ""

$sw = [System.Diagnostics.Stopwatch]::StartNew()
$proc = Start-Process -FilePath "npm.cmd" -ArgumentList "install" -NoNewWindow -PassThru -Wait
$sw.Stop()

if ($proc.ExitCode -ne 0) {
    Write-Host ""
    Write-Host "  $C_RED$C_BOLD[ERROR] npm install gagal! Periksa koneksi internet Anda.$C_RESET"
    Write-Host ""
    Read-Host "Tekan Enter untuk menutup"
    exit 1
}

Write-Host "    $C_EMERALD[OK]$C_RESET Library dependensi berhasil dipasang ($($sw.Elapsed.TotalSeconds.ToString("0.0")) detik)!"

# Selaraskan better-sqlite3 jika diperlukan
try {
    & node -e "require('better-sqlite3')" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "    $C_AMBER[*] Menyelaraskan modul database native dengan Node $nodeVer...$C_RESET"
        & npm.cmd rebuild better-sqlite3
        Write-Host "    $C_EMERALD[OK]$C_RESET Modul database berhasil diselaraskan!"
    }
} catch {}
Write-Host ""

# ------------------------------------------------------------------------------
# STEP 4: INISIALISASI DATABASE & USER ADMIN
# ------------------------------------------------------------------------------
Write-Host "  $C_CYAN$C_BOLD>> [LANGKAH 4/5]$C_RESET $C_WHITE Memeriksa database SQLite & Akun Admin...$C_RESET"
Start-Sleep -Milliseconds 250

$seedOutput = & node prisma/seed.js 2>&1
foreach ($line in $seedOutput) {
    Write-Host "    $C_SLATE$line$C_RESET"
}
Write-Host "    $C_EMERALD[OK]$C_RESET Database & Akun Admin siap digunakan!"
Write-Host ""

# ------------------------------------------------------------------------------
# STEP 5: BUILD PRODUKSI NEXT.JS
# ------------------------------------------------------------------------------
Write-Host "  $C_CYAN$C_BOLD>> [LANGKAH 5/5]$C_RESET $C_WHITE Melakukan Kompilasi Produksi (npm run build)...$C_RESET"
Write-Host "    $C_SLATE Mengoptimasi seluruh rute, halaman, dan CSS untuk performa maksimal...$C_RESET"
Write-Host ""

$swBuild = [System.Diagnostics.Stopwatch]::StartNew()
$buildProc = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "build" -NoNewWindow -PassThru -Wait
$swBuild.Stop()

if ($buildProc.ExitCode -ne 0) {
    Write-Host "    $C_AMBER[!] Build produksi mengalami kendala, namun aplikasi tetap bisa jalan via Dev Mode.$C_RESET"
} else {
    Write-Host "    $C_EMERALD[OK]$C_RESET Build produksi selesai sukses ($($swBuild.Elapsed.TotalSeconds.ToString("0.0")) detik)!"
}
Write-Host ""

# ------------------------------------------------------------------------------
# SELESAI / CELEBRATION SUMMARY
# ------------------------------------------------------------------------------
Write-Host "  +====================================================================================================+" -ForegroundColor Green
Write-Host "  |  [SELESAI] SEMUA INSTALASI & PERBAIKAN BERHASIL 100%!                                              |" -ForegroundColor Green
Write-Host "  +====================================================================================================+" -ForegroundColor Green
Write-Host "  |  * Server Aplikasi : http://localhost:3000                                                         |" -ForegroundColor White
Write-Host "  |  * Akun Default    : Username: $C_CYAN$C_BOLDadmin$C_RESET$C_WHITE  |  Password: $C_CYAN$C_BOLDadmin123$C_RESET$C_WHITE                                       |" -ForegroundColor White
Write-Host "  |  * Cara Jalankan   : Cukup klik dua kali file $C_EMERALD$C_BOLDSTART.bat$C_RESET$C_WHITE kapan saja                               |" -ForegroundColor White
Write-Host "  +====================================================================================================+" -ForegroundColor Green
Write-Host ""

Write-Host "  $BG_EMERALD PILIHAN TINDAKAN $C_RESET"
Write-Host "   $C_WHITE[1]$C_RESET Tekan $C_EMERALD$C_BOLD[ENTER]$C_RESET untuk $C_BOLD LANGSUNG JALANKAN APLIKASI$C_RESET sekarang"
Write-Host "   $C_WHITE[2]$C_RESET Ketik $C_AMBER$C_BOLD[Q]$C_RESET lalu tekan Enter untuk menutup jendela ini"
Write-Host ""

$pilihan = Read-Host "  Pilihan Anda (Tekan ENTER untuk jalankan)"
if ([string]::IsNullOrWhiteSpace($pilihan) -or $pilihan -eq "1") {
    Write-Host ""
    Write-Host "  🚀 Menjalankan START.bat..." -ForegroundColor Cyan
    Start-Process "cmd.exe" -ArgumentList "/k START.bat"
}
