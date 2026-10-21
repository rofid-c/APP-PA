// lib/db.js
// Lapisan database menggunakan better-sqlite3 (tanpa perlu binary engine eksternal).
// Semua query pakai prepared statements untuk mencegah SQL injection.

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'data', 'arsip.db');
const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS User (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  namaLengkap TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'petugas',
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Arsip (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nomorPerkara TEXT NOT NULL,
  jenisPerkara TEXT NOT NULL,
  namaPihak TEXT,
  tanggalBht TEXT NOT NULL,
  tahun INTEGER NOT NULL,
  fileName TEXT NOT NULL,
  filePath TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  keterangan TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  uploadedBy INTEGER NOT NULL,
  FOREIGN KEY (uploadedBy) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_arsip_nomor ON Arsip(nomorPerkara);
CREATE INDEX IF NOT EXISTS idx_arsip_jenis ON Arsip(jenisPerkara);
CREATE INDEX IF NOT EXISTS idx_arsip_tahun ON Arsip(tahun);

CREATE TABLE IF NOT EXISTS LogAktivitas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aksi TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  userId INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE TABLE IF NOT EXISTS JenisPerkara (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL UNIQUE,
  urutan INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Peminjaman (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  arsipId INTEGER NOT NULL,
  peminjam TEXT NOT NULL,
  tanggalPinjam TEXT NOT NULL,
  tanggalKembali TEXT,
  dicatatOleh INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (arsipId) REFERENCES Arsip(id),
  FOREIGN KEY (dicatatOleh) REFERENCES User(id)
);
CREATE INDEX IF NOT EXISTS idx_peminjaman_arsip ON Peminjaman(arsipId);

CREATE TABLE IF NOT EXISTS Divisi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  urutan INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS JenisArsipKesekretariatan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL UNIQUE,
  urutan INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ArsipKesekretariatan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  namaDokumen TEXT NOT NULL,
  jenisArsipId INTEGER NOT NULL,
  divisiId INTEGER NOT NULL,
  fileName TEXT NOT NULL,
  filePath TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  uploadedBy INTEGER NOT NULL,
  FOREIGN KEY (jenisArsipId) REFERENCES JenisArsipKesekretariatan(id),
  FOREIGN KEY (divisiId) REFERENCES Divisi(id),
  FOREIGN KEY (uploadedBy) REFERENCES User(id)
);
CREATE INDEX IF NOT EXISTS idx_kesek_divisi ON ArsipKesekretariatan(divisiId);
CREATE INDEX IF NOT EXISTS idx_kesek_jenis ON ArsipKesekretariatan(jenisArsipId);

CREATE TABLE IF NOT EXISTS JenisLaporan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL UNIQUE,
  urutan INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ArsipLaporan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  namaDokumen TEXT NOT NULL,
  bulan INTEGER NOT NULL,
  tahun INTEGER NOT NULL,
  jenisLaporanId INTEGER NOT NULL,
  fileName TEXT NOT NULL,
  filePath TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  uploadedBy INTEGER NOT NULL,
  FOREIGN KEY (jenisLaporanId) REFERENCES JenisLaporan(id),
  FOREIGN KEY (uploadedBy) REFERENCES User(id),
  UNIQUE (jenisLaporanId, bulan, tahun)
);
CREATE INDEX IF NOT EXISTS idx_laporan_tahun ON ArsipLaporan(tahun);
CREATE INDEX IF NOT EXISTS idx_laporan_bulan ON ArsipLaporan(bulan);
`);

// --- Migrasi skema untuk fitur baru (dijalankan aman berkali-kali) ---

// 1. Kolom status di User (untuk alur verifikasi akun pendaftaran mandiri)
const userCols = db.prepare('PRAGMA table_info(User)').all().map((c) => c.name);
if (!userCols.includes('status')) {
  db.exec("ALTER TABLE User ADD COLUMN status TEXT NOT NULL DEFAULT 'aktif'");
}

// 2. Kolom jenisPerkaraId di Arsip (menggantikan teks bebas jenisPerkara)
const arsipCols = db.prepare('PRAGMA table_info(Arsip)').all().map((c) => c.name);
if (!arsipCols.includes('jenisPerkaraId')) {
  db.exec('ALTER TABLE Arsip ADD COLUMN jenisPerkaraId INTEGER REFERENCES JenisPerkara(id)');
}

// 3. Seed jenis perkara default kalau tabel masih kosong
const jpCount = db.prepare('SELECT COUNT(*) as c FROM JenisPerkara').get().c;
if (jpCount === 0) {
  const defaults = ['Cerai Gugat', 'Cerai Talak', 'Dispensasi Kawin', 'Lainnya'];
  const insertJp = db.prepare('INSERT INTO JenisPerkara (nama, urutan) VALUES (?, ?)');
  defaults.forEach((nama, i) => insertJp.run(nama, i));
}

// 4. Migrasi data lama: arsip yang masih pakai teks jenisPerkara, cocokkan ke JenisPerkara.id
if (arsipCols.includes('jenisPerkara')) {
  const belumMigrasi = db
    .prepare('SELECT COUNT(*) as c FROM Arsip WHERE jenisPerkaraId IS NULL AND jenisPerkara IS NOT NULL')
    .get().c;
  if (belumMigrasi > 0) {
    const distinctLama = db
      .prepare('SELECT DISTINCT jenisPerkara FROM Arsip WHERE jenisPerkaraId IS NULL AND jenisPerkara IS NOT NULL')
      .all();
    const insertJikaBelum = db.prepare(`
      INSERT OR IGNORE INTO JenisPerkara (nama, urutan)
      VALUES (?, (SELECT COALESCE(MAX(urutan), -1) + 1 FROM JenisPerkara))
    `);
    distinctLama.forEach((r) => insertJikaBelum.run(r.jenisPerkara));
    db.exec(`
      UPDATE Arsip SET jenisPerkaraId = (
        SELECT id FROM JenisPerkara WHERE JenisPerkara.nama = Arsip.jenisPerkara
      )
      WHERE jenisPerkaraId IS NULL AND jenisPerkara IS NOT NULL
    `);
  }
}

// 5. Kolom avatar di User (avatarType: 'icon' | 'photo')
if (!userCols.includes('avatarType')) {
  db.exec("ALTER TABLE User ADD COLUMN avatarType TEXT NOT NULL DEFAULT 'icon'");
  db.exec("ALTER TABLE User ADD COLUMN avatarIcon TEXT");
  db.exec("ALTER TABLE User ADD COLUMN avatarColor TEXT");
  db.exec("ALTER TABLE User ADD COLUMN avatarPhotoPath TEXT");
}

// 6. Beri avatar default (icon+warna acak) ke user yang belum punya
const ICON_LIST = ['🌸','🌻','🌼','🌺','🌷','🍀','🌿','🪴','🌵','🍁','🍃','🍄','🌙','⭐','✨','❄️','🔥','💧','🎈','🍎','🍉','🌊','⛰️','🌾','🍂','🌱','🧊','🪨','🔶','🐢','🦋','🐝','🐬','🦊','🐨','🐼','🐙','🦉','🐌'];
const PASTEL_COLORS = ['#FFD6E8','#FFE8D6','#FFF6D6','#E8FFD6','#D6FFE8','#D6F6FF','#D6E8FF','#E8D6FF','#FFD6F6','#D6FFF0'];

const usersTanpaAvatar = db.prepare("SELECT id FROM User WHERE avatarIcon IS NULL AND avatarType = 'icon'").all();
if (usersTanpaAvatar.length > 0) {
  const updateAvatar = db.prepare('UPDATE User SET avatarIcon = ?, avatarColor = ? WHERE id = ?');
  usersTanpaAvatar.forEach((u) => {
    const icon = ICON_LIST[Math.floor(Math.random() * ICON_LIST.length)];
    const color = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
    updateAvatar.run(icon, color, u.id);
  });
}

// 7. Field lokasi fisik arsip perkara (Ruangan, Rak/Lemari, Tingkat/Laci, Boks)
if (!arsipCols.includes('nomorRuang')) {
  db.exec('ALTER TABLE Arsip ADD COLUMN nomorRuang TEXT');
  db.exec('ALTER TABLE Arsip ADD COLUMN nomorRakLemari TEXT');
  db.exec('ALTER TABLE Arsip ADD COLUMN nomorTingkatLaci TEXT');
  db.exec('ALTER TABLE Arsip ADD COLUMN nomorBoks TEXT');
}

// 8. Perbaikan index: index lama di kolom teks jenisPerkara sudah tidak dipakai untuk
// filter (diganti jenisPerkaraId), gantikan dengan index yang benar-benar dipakai.
db.exec('DROP INDEX IF EXISTS idx_arsip_jenis');
db.exec('CREATE INDEX IF NOT EXISTS idx_arsip_jenisid ON Arsip(jenisPerkaraId)');

// 9. UNIQUE constraint nomor perkara sebagai jaring pengaman kedua (selain cek di kode).
// Dibungkus try/catch: kalau kebetulan sudah ada data lama yang duplikat, migrasi tidak
// boleh sampai bikin aplikasi gagal total — cukup lewati dan biarkan tanpa constraint ini.
try {
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_arsip_nomor_unique ON Arsip(nomorPerkara)');
} catch (e) {
  console.warn('Gagal membuat UNIQUE index nomorPerkara (kemungkinan ada data duplikat lama):', e.message);
}

// 10. Seed Divisi default ("Umum") kalau tabel masih kosong
const divisiCount = db.prepare('SELECT COUNT(*) as c FROM Divisi').get().c;
if (divisiCount === 0) {
  db.prepare('INSERT INTO Divisi (nama, slug, urutan) VALUES (?, ?, ?)').run('Umum', 'umum', 0);
}

// 11. Seed Jenis Laporan default (L1PA1 s.d. L1PA14) kalau tabel masih kosong
const jenisLaporanCount = db.prepare('SELECT COUNT(*) as c FROM JenisLaporan').get().c;
if (jenisLaporanCount === 0) {
  const insertJl = db.prepare('INSERT INTO JenisLaporan (nama, urutan) VALUES (?, ?)');
  for (let i = 1; i <= 14; i++) {
    insertJl.run(`L1PA${i}`, i - 1);
  }
}

// 12. Skema fitur Catatan Kinerja Tahunan
db.exec(`
CREATE TABLE IF NOT EXISTS SasaranKinerja (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  urutan INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS IndikatorKinerja (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sasaranId INTEGER NOT NULL,
  nama TEXT NOT NULL,
  tipeInput INTEGER NOT NULL DEFAULT 2,
  labelInput1 TEXT NOT NULL,
  labelInput2 TEXT,
  urutan INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sasaranId) REFERENCES SasaranKinerja(id)
);
CREATE INDEX IF NOT EXISTS idx_indikator_sasaran ON IndikatorKinerja(sasaranId);

CREATE TABLE IF NOT EXISTS TargetKinerja (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  indikatorId INTEGER NOT NULL,
  tahun INTEGER NOT NULL,
  target REAL NOT NULL,
  FOREIGN KEY (indikatorId) REFERENCES IndikatorKinerja(id),
  UNIQUE (indikatorId, tahun)
);

CREATE TABLE IF NOT EXISTS CapaianKinerja (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  indikatorId INTEGER NOT NULL,
  tahun INTEGER NOT NULL,
  bulan INTEGER NOT NULL,
  nilai1 REAL,
  nilai2 REAL,
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedBy INTEGER,
  FOREIGN KEY (indikatorId) REFERENCES IndikatorKinerja(id),
  FOREIGN KEY (updatedBy) REFERENCES User(id),
  UNIQUE (indikatorId, tahun, bulan)
);

CREATE TABLE IF NOT EXISTS PengaturanKinerja (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  namaPenandatangan TEXT,
  nipPenandatangan TEXT
);
`);

const pengaturanKinerjaCount = db.prepare('SELECT COUNT(*) as c FROM PengaturanKinerja').get().c;
if (pengaturanKinerjaCount === 0) {
  db.prepare('INSERT INTO PengaturanKinerja (id, namaPenandatangan, nipPenandatangan) VALUES (1, NULL, NULL)').run();
}

// 13. Kolom aktif di SasaranKinerja & IndikatorKinerja -- supaya indikator yang sudah
// tidak dipakai lagi bisa "dinonaktifkan" (bukan dihapus). Yang aktif=0 otomatis tidak
// muncul lagi di tahun-tahun baru yang belum ada datanya, tapi tahun-tahun lama yang
// sudah ada datanya tetap tampil apa adanya.
const sasaranKinerjaCols = db.prepare('PRAGMA table_info(SasaranKinerja)').all().map((c) => c.name);
if (!sasaranKinerjaCols.includes('aktif')) {
  db.exec('ALTER TABLE SasaranKinerja ADD COLUMN aktif INTEGER NOT NULL DEFAULT 1');
}
const indikatorKinerjaCols = db.prepare('PRAGMA table_info(IndikatorKinerja)').all().map((c) => c.name);
if (!indikatorKinerjaCols.includes('aktif')) {
  db.exec('ALTER TABLE IndikatorKinerja ADD COLUMN aktif INTEGER NOT NULL DEFAULT 1');
}

// 14. Kolom divisiId di JenisArsipKesekretariatan untuk mendukung sub-kategori / folder custom per divisi
const jakCols = db.prepare('PRAGMA table_info(JenisArsipKesekretariatan)').all().map((c) => c.name);
if (!jakCols.includes('divisiId')) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS JenisArsipKesekretariatan_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      divisiId INTEGER REFERENCES Divisi(id) ON DELETE CASCADE,
      nama TEXT NOT NULL,
      urutan INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO JenisArsipKesekretariatan_new (id, nama, urutan, createdAt)
      SELECT id, nama, urutan, createdAt FROM JenisArsipKesekretariatan;
    DROP TABLE JenisArsipKesekretariatan;
    ALTER TABLE JenisArsipKesekretariatan_new RENAME TO JenisArsipKesekretariatan;
    CREATE INDEX IF NOT EXISTS idx_jenis_divisi ON JenisArsipKesekretariatan(divisiId);
  `);
}

// 15. Seed sub-kategori / folder default per divisi bila belum ada
const existingJakCount = db.prepare('SELECT COUNT(*) as c FROM JenisArsipKesekretariatan').get().c;
if (existingJakCount === 0) {
  const insertJak = db.prepare('INSERT INTO JenisArsipKesekretariatan (nama, divisiId, urutan) VALUES (?, ?, ?)');

  const divKepegawaian = db.prepare("SELECT id FROM Divisi WHERE slug = 'kepegawaian' OR LOWER(nama) LIKE '%pegawai%'").get();
  if (divKepegawaian) {
    const foldersKepeg = ['SK Kepegawaian', 'Kenaikan Pangkat (KP)', 'Kenaikan Gaji Berkala (KGB)', 'Cuti Pegawai', 'Disiplin & Surat Tugas'];
    foldersKepeg.forEach((f, idx) => insertJak.run(f, divKepegawaian.id, idx));
  }

  const divUmum = db.prepare("SELECT id FROM Divisi WHERE slug = 'umum' OR LOWER(nama) LIKE '%umum%'").get();
  if (divUmum) {
    const foldersUmum = ['Surat Masuk', 'Surat Keluar', 'Pengadaan & BMN', 'DIPA & Keuangan'];
    foldersUmum.forEach((f, idx) => insertJak.run(f, divUmum.id, idx));
  }

  const divPtip = db.prepare("SELECT id FROM Divisi WHERE slug = 'ptip' OR LOWER(nama) LIKE '%ptip%' OR LOWER(nama) LIKE '%perencanaan%'").get();
  if (divPtip) {
    const foldersPtip = ['Aplikasi & Website', 'Jaringan & Server', 'Laporan TI & Statistik'];
    foldersPtip.forEach((f, idx) => insertJak.run(f, divPtip.id, idx));
  }
}

// 16. Kolom Google Drive untuk sinkronisasi cloud
const arsipColsLatest = db.prepare('PRAGMA table_info(Arsip)').all().map((c) => c.name);
if (!arsipColsLatest.includes('gdriveFileId')) {
  db.exec('ALTER TABLE Arsip ADD COLUMN gdriveFileId TEXT');
  db.exec('ALTER TABLE Arsip ADD COLUMN gdriveWebViewLink TEXT');
}

const kesekCols = db.prepare('PRAGMA table_info(ArsipKesekretariatan)').all().map((c) => c.name);
if (!kesekCols.includes('gdriveFileId')) {
  db.exec('ALTER TABLE ArsipKesekretariatan ADD COLUMN gdriveFileId TEXT');
  db.exec('ALTER TABLE ArsipKesekretariatan ADD COLUMN gdriveWebViewLink TEXT');
}

const laporanCols = db.prepare('PRAGMA table_info(ArsipLaporan)').all().map((c) => c.name);
if (!laporanCols.includes('gdriveFileId')) {
  db.exec('ALTER TABLE ArsipLaporan ADD COLUMN gdriveFileId TEXT');
  db.exec('ALTER TABLE ArsipLaporan ADD COLUMN gdriveWebViewLink TEXT');
}

module.exports = { db, UPLOAD_DIR };
