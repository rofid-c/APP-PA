# ARSIP DIGITAL BHT - PENGADILAN AGAMA GUNUNG SUGIH
## Design System & UI Screen Specification for Google Stitch

Dokumen ini disusun khusus sebagai spesifikasi desain (*Design Specification*) untuk **Google Stitch**, mencakup seluruh token visual, komponen antarmuka, daftar halaman, dan inventaris interaksi tombol/form.

---

## 1. DESIGN TOKENS

### Color Palette
- `primary`: `#0F4D3A` (Dark Judicial Green - Pengadilan Agama theme)
- `primary-hover`: `#146C4F` (Emerald Green)
- `accent`: `#1E8A63` (Teal Green)
- `gold`: `#F2B418` (Court Seal Gold)
- `background`: `#F4F6F5` (Off-white / Soft Gray)
- `card-bg`: `#FFFFFF`
- `border`: `#E2E6E4`
- `text-primary`: `#1F2A24`
- `text-secondary`: `#5A6B62`
- `text-muted`: `#8A978F`
- `danger`: `#E5484D` / `#C53030`
- `warning`: `#B5680A` (Borrowing / Inactive Amber)
- `success`: `#146C4F` / `#E6F7EE`

### Typography
- Font Family: Inter, Segoe UI, -apple-system, sans-serif
- Headings: 800 Extra Bold (H1: 22px), 700 Bold (H2: 18px), 600 SemiBold (H3: 15px)
- Body: 14px / 1.55 line height
- Micro/Badges: 11px - 12px / 700 Bold uppercase

---

## 2. NAVIGATION & APP SHELL SPECIFICATION

- **Desktop Shell**: 
  - Left Fixed Sidebar: 240px width, Background `primary` (`#0F4D3A`), Text White.
  - Sticky Topbar: White background, 60px height, page title in uppercase bold.
  - Main Content Canvas: Background `#F4F6F5`, max-width fluid, padding 28px.
- **Mobile Shell**: 
  - Off-canvas drawer (transforms -100% to 0) with backdrop overlay.
  - Floating circular hamburger button `☰` in top-left corner.
- **Sidebar Header**: PA Gunung Sugih Logo (Shield with scales) + "ARSIP DIGITAL BHT".
- **Sidebar Navigation Items**:
  1. `🏠 Dashboard` (`/dashboard`)
  2. `🔍 Arsip Perkara` (`/cari`)
  3. `📂 Arsip Kesekretariatan` (Expandable chevron dropdown `▸` / `▾`)
     - Sub-divisi: Kepegawaian, Umum & Keuangan, PTIP, dll.
  4. `📊 Arsip Laporan` (`/laporan`)
  5. `📈 Capaian Kinerja` (`/kinerja`) [Role: Admin]
  6. `📋 Log Aktivitas` (`/log-aktivitas`) [Role: Admin, Petugas]
  7. `⚙️ Pengaturan` (`/pengaturan`) [With pending count badge pill for Admin]
  8. `❓ Bantuan` (`/bantuan`) [Role: Admin]
  9. `🚪 Logout` (Session terminator)
- **Sidebar Footer**: User Avatar (Photo/Icon 36px) + Full Name + Role Tag.

---

## 3. SCREEN INVENTORY & INTERACTIVE CONTROLS

### Screen 1: Login Page (`/login`)
- **Card**: Centered white card (max 400px), logo at top, agency name.
- **Controls**:
  - `input` Username (required)
  - `input` Password (masked, required)
  - `button` `🔒 Login` (primary, full width)
  - `link` `Buat Akun` -> `/register`

### Screen 2: Registration Page (`/register`)
- **Controls**:
  - `input` Nama Lengkap
  - `input` Username
  - `input` Password (min 6 chars)
  - `button` `Buat Akun` (primary, full width)
  - `link` `Login di sini` -> `/login`
- **Success State View**:
  - Checkmark `✅`, pending verification notice, button `Kembali ke Login`.

### Screen 3: Dashboard (`/dashboard`)
- **Top Bar**: Filter Tahun dropdown `<select>`
- **KPI Stat Cards**:
  1. `Total Arsip BHT` (Green numeral)
  2. `Sedang Dipinjam` (Amber numeral)
  3. Dynamic Cards per Case Type (Cerai Gugat, Cerai Talak, Dispensasi Kawin)
- **Charts**:
  1. 5-Year Window Bar Chart with `←` and `→` navigation buttons.
  2. Case Type Donut Chart with percentage breakdown.
- **Tables & Feeds**:
  1. Recent Archives table with status pills (`Ada` / `Dipinjam`) and `👁️` view action.
  2. Button `Lihat Semua Arsip` -> `/cari`
  3. Activity Feed stream (User + Action + Timestamp).

### Screen 4: Arsip Perkara List (`/cari`)
- **Action Toolbar**:
  - Button `🔳 Cetak QR` (Toggle multi-select mode)
  - In QR Mode: Button `🖨️ Cetak QR Terpilih (N)` + Button `Batal`
  - In Normal Mode: Button `+ Upload` (Admin/Petugas)
- **Filter Form**:
  - Search input (Nomor perkara / nama pihak)
  - Jenis Perkara dropdown
  - Status dropdown (`Semua`, `Ada`, `Dipinjam`)
  - Tahun input (4 digits)
  - Button `🔍 Cari`
- **Table Columns**:
  - `[Checkbox]` (In QR mode)
  - `Nomor Perkara`
  - `Jenis Perkara` (Badge)
  - `Status` (Green pill "Ada" / Amber pill "Dipinjam")
  - `Nama Pihak`
  - `Tanggal BHT`
  - `Diunggah oleh`
  - `Aksi` (Buttons: `Detail`, `👁️`, `⬇️`, `✏️`, `🗑️`)
- **Pagination**: Prev `‹`, Page indicator, Next `›`.
- **Modal**: Confirm Delete popup (with delete and cancel buttons).

### Screen 5: Upload Arsip Perkara (`/cari/upload`)
- **Back Button**: `← Kembali ke Daftar`
- **Form Card**:
  - Input `Nomor Perkara *`
  - Select `Jenis Perkara *`
  - Input `Nama Pihak`
  - Input Date `Tanggal BHT *`
  - Textarea `Keterangan`
  - Physical Location Card (4 inputs: Ruang, Rak/Lemari, Tingkat/Laci, Boks)
  - PDF File dropzone / input (max 20MB)
  - Button `📎 Upload Arsip`

### Screen 6: Edit Arsip Perkara (`/cari/[id]/edit`)
- Similar to upload, with current PDF preview link and optional file replacement.
- Buttons: `Simpan Perubahan` & `Batal`.

### Screen 7: Detail Arsip & Peminjaman (`/cari/[id]`)
- **Two-Column Layout**:
  - **Left Card 1**: Case details table, physical location, buttons: `👁️ Lihat PDF`, `⬇️ Download`, `✏️ Edit`.
  - **Left Card 2**:
    - If Ada: Form Catat Peminjaman (Peminjam, Tanggal Pinjam, button `📤 Catat Peminjaman`).
    - If Dipinjam: Banner active borrower + Form Tandai Dikembalikan (Tanggal Kembali, button `✅ Tandai Dikembalikan`).
  - **Left Card 3**: Table Riwayat Peminjaman (Admin can click `✏️ Edit` to correct logs).
  - **Right Card 4**: QR Code Preview image + Button `🖨️ Cetak QR`.
- **Modal**: Admin Edit Borrowing Record (Borrower name, Borrow Date, Return Date, Save, Cancel).

### Screen 8: Cetak QR Batch / Single (`/cari/cetak-qr`)
- No-print toolbar with `🖨️ Cetak Sekarang` (calls `window.print()`).
- 3-column sticker layout with dashed card border and bold case number.

### Screen 9: Arsip Kesekretariatan & Sistem Folder Dokumen (`/kesekretariatan/[slug]`)
- **Header**: Division name + Breadcrumb (`Arsip Kesekretariatan > Kepegawaian > 📁 SK Kepegawaian`) + Button `+ Upload Dokumen` + Button `📁 + Tambah Folder`.
- **Visual Folder Cards Grid (macOS / Google Drive Style)**:
  - Cards per sub-category (e.g. `📁 SK Kepegawaian [15 Dokumen]`, `📁 Kenaikan Pangkat [8 Dokumen]`, `📁 Cuti Pegawai [20 Dokumen]`).
  - Clicking a folder card drills down into that category and immediately filters the document table below.
- **Search & Quick Tabs**:
  - Filter chips / tabs: `[Semua Folder]` `[SK Kepegawaian]` `[Kenaikan Pangkat]` `[Cuti Pegawai]` `[+ Custom]`.
  - Button `← Kembali ke Semua Folder`.
- **Document Table**: Name, Category Badge, Uploader, Date, File Size, Actions (`👁️`, `⬇️`, `✏️`, `🗑️`).
- **Modals**: 
  - Upload/Edit Document modal (with category/folder selector).
  - Add/Rename Custom Folder modal.
  - Confirm Delete modal.

### Screen 10: Arsip Laporan Bulanan Matrix (`/laporan`)
- Year selector dropdown.
- Button `+ Upload` (Free upload modal).
- 12-Month Matrix Table:
  - Rows: Jenis Laporan (L1 s.d. L14).
  - Columns: Jan - Des.
  - Interactive cells:
    - Green `✓` button: Click opens Action Modal (`👁️ Lihat`, `⬇️ Unduh`, `✏️ Edit`, `🗑️ Hapus`).
    - Gray `·` button: Click directly opens Upload Modal for that month & report.

### Screen 11: Capaian Kinerja Tahunan (`/kinerja`) [Admin]
- Year selector dropdown.
- Button `⬇️ Export Excel` (A4 Landscape formatted spreadsheet).
- Sasaran Cards:
  - Table: Indikator, Target, Realisasi %, Capaian % (Colored: green if >= 100%, amber if < 100%).
  - Button `✏️ Isi Nilai` (Tipe 1: single value modal).
  - Button `📅 Isi Bulanan` (Tipe 2: 12-month dual-value modal).

### Screen 12: Log Aktivitas (`/log-aktivitas`) [Admin, Petugas]
- Full audit log table: Timestamp, User, Action Emoji Badge (`📤 Upload`, `🗑️ Hapus`, `✏️ Edit`, `📥 Kembali`, etc.), Description.
- Pagination controls.

### Screen 13: Pengaturan - Data Master (`/pengaturan?tab=master`) [Admin]
- Tabs: Jenis Perkara, Jenis Kesekretariatan, Jenis Laporan, Divisi.
- Drag & Drop reorder handles (`⠿`).
- Inline Add Form + Button `+ Tambah`.
- Inline Rename Button.
- Delete Button with Dependency Protection modal (Select replacement category before deleting).

### Screen 14: Pengaturan - Kelola Kinerja (`/pengaturan?tab=kinerja`) [Admin]
- Report Signer form (Official Name, NIP, button `Simpan Penandatangan`).
- Annual Target auto-save inputs per indicator.
- Add New Sasaran form.
- Sasaran & Indicator tree with Up `↑`, Down `↓`, Activate/Deactivate toggles, Edit, Delete, and `+ Indikator`.
- Modal Add/Edit Indicator (Type 1 vs Type 2 selector, custom input labels).

### Screen 15: Pengaturan - Verifikasi Akun (`/pengaturan?tab=verifikasi`) [Admin]
- Table of pending registrations: Name, Username, Date, Role Select dropdown (`Petugas`, `Peninjau`, `Admin`).
- Buttons: `Verifikasi` (Primary) & `Tolak` (Danger).

### Screen 16: Pengaturan - Kelola Pengguna (`/pengaturan?tab=pengguna`) [Admin]
- Button `+ Tambah Akun`.
- Form Tambah/Edit User (Full Name, Username, Password, Role).
- Active Users Table with Role Badges, Edit button, Delete button (with confirmation & last admin protection).

### Screen 17: Pengaturan - Profil Saya (`/pengaturan?tab=profil`)
- Form Update Profile: Full Name, Username, New Password.
- Avatar Picker:
  - Tab Icon: 24 icon choices + 12 color swatches + Button `🎲 Acak Avatar` + Button `Simpan Avatar`.
  - Tab Upload Photo: Image file picker with auto-compression.

### Screen 18: Bantuan & Panduan (`/bantuan`) [Admin]
- Table of contents anchor grid.
- Comprehensive user guide sections with step lists, notes, and callouts.
- Floating back-to-top button `↑`.
