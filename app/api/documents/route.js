import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
const { db, UPLOAD_DIR } = require('../../../lib/db');
const { getSession } = require('../../../lib/session');
const { slugify } = require('../../../lib/slugify');
const { uploadToGoogleDrive } = require('../../../lib/gdrive');

// GET /api/documents?q=...&jenisId=...&tahun=...&status=ada|dipinjam&page=1
export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const jenisId = searchParams.get('jenisId') || '';
  const tahun = searchParams.get('tahun') || '';
  const status = searchParams.get('status') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = 20;

  let where = 'WHERE 1=1';
  const params = [];

  if (q) {
    where += ' AND (Arsip.nomorPerkara LIKE ? OR Arsip.namaPihak LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (jenisId) {
    where += ' AND Arsip.jenisPerkaraId = ?';
    params.push(parseInt(jenisId, 10));
  }
  if (tahun) {
    where += ' AND Arsip.tahun = ?';
    params.push(parseInt(tahun, 10));
  }
  // Status dihitung otomatis dari ada-tidaknya peminjaman aktif (tanggalKembali kosong)
  // -- BUKAN kolom tersendiri di Arsip -- supaya tidak ada 2 sumber kebenaran yang bisa tidak sinkron.
  if (status === 'dipinjam') {
    where += ` AND EXISTS (SELECT 1 FROM Peminjaman WHERE Peminjaman.arsipId = Arsip.id AND Peminjaman.tanggalKembali IS NULL)`;
  } else if (status === 'ada') {
    where += ` AND NOT EXISTS (SELECT 1 FROM Peminjaman WHERE Peminjaman.arsipId = Arsip.id AND Peminjaman.tanggalKembali IS NULL)`;
  }

  const total = db
    .prepare(`SELECT COUNT(*) as c FROM Arsip ${where}`)
    .get(...params).c;

  const rows = db
    .prepare(
      `SELECT Arsip.*, User.namaLengkap as uploaderNama, JenisPerkara.nama as jenisPerkaraNama, JenisPerkara.urutan as jenisPerkaraUrutan,
       (SELECT COUNT(*) FROM Peminjaman WHERE Peminjaman.arsipId = Arsip.id AND Peminjaman.tanggalKembali IS NULL) as sedangDipinjam,
       (SELECT peminjam FROM Peminjaman WHERE Peminjaman.arsipId = Arsip.id AND Peminjaman.tanggalKembali IS NULL LIMIT 1) as peminjamAktif
       FROM Arsip
       JOIN User ON Arsip.uploadedBy = User.id
       LEFT JOIN JenisPerkara ON Arsip.jenisPerkaraId = JenisPerkara.id
       ${where}
       ORDER BY Arsip.createdAt DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, (page - 1) * pageSize);

  const data = rows.map((r) => ({ ...r, status: r.sedangDipinjam > 0 ? 'dipinjam' : 'ada' }));

  return NextResponse.json({ data, total, page, pageSize });
}

// POST /api/documents  (multipart/form-data)
export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role === 'staf_umum') {
    return NextResponse.json({ error: 'Role Anda tidak punya akses untuk upload arsip.' }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const nomorPerkara = (form.get('nomorPerkara') || '').toString().trim();
  const jenisPerkaraId = parseInt((form.get('jenisPerkaraId') || '').toString(), 10);
  const namaPihak = (form.get('namaPihak') || '').toString().trim();
  const tanggalBht = (form.get('tanggalBht') || '').toString().trim();
  const keterangan = (form.get('keterangan') || '').toString().trim();
  const nomorRuang = (form.get('nomorRuang') || '').toString().trim();
  const nomorRakLemari = (form.get('nomorRakLemari') || '').toString().trim();
  const nomorTingkatLaci = (form.get('nomorTingkatLaci') || '').toString().trim();
  const nomorBoks = (form.get('nomorBoks') || '').toString().trim();

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'File wajib diunggah.' }, { status: 400 });
  }
  if (!nomorPerkara || !jenisPerkaraId || !tanggalBht) {
    return NextResponse.json({ error: 'Nomor perkara, jenis perkara, dan tanggal BHT wajib diisi.' }, { status: 400 });
  }
  if (!nomorRuang || !nomorRakLemari || !nomorTingkatLaci || !nomorBoks) {
    return NextResponse.json({ error: 'Lokasi fisik (ruang, rak/lemari, tingkat/laci, boks) wajib diisi.' }, { status: 400 });
  }
  const jenis = db.prepare('SELECT * FROM JenisPerkara WHERE id = ?').get(jenisPerkaraId);
  if (!jenis) {
    return NextResponse.json({ error: 'Jenis perkara tidak valid.' }, { status: 400 });
  }
  const nomorSudahAda = db.prepare('SELECT id FROM Arsip WHERE nomorPerkara = ?').get(nomorPerkara);
  if (nomorSudahAda) {
    return NextResponse.json({ error: 'Nomor perkara ini sudah ada di sistem.' }, { status: 400 });
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Hanya file PDF yang diperbolehkan.' }, { status: 400 });
  }
  const MAX_SIZE = 20 * 1024 * 1024; // 20MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Ukuran file maksimal 20MB.' }, { status: 400 });
  }

  const tanggal = new Date(tanggalBht);
  if (isNaN(tanggal.getTime())) {
    return NextResponse.json({ error: 'Tanggal BHT tidak valid.' }, { status: 400 });
  }
  const tahun = tanggal.getFullYear();

  const relDir = path.join(String(tahun), slugify(jenis.nama));
  const absDir = path.join(UPLOAD_DIR, relDir);
  await mkdir(absDir, { recursive: true });

  const uniqueName = `${slugify(nomorPerkara)}-${Date.now()}.pdf`;
  const relPath = path.join(relDir, uniqueName);
  const absPath = path.join(UPLOAD_DIR, relPath);

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, bytes);

  // Upload ke Google Drive secara aman (asynchronous & non-blocking jika belum dikonfigurasi)
  let gdriveResult = null;
  try {
    gdriveResult = await uploadToGoogleDrive({
      fileName: `${nomorPerkara} - ${jenis.nama}.pdf`,
      buffer: bytes,
    });
  } catch (err) {
    console.error('[GDrive] Documents upload fallback:', err?.message || err);
  }

  let info;
  try {
    info = db
      .prepare(
        `INSERT INTO Arsip (nomorPerkara, jenisPerkara, jenisPerkaraId, namaPihak, tanggalBht, tahun, fileName, filePath, fileSize, keterangan, nomorRuang, nomorRakLemari, nomorTingkatLaci, nomorBoks, uploadedBy, gdriveFileId, gdriveWebViewLink)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(nomorPerkara, jenis.nama, jenisPerkaraId, namaPihak || null, tanggalBht, tahun, file.name, relPath, bytes.length, keterangan || null, nomorRuang, nomorRakLemari, nomorTingkatLaci, nomorBoks, session.id, gdriveResult?.fileId || null, gdriveResult?.webViewLink || null);
  } catch (e) {
    // Jaring pengaman kedua (UNIQUE index) menolak — kemungkinan race condition upload bersamaan
    if (e.message && e.message.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Nomor perkara ini sudah ada di sistem.' }, { status: 400 });
    }
    throw e;
  }

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'upload',
    `${session.namaLengkap} mengunggah arsip ${nomorPerkara}`,
    session.id
  );

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
