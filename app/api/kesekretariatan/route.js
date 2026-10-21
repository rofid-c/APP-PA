import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
const { db, UPLOAD_DIR } = require('../../../lib/db');
const { getSession } = require('../../../lib/session');
const { slugify } = require('../../../lib/slugify');
const { uploadToGoogleDrive } = require('../../../lib/gdrive');

// GET /api/kesekretariatan?divisiId=X&q=...&jenisId=...&page=1
export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const divisiId = searchParams.get('divisiId');
  const q = (searchParams.get('q') || '').trim();
  const jenisId = searchParams.get('jenisId') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = 20;

  if (!divisiId) {
    return NextResponse.json({ error: 'divisiId wajib disertakan.' }, { status: 400 });
  }

  let where = 'WHERE ArsipKesekretariatan.divisiId = ?';
  const params = [parseInt(divisiId, 10)];

  if (q) {
    where += ' AND ArsipKesekretariatan.namaDokumen LIKE ?';
    params.push(`%${q}%`);
  }
  if (jenisId) {
    where += ' AND ArsipKesekretariatan.jenisArsipId = ?';
    params.push(parseInt(jenisId, 10));
  }

  const total = db.prepare(`SELECT COUNT(*) as c FROM ArsipKesekretariatan ${where}`).get(...params).c;

  const data = db
    .prepare(
      `SELECT ArsipKesekretariatan.*, User.namaLengkap as uploaderNama,
       JenisArsipKesekretariatan.nama as jenisArsipNama, JenisArsipKesekretariatan.urutan as jenisArsipUrutan
       FROM ArsipKesekretariatan
       JOIN User ON ArsipKesekretariatan.uploadedBy = User.id
       LEFT JOIN JenisArsipKesekretariatan ON ArsipKesekretariatan.jenisArsipId = JenisArsipKesekretariatan.id
       ${where}
       ORDER BY ArsipKesekretariatan.createdAt DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, (page - 1) * pageSize);

  return NextResponse.json({ data, total, page, pageSize });
}

// POST /api/kesekretariatan (multipart/form-data: file, namaDokumen, jenisArsipId, divisiId)
export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role === 'staf_umum') {
    return NextResponse.json({ error: 'Role Anda tidak punya akses untuk upload arsip.' }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const namaDokumen = (form.get('namaDokumen') || '').toString().trim();
  const jenisArsipId = parseInt((form.get('jenisArsipId') || '').toString(), 10);
  const divisiId = parseInt((form.get('divisiId') || '').toString(), 10);

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'File wajib diunggah.' }, { status: 400 });
  }
  if (!namaDokumen || !jenisArsipId || !divisiId) {
    return NextResponse.json({ error: 'Nama dokumen, jenis arsip, dan divisi wajib diisi.' }, { status: 400 });
  }
  const jenis = db.prepare('SELECT * FROM JenisArsipKesekretariatan WHERE id = ?').get(jenisArsipId);
  if (!jenis) return NextResponse.json({ error: 'Jenis arsip tidak valid.' }, { status: 400 });
  const divisi = db.prepare('SELECT * FROM Divisi WHERE id = ?').get(divisiId);
  if (!divisi) return NextResponse.json({ error: 'Divisi tidak valid.' }, { status: 400 });
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Hanya file PDF yang diperbolehkan.' }, { status: 400 });
  }
  const MAX_SIZE = 20 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Ukuran file maksimal 20MB.' }, { status: 400 });
  }

  const relDir = path.join('kesekretariatan', divisi.slug);
  const absDir = path.join(UPLOAD_DIR, relDir);
  await mkdir(absDir, { recursive: true });

  const uniqueName = `${slugify(namaDokumen)}-${Date.now()}.pdf`;
  const relPath = path.join(relDir, uniqueName);
  const absPath = path.join(UPLOAD_DIR, relPath);

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, bytes);

  const info = db
    .prepare(
      `INSERT INTO ArsipKesekretariatan (namaDokumen, jenisArsipId, divisiId, fileName, filePath, fileSize, uploadedBy, gdriveFileId, gdriveWebViewLink)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)`
    )
    .run(namaDokumen, jenisArsipId, divisiId, file.name, relPath, bytes.length, session.id);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'upload_kesekretariatan',
    `${session.namaLengkap} mengunggah arsip kesekretariatan "${namaDokumen}" (${divisi.nama})`,
    session.id
  );

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
