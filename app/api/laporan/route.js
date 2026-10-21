import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
const { db, UPLOAD_DIR } = require('../../../lib/db');
const { getSession } = require('../../../lib/session');
const { slugify } = require('../../../lib/slugify');
const { uploadToGoogleDrive } = require('../../../lib/gdrive');

// GET /api/laporan?tahun=X&bulan=X&jenisId=X&page=1
export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tahun = searchParams.get('tahun') || '';
  const bulan = searchParams.get('bulan') || '';
  const jenisId = searchParams.get('jenisId') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = 20;

  let where = 'WHERE 1=1';
  const params = [];
  if (tahun) {
    where += ' AND ArsipLaporan.tahun = ?';
    params.push(parseInt(tahun, 10));
  }
  if (bulan) {
    where += ' AND ArsipLaporan.bulan = ?';
    params.push(parseInt(bulan, 10));
  }
  if (jenisId) {
    where += ' AND ArsipLaporan.jenisLaporanId = ?';
    params.push(parseInt(jenisId, 10));
  }

  const total = db.prepare(`SELECT COUNT(*) as c FROM ArsipLaporan ${where}`).get(...params).c;

  const data = db
    .prepare(
      `SELECT ArsipLaporan.*, User.namaLengkap as uploaderNama, JenisLaporan.nama as jenisLaporanNama
       FROM ArsipLaporan
       JOIN User ON ArsipLaporan.uploadedBy = User.id
       LEFT JOIN JenisLaporan ON ArsipLaporan.jenisLaporanId = JenisLaporan.id
       ${where}
       ORDER BY ArsipLaporan.tahun DESC, ArsipLaporan.bulan DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, (page - 1) * pageSize);

  return NextResponse.json({ data, total, page, pageSize });
}

// POST /api/laporan (multipart/form-data: file, namaDokumen, bulan, tahun, jenisLaporanId)
export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role === 'staf_umum') {
    return NextResponse.json({ error: 'Role Anda tidak punya akses untuk upload laporan.' }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const namaDokumen = (form.get('namaDokumen') || '').toString().trim();
  const bulan = parseInt((form.get('bulan') || '').toString(), 10);
  const tahun = parseInt((form.get('tahun') || '').toString(), 10);
  const jenisLaporanId = parseInt((form.get('jenisLaporanId') || '').toString(), 10);

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'File wajib diunggah.' }, { status: 400 });
  }
  if (!namaDokumen || !bulan || !tahun || !jenisLaporanId) {
    return NextResponse.json({ error: 'Nama dokumen, bulan, tahun, dan jenis laporan wajib diisi.' }, { status: 400 });
  }
  if (bulan < 1 || bulan > 12) {
    return NextResponse.json({ error: 'Bulan tidak valid.' }, { status: 400 });
  }
  const jenis = db.prepare('SELECT * FROM JenisLaporan WHERE id = ?').get(jenisLaporanId);
  if (!jenis) return NextResponse.json({ error: 'Jenis laporan tidak valid.' }, { status: 400 });

  const sudahAda = db
    .prepare('SELECT id FROM ArsipLaporan WHERE jenisLaporanId = ? AND bulan = ? AND tahun = ?')
    .get(jenisLaporanId, bulan, tahun);
  if (sudahAda) {
    return NextResponse.json({ error: `Laporan ${jenis.nama} untuk bulan/tahun ini sudah pernah diunggah.` }, { status: 400 });
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Hanya file PDF yang diperbolehkan.' }, { status: 400 });
  }
  const MAX_SIZE = 20 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Ukuran file maksimal 20MB.' }, { status: 400 });
  }

  const relDir = path.join('laporan', String(tahun));
  const absDir = path.join(UPLOAD_DIR, relDir);
  await mkdir(absDir, { recursive: true });

  const uniqueName = `${slugify(namaDokumen)}-${Date.now()}.pdf`;
  const relPath = path.join(relDir, uniqueName);
  const absPath = path.join(UPLOAD_DIR, relPath);

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, bytes);

  // Upload ke Google Drive secara aman (asynchronous & non-blocking jika belum dikonfigurasi)
  let gdriveResult = null;
  try {
    gdriveResult = await uploadToGoogleDrive({
      fileName: `${namaDokumen} (${jenis.nama} ${bulan}-${tahun}).pdf`,
      buffer: bytes,
    });
  } catch (err) {
    console.error('[GDrive] Laporan upload fallback:', err?.message || err);
  }

  let info;
  try {
    info = db
      .prepare(
        `INSERT INTO ArsipLaporan (namaDokumen, bulan, tahun, jenisLaporanId, fileName, filePath, fileSize, uploadedBy, gdriveFileId, gdriveWebViewLink)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(namaDokumen, bulan, tahun, jenisLaporanId, file.name, relPath, bytes.length, session.id, gdriveResult?.fileId || null, gdriveResult?.webViewLink || null);
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) {
      return NextResponse.json({ error: `Laporan ${jenis.nama} untuk bulan/tahun ini sudah pernah diunggah.` }, { status: 400 });
    }
    throw e;
  }

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'upload_laporan',
    `${session.namaLengkap} mengunggah laporan "${namaDokumen}" (${jenis.nama}, ${bulan}/${tahun})`,
    session.id
  );

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
