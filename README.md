# ARSIP DIGITAL BHT - PENGADILAN AGAMA GUNUNG SUGIH
## Dokumentasi Fitur, Desain Antarmuka, dan Inventaris Tombol / Interaksi (Design Specification for Google Stitch)

Dokumen ini disusun sebagai acuan komprehensif rancangan antarmuka (UI/UX) dan sistem fitur aplikasi **Arsip Digital BHT Pengadilan Agama Gunung Sugih**, dirancang agar siap diimpor ke **Google Stitch** untuk pembuatan desain ulang (*UI Redesign & Screen Generation*).

---

## 1. SISTEM DESAIN & PANDUAN VISUAL (DESIGN SYSTEM TOKENS)

### 1.1. Filosofi & Karakter Aplikasi
- **Domain:** Lembaga Peradilan Agama (Instansi Yudisial Pemerintah Indonesia / Mahkamah Agung RI).
- **Nuansa Desain:** Formal, bersih, modern, terstruktur, berwibawa, dan sangat mudah digunakan (*user-friendly*) oleh aparatur sipil negara.
- **Pendekatan Layout:** *Dashboard Web Application* dengan *Collapsible Responsive Sidebar*, *Sticky Topbar*, serta *Card-based Content Area*.

### 1.2. Palet Warna (Color Palette Tokens)
| Token Nama | Hex Code | Deskripsi Penggunaan |
| :--- | :--- | :--- |
| `--hijau-tua` *(Primary)* | `#0F4D3A` | Warna resmi Pengadilan Agama, header sidebar, tombol utama, judul utama |
| `--hijau` *(Primary Hover)* | `#146C4F` | Status aktif menu, hover button, garis aksen |
| `--hijau-terang` *(Accent)* | `#1E8A63` | Indikator sukses, fokus form input, badge dokumen |
| `--kuning` *(Gold Accent)* | `#F2B418` | Aksen lambang peradilan, highlight bintang |
| `--abu-bg` *(Neutral Light)* | `#F4F6F5` | Background canvas aplikasi |
| `--border` *(Divider)* | `#E2E6E4` | Border kartu, garis pemisah tabel, outline input |
| `--teks` *(Neutral Dark)* | `#1F2A24` | Tipografi utama, teks hitam lembut berbobot |
| `--merah-danger` *(Destructive)* | `#E5484D` / `#C53030` | Tombol hapus, alert error, notifikasi antrean pending |
| `--oranye-warning` *(Warning)* | `#B5680A` / `#FFF3E0` | Status arsip "Sedang Dipinjam", peringatan nonaktif |
| `--biru-info` *(Informational)* | `#1A56DB` / `#E6F0FF` | Badge perkara perdata gugatan |

### 1.3. Tipografi
- **Font Utama:** System Font Modern (`-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `"Inter"`, `sans-serif`)
- **Hierarki:**
  - H1 / Page Header: 20px - 22px, Bold 800
  - Section Header: 16px - 18px, Semi-Bold 700
  - Body Text: 14px, Regular 400, Line Height 1.55
  - Label / Metadata: 12px - 13px, Medium 600
  - Badges / Microcopy: 11px - 12px, Semi-Bold 700

---

## 2. MATRIKS HAK AKSES PENGGUNA (ROLE-BASED ACCESS CONTROL)

| Fitur / Halaman | Admin | Petugas | Peninjau (Staf Umum) |
| :--- | :---: | :---: | :---: |
| **Login & Register Akun** | ✅ | ✅ | ✅ |
| **Dashboard & Statistik** | ✅ | ✅ | ✅ |
| **Pencarian & Detail Arsip Perkara** | ✅ | ✅ | ✅ |
| **Unggah & Edit Arsip Perkara** | ✅ | ✅ | ❌ *(Read-Only)* |
| **Hapus Arsip Perkara** | ✅ | ✅ | ❌ |
| **Catat Peminjaman & Pengembalian** | ✅ | ✅ | ❌ |
| **Koreksi Data Riwayat Peminjaman** | ✅ | ❌ | ❌ |
| **Cetak QR Code Perkara** | ✅ | ✅ | ✅ |
| **Arsip Kesekretariatan (Per Divisi)** | ✅ *(Kelola)* | ✅ *(Upload/Edit)* | ✅ *(Lihat/Unduh)* |
| **Arsip Laporan (Grid Bulanan)** | ✅ *(Upload/Edit)* | ✅ *(Upload/Edit)* | ✅ *(Lihat/Unduh)* |
| **Capaian Kinerja & Export Excel** | ✅ | ❌ *(Hidden)* | ❌ *(Hidden)* |
| **Log Aktivitas (Audit Trail)** | ✅ | ✅ | ❌ *(Hidden)* |
| **Kelola Data Master (Lookup)** | ✅ *(Semua)* | ❌ | ❌ |
| **Verifikasi Akun Baru (Pending)** | ✅ | ❌ | ❌ |
| **Kelola Pengguna (Add/Edit/Delete)** | ✅ | ❌ | ❌ |
| **Profil Saya & Ganti Avatar** | ✅ | ✅ | ✅ |
| **Buku Bantuan Penggunaan** | ✅ | ❌ *(Hidden)* | ❌ *(Hidden)* |

---

## 3. GLOBAL APP SHELL & KOMPONEN NAVIGASI

### 3.1. Sidebar (Menu Utama)
- **Header:**
  - Logo Pengadilan Agama (Icon perisai peradilan)
  - Judul: `ARSIP DIGITAL BHT` (Bold)
  - Sub-judul: `PA Gunung Sugih`
  - Tombol Tutup Sidebar `✕` (Khusus layar mobile)
- **Menu Items (Icon + Label):**
  1. `🏠 Dashboard` -> `/dashboard`
  2. `🔍 Arsip Perkara` -> `/cari`
  3. `📂 Arsip Kesekretariatan` (Expandable Accordion tingkat 1 dengan chevron `▸` / `▾`)
     - Sub-menu dinamis per divisi:
       * `– Kepegawaian` (Dapat di-expand ke sub-folder: `📁 SK Kepegawaian`, `📁 Kenaikan Pangkat`, `📁 Cuti Pegawai`, dll.)
       * `– Umum & Keuangan` (Sub-folder: `📁 Surat Masuk`, `📁 Surat Keluar`, `📁 BMN/Pengadaan`, dll.)
       * `– PTIP` (Sub-folder: `📁 Aplikasi & Website`, `📁 Jaringan & Server`, `📁 Laporan TI`)
     - Mengklik salah satu sub-folder langsung membuka filter seluruh arsip yang termasuk di dalamnya.
  4. `📊 Arsip Laporan` -> `/laporan`
  5. `📈 Capaian Kinerja` -> `/kinerja` *(Khusus Admin)*
  6. `📋 Log Aktivitas` -> `/log-aktivitas` *(Admin & Petugas)*
  7. `⚙️ Pengaturan` -> `/pengaturan` (Dilengkapi **Badge Pill Merah** angka antrean akun pending untuk Admin)
  8. `❓ Bantuan` -> `/bantuan` *(Khusus Admin)*
  9. `🚪 Logout` -> Memanggil aksi logout sesi
- **Footer Sidebar:**
  - Komponen Avatar Pengguna (Foto / Inisial / Icon warna 36px)
  - Nama Lengkap Pengguna (Truncated ellipsis)
  - Role Pengguna (Badge role)
- **Tombol Mobile:**
  - Tombol Hamburger Menu `☰` di pojok kiri atas saat layar responsif (< 768px).

---

## 4. DAFTAR SPESIFIKASI LAYAR LENGKAP & INVENTARIS TOMBOL

### SCREEN 1: LOGIN (`/login`)
- **Tujuan:** Autentikasi aparatur pengadilan untuk masuk ke aplikasi.
- **Elemen Visual:**
  - Logo resmi PA Gunung Sugih (64x64px)
  - Judul: `ARSIP DIGITAL BHT - Pengadilan Agama Gunung Sugih`
- **Field Form:**
  1. Input `Username` (Teks, Required)
  2. Input `Password` (Password, Required)
  3. Alert Box Error (Muncul jika kredensial salah / akun belum diverifikasi)
- **Tombol & Tautan:**
  - Tombol `🔒 Login` (Button Primary, Full-Width, State: Normal / "Memproses...")
  - Tautan `Buat Akun` -> Navigasi ke `/register`
  - Catatan kaki: `Lupa password? Silahkan hubungi admin.`

---

### SCREEN 2: REGISTRASI AKUN BARU (`/register`)
- **Tujuan:** Pendaftaran mandiri staf/pegawai baru sebelum diverifikasi oleh Admin.
- **Field Form:**
  1. Input `Nama Lengkap` (Teks, Required)
  2. Input `Username` (Teks, Required)
  3. Input `Password` (Password, Min 6 karakter, Required)
- **Tombol & Tautan:**
  - Tombol `Buat Akun` (Button Primary, Full-Width, State: Normal / "Memproses...")
  - Tautan `Sudah punya akun? Login di sini` -> Navigasi ke `/login`
- **State Sukses (Registration Completed Card):**
  - Icon Centang Hijau `✅` (40px)
  - Judul: `Akun berhasil dibuat`
  - Pesan pemberitahuan: *"Akun kamu masih menunggu verifikasi admin sebelum bisa dipakai untuk login..."*
  - Tombol `Kembali ke Login` (Button Primary)

---

### SCREEN 3: DASHBOARD UTAMA (`/dashboard`)
- **Tujuan:** Ringkasan statistik eksekutif arsip BHT, tren perkara, arsip terbaru, dan aktivitas operasional.
- **Header:**
  - Title Topbar: `DASHBOARD`
  - Alert 404 Dismissible: Banner peringatan *"⚠️ Halaman yang Anda tuju tidak ditemukan"* + tombol `✕` tutup
  - Sapaan: `Selamat datang 👋`
  - Filter Tahun: Dropdown `<select>` pemilihan tahun analisis (di pojok kanan)
- **Kartu Statistik (Stat Grid):**
  1. Card `TOTAL ARSIP BHT`: Angka besar (Hijau tua) + label satuan "Dokumen"
  2. Card `SEDANG DIPINJAM`: Angka besar (Amber oranye) + label satuan "Dokumen"
  3. Cards Jenis Perkara (Dinamis): Rincian jumlah arsip per jenis perkara (Cerai Gugat, Cerai Talak, Dispensasi Kawin, dll.) dengan badge warna khas.
- **Bagian Grafik Interaktif:**
  1. Card `STATISTIK ARSIP PER TAHUN`:
     - Grafik Batang (Recharts Bar Chart) tren arsip dalam jendela geser 5 tahun.
     - Tombol Navigasi:
       * Tombol `←` (Tahun sebelumnya / geser ke masa lalu)
       * Label Rentang: `[Tahun Awal] — [Tahun Akhir]`
       * Tombol `→` (Tahun berikutnya / disabled jika sudah tahun terkini)
  2. Card `JENIS PERKARA ([Tahun])`:
     - Grafik Lingkaran Donat (Recharts Donut/Pie Chart) proporsi perkara.
     - Tooltip hover & legenda warna.
     - State Kosong: Tulisan *"Belum ada data tahun ini"* jika nihil.
- **Bagian Tabel & Feed Bawah:**
  1. Card `ARSIP TERBARU`:
     - Tabel daftar berkas terakhir diunggah: Nomor Perkara, Jenis Perkara (Badge), Status (Pill Hijau "Ada" / Kuning "Dipinjam"), Tanggal BHT, Aksi.
     - Tombol Aksi: Tombol Pill `👁️` (Lihat PDF berkas di tab baru)
     - Tombol `Lihat Semua Arsip` (Button Secondary) -> Navigasi ke `/cari`
  2. Card `AKTIVITAS TERAKHIR`:
     - Feed riwayat log ringkas (Nama pelaku bold, deskripsi aksi, timestamp relatif/waktu).

---

### SCREEN 4: DAFTAR ARSIP PERKARA (`/cari`)
- **Tujuan:** Pusat pencarian data, penelusuran status berkas fisik, cetak QR massal, dan manajemen arsip BHT.
- **Topbar Actions:**
  - Tombol `🔳 Cetak QR` (Mengaktifkan mode checklist cetak massal)
  - Mode Cetak Aktif:
    * Tombol `🖨️ Cetak QR Terpilih (N)` (Button Primary, membuka print preview)
    * Tombol `Batal` (Button Secondary, menonaktifkan mode checklist)
  - Tombol `+ Upload` (Button Primary, khusus Admin & Petugas) -> Navigasi ke `/cari/upload`
- **Form Pencarian & Filter:**
  1. Input `Cari nomor perkara / nama pihak` (Pencarian fleksibel)
  2. Dropdown `Jenis Perkara` (Filter: Semua Jenis / opsi spesifik)
  3. Dropdown `Status` (Semua / Ada / Dipinjam)
  4. Input `Tahun` (Input teks angka 4 digit)
  5. Tombol `🔍 Cari` (Button Primary submit filter)
- **Tabel Data Arsip:**
  - Kolom:
    1. Checkbox Pilihan (Hanya muncul saat mode QR aktif)
    2. Nomor Perkara (Contoh: `123/Pdt.G/2024/PA.GS`)
    3. Jenis Perkara (Pill Badge warna)
    4. Status Berkas (Badge Pill: `Ada` [Hijau] / `Dipinjam` [Oranye])
    5. Nama Pihak
    6. Tanggal BHT (Format Indonesia: `DD MMMM YYYY`)
    7. Diunggah oleh (Nama petugas)
    8. Aksi Dokumen
  - **Daftar Tombol Tiap Baris (Row Actions):**
    * Tombol `Detail` (Button Secondary) -> Buka `/cari/[id]`
    * Tombol Pill `👁️` (Lihat file PDF asli di tab baru)
    * Tombol Pill `⬇️` (Download langsung berkas PDF)
    * Tombol Pill Primary `✏️` (Edit metadata arsip) -> Buka `/cari/[id]/edit`
    * Tombol Pill Danger `🗑️` (Hapus arsip) -> Membuka Modal Konfirmasi Hapus
- **Kontrol Paginasi:**
  - Label: `Total X arsip`
  - Tombol `‹ Sebelumnya` (Disabled pada halaman 1)
  - Indikator: `Halaman X / Y`
  - Tombol `Berikutnya ›` (Disabled pada halaman terakhir)
- **Modal Konfirmasi Hapus Arsip:**
  - Header: `Hapus Arsip?`
  - Pesan: `Yakin ingin menghapus arsip [Nomor Perkara]? Tindakan ini tidak bisa dibatalkan.`
  - Tombol `Batal` (Button Secondary)
  - Tombol `Hapus` (Button Danger, State: "Menghapus...")

---

### SCREEN 5: UNGGAH ARSIP PERKARA BARU (`/cari/upload`)
- **Tujuan:** Formulir penginputan arsip perkara BHT digital beserta penempatan lokasi fisik di gudang arsip.
- **Topbar:**
  - Title: `UPLOAD ARSIP PERKARA`
  - Tombol `← Kembali ke Daftar` -> Kembali ke `/cari`
- **Formulir Input (Card Max-Width 560px):**
  1. Input `Nomor Perkara *` (Placeholder: `Contoh: 123/Pdt.G/2024/PA.GS`)
  2. Dropdown `Jenis Perkara *` (Diambil otomatis dari Data Master)
  3. Input `Nama Pihak` (Contoh: `Siti & Budi`)
  4. Input Date `Tanggal BHT *` (Format kalender tanggal berkekuatan hukum tetap)
  5. Textarea `Keterangan` (Catatan berkas, 3 baris)
  6. **Sub-Card Lokasi Fisik Berkas `📍 Lokasi Fisik Berkas *`:**
     - Input `Nomor Ruang *` (Contoh: Ruang Arsip 1)
     - Input `Nomor Rak/Lemari *` (Contoh: Rak B)
     - Input `Nomor Tingkat/Laci *` (Contoh: Tingkat 3)
     - Input `Nomor Boks *` (Contoh: Boks 12)
  7. File Picker `File PDF *`:
     - File input khusus `.pdf` (Maksimal 20MB)
     - Keterangan instruksi ukuran file
  8. Feedback Area:
     - Pesan error merah jika validasi gagal
     - Pesan sukses hijau `✅ Arsip berhasil diunggah.`
- **Tombol Aksi:**
  - Tombol `📎 Upload Arsip` (Button Primary, State: "Mengunggah...")

---

### SCREEN 6: EDIT ARSIP PERKARA (`/cari/[id]/edit`)
- **Tujuan:** Pembaruan data perkara, reposisi fisik berkas, atau penggantian file PDF yang salah scan.
- **Topbar:**
  - Title: `EDIT ARSIP PERKARA`
  - Tombol `← Batal / Kembali` -> Navigasi ke `/cari/[id]`
- **Elemen Tambahan Dibanding Form Upload:**
  - Informasi file saat ini: Tautan `👁️ Lihat file saat ini ([Ukuran KB/MB])`
  - File picker bersifat opsional: *"Kosongkan jika tidak ingin mengganti file PDF"*
- **Tombol Aksi:**
  - Tombol `Simpan Perubahan` (Button Primary)
  - Tombol `Batal` (Button Secondary)

---

### SCREEN 7: DETAIL ARSIP & PEMINJAMAN (`/cari/[id]`)
- **Tujuan:** Tinjauan detail perkara, pencatatan peminjaman fisik berkas, riwayat peminjam, dan cetak QR code.
- **Layout:** Grid 2 Kolom (Kiri: Metadata & Transaksi Peminjaman, Kanan: QR Code).
- **Kolom Kiri (Card 1: Metadata Berkas):**
  - Judul Besar: Nomor Perkara
  - Badge Jenis Perkara
  - Badge Status Besar: `📗 Ada` (Hijau) ATAU `📕 Dipinjam` (Oranye)
  - Tabel Metadata:
    * Nama Pihak
    * Tanggal BHT
    * Keterangan
    * Lokasi Fisik: *"Ruang [X], Rak [Y], Laci [Z], Boks [W]"*
  - Tombol Operasional:
    * Tombol `👁️ Lihat PDF` (Membuka viewer PDF di tab baru)
    * Tombol `⬇️ Download` (Unduh file)
    * Tombol `✏️ Edit` (Khusus Admin/Petugas) -> Buka `/cari/[id]/edit`
- **Kolom Kiri (Card 2: Form Peminjaman & Pengembalian):**
  - **Kondisi A (Jika Status "Ada"):**
    * Judul: `Catat Peminjaman`
    * Input `Peminjam *` (Contoh: `Hakim Anggota / PTA Lampung / Pemohon`)
    * Input Date `Tanggal Pinjam *` (Default hari ini)
    * Tombol `📤 Catat Peminjaman` (Button Primary)
  - **Kondisi B (Jika Status "Sedang Dipinjam"):**
    * Judul: `Peminjaman Aktif`
    * Informasi teks: *"Sedang dipinjam oleh [Nama Peminjam], sejak [Tanggal Pinjam]."*
    * Input Date `Tanggal Kembali *` (Default hari ini)
    * Tombol `✅ Tandai Dikembalikan` (Button Primary)
- **Kolom Kiri (Card 3: Tabel Riwayat Peminjaman):**
  - Kolom Tabel:
    1. Peminjam
    2. Tanggal Pinjam
    3. Tanggal Kembali (Menampilkan teks oranye bold *"Belum kembali"* jika aktif)
    4. Dicatat oleh (Nama staf)
    5. Aksi (Khusus Admin)
  - Tombol Aksi Khusus Admin:
    * Tombol `✏️ Edit` (Membuka Modal Koreksi Data Peminjaman)
- **Kolom Kanan (Card 4: QR Code & Stempel Berkas):**
  - Gambar QR Code Beresolusi Tinggi (Auto-generated per perkara)
  - Petunjuk: *"Scan untuk langsung membuka halaman ini."*
  - Tombol `🖨️ Cetak QR` (Button Primary) -> Membuka halaman cetak
- **Modal Koreksi Riwayat Peminjaman (Admin Only):**
  - Judul: `Edit Data Peminjaman`
  - Input `Nama Peminjam *`
  - Input Date `Tanggal Pinjam *`
  - Input Date `Tanggal Kembali` (Opsional, kosong jika masih dipinjam)
  - Tombol `Simpan` (Button Primary)
  - Tombol `Batal` (Button Secondary)

---

### SCREEN 8: CETAK QR CODE SATUAN / MASSAL (`/cari/cetak-qr`)
- **Tujuan:** Halaman siap cetak (*print-friendly*) stiker QR code untuk ditempelkan pada sampul berkas fisik perkara.
- **Bagian Atas (No-Print Toolbar):**
  - Tombol `🖨️ Cetak Sekarang` (Memanggil dialog cetak browser `window.print()`)
  - Teks Indikator: `X QR code siap dicetak`
- **Tata Letak Cetak (Print Grid):**
  - Grid 3 Kolom kartu bertitik-putus (*dashed border*)
  - Setiap kartu memuat: Gambar QR Code + Nomor Perkara tebal di bawahnya
  - Fitur CSS `@media print` otomatis menyembunyikan header/toolbar.

---

### SCREEN 9: ARSIP KESEKRETARIATAN — SISTEM FOLDER & SUB-KATEGORI CUSTOM (`/kesekretariatan/[slug]`)
- **Tujuan:** Manajemen dokumen kesekretariatan non-perkara (SK, Berita Acara, Surat Tugas, DIPA, Pengadaan, Cuti, dll.) dengan arsitektur **Folder / Sub-Kategori Berjenjang yang Fleksibel & Custom per Divisi**.
- **Konsep Kustomisasi (Custom Folders):**
  - Setiap divisi (Kepegawaian, Umum, PTIP, dll.) memiliki folder/sub-kategori masing-masing yang dapat di-custom secara mandiri oleh instansi.
  - **Contoh Sub-Kategori Divisi Kepegawaian:**
    * 📁 `SK Kepegawaian` (Menampung SK Pengangkatan, SK Mutasi, SK Tim Kerja, SK Kenaikan Gaji)
    * 📁 `Kenaikan Pangkat (KP)` (Menampung usulan KP, PAK, nota persetujuan BKN)
    * 📁 `Cuti Pegawai` (Surat izin cuti tahunan, cuti bersalin, cuti sakit)
    * 📁 `Kenaikan Gaji Berkala (KGB)`
    * 📁 `Disiplin & Kinerja Pegawai`
  - **Contoh Sub-Kategori Divisi Umum & Keuangan:**
    * 📁 `Surat Masuk`
    * 📁 `Surat Keluar`
    * 📁 `Pengadaan & BMN (Barang Milik Negara)`
    * 📁 `DIPA & Tagihan Keuangan`
  - **Contoh Sub-Kategori Divisi PTIP:**
    * 📁 `Dokumen Aplikasi & Inovasi Website`
    * 📁 `Infrastruktur Server & Jaringan`
    * 📁 `Laporan Berkala TI`

- **Tampilan Antarmuka Halaman (UI Design Components):**
  1. **Topbar:**
     - Breadcrumb Aktif: `Arsip Kesekretariatan > [Nama Divisi] > [Nama Folder / Sub-Kategori]`
     - Tombol `+ Upload Dokumen` (Button Primary, membuka modal upload)
     - Tombol `📁 + Tambah Folder` (Button Secondary, untuk menambah sub-kategori baru)
  2. **Grid Kartu Folder Visual (Folder Cards / Google Drive Style):**
     - Ditampilkan di bagian atas halaman:
     - Kartu Folder memuat:
       * Icon Folder Emas/Hijau (`📁`)
       * Nama Sub-Kategori Bold (Contoh: `SK Kepegawaian`)
       * Counter badge: `X Dokumen` (Menghitung jumlah berkas di dalam folder)
       * Hover efek lembut (Shadow naik & border hijau)
       * **Interaksi Klik Folder:** Mengklik kartu folder langsung memfilter dan membuka seluruh berkas dokumen yang ada di dalam kategori tersebut!
  3. **Filter & Navigasi Cepat:**
     - Input pencarian: `Cari nama dokumen...`
     - Tab Kategori Horizontal (Pill Filter): `[Semua Folder] [SK Kepegawaian] [Kenaikan Pangkat] [Cuti] ...`
     - Tombol `← Kembali ke Semua Folder` (Saat sedang berada di dalam tampilan drill-down folder tertentu)
  4. **Tabel Data Dokumen Arsip:**
     - Menampilkan dokumen sesuai folder yang dipilih (atau seluruh dokumen jika memilih Semua):
     - Kolom:
       1. `Nama Dokumen` (Teks judul berkas)
       2. `Folder / Sub-Kategori` (Badge label warna khas)
       3. `Diunggah Oleh` (Nama petugas pembuat)
       4. `Tanggal Upload` (Format tanggal Indonesia)
       5. `Ukuran Berkas` (Format KB/MB)
       6. `Aksi Dokumen`
     - Tombol Aksi per Baris:
       * Tombol `👁️` (Lihat PDF berkas di tab baru)
       * Tombol `⬇️` (Download PDF)
       * Tombol `✏️` (Edit metadata / pindah folder / ganti file)
       * Tombol `🗑️` (Hapus berkas dengan modal konfirmasi)
  5. **Modal Form Upload / Edit Dokumen Kesekretariatan:**
     - Input `Nama Dokumen *` (Contoh: *SK Pengangkatan CPNS 2024*)
     - Dropdown `Pilih Folder / Sub-Kategori *` (Otomatis terpilih jika upload dari dalam folder)
     - Informasi file saat ini (saat edit) + tautan lihat file & ukuran
     - File picker `File PDF *` (Maksimal 20MB)
     - Tombol `Simpan Dokumen` & Tombol `Batal`
  6. **Modal Buat / Ubah Folder Baru:**
     - Input `Nama Folder / Sub-Kategori Baru *` (Contoh: *SK Kepegawaian*)
     - Dropdown `Divisi Pemilik`
     - Tombol `Buat Folder` & Tombol `Batal`
  7. **Modal Konfirmasi Hapus Berkas:**
     - Tombol `Batal` & Tombol `Hapus` (Danger)

---

### SCREEN 10: ARSIP LAPORAN BULANAN MATRIX (`/laporan`)
- **Tujuan:** Matriks kontrol pelaporan berkala 12 bulan (L1-PA s.d. L14-PA) dalam format kalender grid.
- **Topbar:**
  - Title: `ARSIP LAPORAN`
  - Dropdown `Tahun` (Pilihan 8 tahun ke belakang)
  - Tombol `+ Upload` (Button Primary, modal upload bebas)
- **Tabel Matriks Bulanan Interaktif:**
  - Kolom Kiri *Sticky*: `Jenis Laporan`
  - 12 Kolom Bulan: `Jan`, `Feb`, `Mar`, `Apr`, `Mei`, `Jun`, `Jul`, `Agu`, `Sep`, `Okt`, `Nov`, `Des`
  - **Karakter Sel Interaktif:**
    * **Sel Terisi:** Tombol kotak hijau lembut dengan simbol `✓` (Centang). Mengklik sel ini membuka **Modal Aksi Laporan**.
    * **Sel Kosong:** Tombol kotak abu-abu dengan simbol titik `·`. Mengklik sel ini langsung membuka **Modal Upload** otomatis dengan bulan dan jenis laporan yang sudah terpilih!
  - Keterangan Legenda di bawah tabel.
- **Modal Aksi Laporan (Saat Sel `✓` Diklik):**
  - Header: `[Jenis Laporan] — [Nama Bulan]`
  - Nama Dokumen yang tersimpan
  - Tombol `👁️ Lihat` (View PDF)
  - Tombol `⬇️ Download`
  - Tombol `✏️ Edit` (Ganti file / nama)
  - Tombol `🗑️ Hapus` (Hapus laporan bulan tersebut)
  - Tombol `Tutup`
- **Modal Form Upload / Edit Laporan:**
  - Input `Nama Laporan *`
  - Dropdown `Bulan *` (Januari - Desember)
  - Dropdown `Tahun *`
  - Dropdown `Jenis Laporan *`
  - Input `File PDF *`
  - Tombol `Simpan` & `Batal`

---

### SCREEN 11: CAPAIAN KINERJA TAHUNAN (`/kinerja`) - ADMIN ONLY
- **Tujuan:** Digitalisasi perhitungan target, realisasi, dan persentase capaian kinerja pengadilan pengganti buku kerja Excel.
- **Topbar:**
  - Title: `CAPAIAN KINERJA TAHUNAN`
  - Dropdown `Tahun`
  - Tombol `⬇️ Export Excel` (Button Primary, menghasilkan file `.xlsx` format lanskap A4 lengkap tanda tangan pejabat)
- **Kartu Indikator per Sasaran Strategis:**
  - Judul Sasaran Kinerja (Bold)
  - Tabel Indikator:
    * Kolom: `Indikator Kinerja`, `Target`, `Realisasi (%)`, `Capaian (%)`, `Aksi`
    * Indikator Nonaktif ditandai badge kuning kecil `Nonaktif`
    * Kolom Capaian (%) otomatis berwarna: **Hijau** jika ≥ 100%, **Amber** jika < 100%.
  - **Tombol Aksi Pengisian Nilai:**
    * Tombol `✏️ Isi Nilai` (Untuk indikator Tipe 1: input 1 angka tahunan)
    * Tombol `📅 Isi Bulanan` (Untuk indikator Tipe 2: input bulanan perbandingan 2 nilai)
- **Modal Pengisian Nilai Tipe 1 (Satu Input Langsung):**
  - Label indikator dinamis
  - Input `Nilai Capaian` (Angka)
  - Tombol `Simpan` & `Batal`
- **Modal Pengisian Nilai Tipe 2 (Dua Input 12 Bulan):**
  - Tabel 12 baris (Januari s.d. Desember)
  - Kolom Input 1 (Contoh: *Jumlah Perkara Selesai Tepat Waktu*)
  - Kolom Input 2 (Contoh: *Jumlah Total Perkara Selesai*)
  - Tombol `Simpan` & `Batal`

---

### SCREEN 12: LOG AKTIVITAS / AUDIT TRAIL (`/log-aktivitas`)
- **Tujuan:** Rekam jejak seluruh aktivitas manipulasi data oleh pengguna demi transparansi dan akuntabilitas.
- **Aktor:** Admin & Petugas (Peninjau dibatasi).
- **Tabel Audit:**
  - Kolom:
    1. `Waktu` (Tanggal & jam presisi)
    2. `Pengguna` (Nama aparatur pelaksana)
    3. `Aksi` (Badge emoji khas aksi):
       * `📤 Upload Arsip` / `🗑️ Hapus Arsip` / `✏️ Ubah Arsip`
       * `📤 Catat Peminjaman` / `📥 Catat Pengembalian` / `✏️ Koreksi Peminjaman`
       * `👤 Buat Akun` / `🗑️ Hapus Akun` / `📝 Daftar Akun`
       * `📊 Isi Capaian Kinerja` / `📤 Export Capaian Kinerja`
       * Dan badge aksi data master lainnya.
    4. `Deskripsi` (Detail perkara / dokumen / pengguna terkait)
- **Paginasi:** 25 entri per halaman dengan navigasi halaman.

---

### SCREEN 13: PENGATURAN - DATA MASTER (`/pengaturan?tab=master`)
- **Tujuan:** Pengelolaan klasifikasi data sistem secara dinamis dan aman.
- **Navigasi Tab Kategori:**
  - Tab 1: `Data Master`
  - Tab 2: `Kinerja`
  - Tab 3: `Akun`
  - Tab 4: `Profil Saya`
- **Sub-Tab Data Master:**
  1. `Jenis Perkara`
  2. `Jenis Kesekretariatan`
  3. `Jenis Laporan`
  4. `Divisi` *(Admin only)*
- **Fitur pada Setiap Tabel Master (`KelolaLookupList`):**
  - Form Atas: Input `[Nama Baru]` + Tombol `+ Tambah`
  - Tabel Drag & Drop:
    * Handle Drag `⠿` (Dukungan geser urutan `@dnd-kit`)
    * Preview Badge Warna (Urutan mempengaruhi warna badge)
    * Tombol `Ubah Nama` (Mengubah baris menjadi input teks + tombol `Simpan` dan `Batal`)
    * Tombol Danger `Hapus`
- **Modal Proteksi Hapus dengan Kategori Pengganti:**
  - Jika kategori masih dipakai oleh data arsip di database, sistem mencegah *broken relation*.
  - Muncul dialog: *"Kategori ini sedang digunakan oleh [N] arsip. Pilih kategori pengganti sebelum dihapus:"*
  - Dropdown `Pilih Pengganti`
  - Tombol `Ganti & Hapus` & Tombol `Batal`

---

### SCREEN 14: PENGATURAN - KELOLA KINERJA (`/pengaturan?tab=kinerja`)
- **Tujuan:** Konfigurasi struktur indikator kinerja, target tahunan, dan data penandatangan.
- **Bagian 1: Pejabat Penandatangan Laporan:**
  - Input `Nama Pejabat Penandatangan` (Contoh: Ketua PA / Panitera)
  - Input `NIP Pejabat`
  - Tombol `Simpan Penandatangan` (Disertai pesan konfirmasi tersimpan)
- **Bagian 2: Target per Tahun:**
  - Dropdown `Target untuk tahun`
  - Daftar input angka Target per indikator (Otomatis tersimpan saat kursor pindah / on-blur)
- **Bagian 3: Tambah Sasaran Baru:**
  - Input `Nama Sasaran Kinerja`
  - Tombol `+ Tambah Sasaran`
- **Bagian 4: Pengaturan Pohon Sasaran & Indikator:**
  - **Tingkat Sasaran:**
    * Tombol Urutan: `↑` (Naik) dan `↓` (Turun)
    * Tombol Status: `Aktifkan` / `Nonaktifkan`
    * Tombol Edit Nama Sasaran (`Simpan` / `Batal`)
    * Tombol `+ Indikator`
    * Tombol `Hapus` Sasaran
  - **Tingkat Indikator:**
    * Nama Indikator & tipe input
    * Tombol Urutan: `↑` dan `↓`
    * Tombol Status: `Aktifkan` / `Nonaktifkan`
    * Tombol `Edit` (Membuka Modal Form Indikator)
    * Tombol `Hapus` Indikator
- **Modal Tambah / Edit Indikator:**
  - Input `Nama Indikator *`
  - Radio/Select `Tipe Input`:
    * Pilihan 1: *Satu Input Langsung (Capaian Tahunan)*
    * Pilihan 2: *Dua Input Pembanding (Pembilang & Penyebut Tiap Bulan)*
  - Input `Label Input 1 *` (Contoh: "Jumlah Perkara Selesai Tepat Waktu")
  - Input `Label Input 2 *` (Contoh: "Jumlah Total Perkara Selesai" - jika Tipe 2)
  - Tombol `Simpan` & `Batal`

---

### SCREEN 15: PENGATURAN - VERIFIKASI AKUN BARU (`/pengaturan?tab=verifikasi`)
- **Tujuan:** Otorisasi pendaftaran akun baru oleh Admin.
- **Indikator Sidebar:** Badge merah jumlah antrean jika ada calon pengguna baru.
- **Tabel Pendaftaran Pending:**
  - Kolom:
    1. `Nama Lengkap`
    2. `Username`
    3. `Daftar Pada` (Waktu pendaftaran)
    4. `Role yang Diberikan` (Dropdown pilihan: `Petugas`, `Peninjau`, atau `Admin`)
    5. `Aksi Persetujuan`
  - Tombol Aksi:
    * Tombol `Verifikasi` (Button Primary, mengaktifkan akun secara instan)
    * Tombol `Tolak` (Button Danger, menghapus permohonan pendaftaran)
  - State Kosong: Pesan *"Tidak ada pendaftaran yang menunggu verifikasi."*

---

### SCREEN 16: PENGATURAN - KELOLA PENGGUNA (`/pengaturan?tab=pengguna`)
- **Tujuan:** Manajemen akun yang telah aktif dalam sistem.
- **Header:**
  - Tombol `+ Tambah Akun` (Button Primary)
- **Form Tambah / Edit Pengguna (Collapsible Card):**
  - Input `Nama Lengkap *`
  - Input `Username *`
  - Input Password `Password` (Wajib saat tambah, opsional saat edit)
  - Dropdown `Role *` (`Petugas`, `Peninjau`, `Admin`)
  - Tombol `Buat Akun` / `Simpan Perubahan`
  - Tombol `Batal`
- **Tabel Pengguna Aktif:**
  - Kolom: Nama Lengkap (Menandai `(kamu)` pada baris akun sendiri), Username, Badge Role, Tanggal Dibuat, Aksi.
  - Tombol Aksi:
    * Tombol `Edit` (Membuka form edit)
    * Tombol `Hapus` (Dilengkapi proteksi konfirmasi ganda `Yakin?` dan pencegahan menghapus diri sendiri atau admin terakhir).

---

### SCREEN 17: PENGATURAN - PROFIL SAYA & AVATAR (`/pengaturan?tab=profil`)
- **Tujuan:** Pengaturan identitas personal masing-masing aparatur.
- **Bagian 1: Form Profil:**
  - Input `Nama Lengkap`
  - Input `Username`
  - Input `Password Baru` (Kosongkan jika tidak ingin mengubah)
  - Tombol `Simpan Perubahan` (Disertai alert hijau sukses)
- **Bagian 2: Pengaturan Foto Profil / Avatar:**
  - Preview Avatar Saat Ini (Ukuran 64px bulat)
  - Pilihan Tab: `Avatar Icon` ATAU `Upload Foto`
  - **Jika Mode Avatar Icon:**
    * Grid 24 Ikon Simbolik (User, Timbangan, Berkas, Tas, Bintang, dll.)
    * Palet 12 Warna Latar Belakang
    * Tombol `🎲 Acak Avatar` (Memilih kombinasi icon dan warna secara random)
    * Tombol `Simpan Avatar`
  - **Jika Mode Upload Foto:**
    * File picker gambar (Mendukung JPG, PNG, WebP)
    * Sistem otomatis mengompresi gambar foto (keterangan kompresi ~KB)

---

### SCREEN 18: BANTUAN & PANDUAN APLIKASI (`/bantuan`) - ADMIN ONLY
- **Tujuan:** Dokumentasi operasional terpadu di dalam aplikasi.
- **Fitur Antarmuka:**
  - Menu Daftar Isi Cepat (Quick Jump Anchor Links) ke 11 Bab.
  - Kartu-kartu Panduan:
    1. *Pendahuluan & Level Pengguna (Admin, Petugas, Peninjau)*
    2. *Arsip Perkara (Upload, Cari, Pinjam, Cetak QR)*
    3. *Arsip Kesekretariatan*
    4. *Arsip Laporan (Tabel Grid)*
    5. *Dashboard & Statistik*
    6. *Capaian Kinerja (Sasaran, Indikator Tipe 1 & 2, Target, Export)*
    7. *Kelola Data Master*
    8. *Kelola Pengguna & Verifikasi Akun*
    9. *Profil Saya*
    10. *Log Aktivitas*
    11. *Catatan Tambahan & Troubleshooting*
  - Floating Action Button Bulat `↑` di sudut kanan bawah untuk kembali ke bagian atas (*Scroll to top*).
