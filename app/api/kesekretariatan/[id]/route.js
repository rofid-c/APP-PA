import { NextResponse } from 'next/server';
import { readFile, unlink, writeFile, mkdir } from 'fs/promises';
import path from 'path';
const { db, UPLOAD_DIR } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');
const { slugify } = require('../../../../lib/slugify');
const { uploadToGoogleDrive, deleteFromGoogleDrive } = require('../../../../lib/gdrive');

function canModify(session) {
  if (!session) return false;
  return session.role !== 'staf_umum';
}

function parseValidId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/kesekretariatan/:id?mode=view|download|meta
export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const modeParam = searchParams.get('mode');
  const mode = modeParam === 'view' ? 'view' : modeParam === 'meta' ? 'meta' : 'download';

  const arsip = db
    .prepare(
      `SELECT ArsipKesekretariatan.*, JenisArsipKesekretariatan.nama as jenisArsipNama, Divisi.nama as divisiNama
       FROM ArsipKesekretariatan
       LEFT JOIN JenisArsipKesekretariatan ON ArsipKesekretariatan.jenisArsipId = JenisArsipKesekretariatan.id
       LEFT JOIN Divisi ON ArsipKesekretariatan.divisiId = Divisi.id
       WHERE ArsipKesekretariatan.id = ?`
    )
    .get(id);
  if (!arsip) return NextResponse.json({ error: 'Arsip tidak ditemukan.' }, { status: 404 });

  if (mode === 'meta') {
    return NextResponse.json({ data: arsip });
  }

  const absPath = path.join(UPLOAD_DIR, arsip.filePath);
  try {
    const bytes = await readFile(absPath);
    db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
      mode === 'view' ? 'lihat' : 'download',
      `${session.namaLengkap} ${mode === 'view' ? 'melihat' : 'mengunduh'} arsip kesekretariatan "${arsip.namaDokumen}"`,
      session.id
    );
    const disposition = mode === 'view' ? 'inline' : 'attachment';
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${arsip.fileName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'File fisik tidak ditemukan di server.' }, { status: 404 });
  }
}

// PATCH /api/kesekretariatan/:id (multipart/form-data, file opsional untuk reupload)
export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!canModify(session)) {
    return NextResponse.json({ error: 'Role Anda tidak punya akses untuk mengubah arsip.' }, { status: 403 });
  }

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 });

  const arsip = db.prepare('SELECT * FROM ArsipKesekretariatan WHERE id = ?').get(id);
  if (!arsip) return NextResponse.json({ error: 'Arsip tidak ditemukan.' }, { status: 404 });

  const form = await request.formData();
  const namaDokumen = (form.get('namaDokumen') || '').toString().trim();
  const jenisArsipId = parseInt((form.get('jenisArsipId') || '').toString(), 10);
  const divisiId = parseInt((form.get('divisiId') || '').toString(), 10);
  const file = form.get('file');

  if (!namaDokumen || !jenisArsipId || !divisiId) {
    return NextResponse.json({ error: 'Nama dokumen, jenis arsip, dan divisi wajib diisi.' }, { status: 400 });
  }
  const jenis = db.prepare('SELECT * FROM JenisArsipKesekretariatan WHERE id = ?').get(jenisArsipId);
  if (!jenis) return NextResponse.json({ error: 'Jenis arsip tidak valid.' }, { status: 400 });
  const divisi = db.prepare('SELECT * FROM Divisi WHERE id = ?').get(divisiId);
  if (!divisi) return NextResponse.json({ error: 'Divisi tidak valid.' }, { status: 400 });

  let fileName = arsip.fileName;
  let filePath = arsip.filePath;
  let fileSize = arsip.fileSize;
  let gdriveFileId = arsip.gdriveFileId || null;
  let gdriveWebViewLink = arsip.gdriveWebViewLink || null;
  let fileDiganti = false;

  const adaFileBaru = file && typeof file !== 'string' && file.size > 0;

  if (adaFileBaru) {
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
    const newRelPath = path.join(relDir, uniqueName);
    const newAbsPath = path.join(UPLOAD_DIR, newRelPath);

    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(newAbsPath, bytes);

    const oldAbsPath = path.join(UPLOAD_DIR, arsip.filePath);
    try {
      await unlink(oldAbsPath);
    } catch {
      // file lama mungkin sudah tidak ada, abaikan
    }

    fileName = file.name;
    filePath = newRelPath;
    fileSize = bytes.length;
    fileDiganti = true;

    try {
      const gdriveResult = await uploadToGoogleDrive({
        fileName: `${namaDokumen} - ${divisi.nama}.pdf`,
        buffer: bytes,
      });
      if (gdriveResult) {
        if (arsip.gdriveFileId) {
          await deleteFromGoogleDrive(arsip.gdriveFileId);
        }
        gdriveFileId = gdriveResult.fileId;
        gdriveWebViewLink = gdriveResult.webViewLink;
      }
    } catch (err) {
      console.error('[GDrive] Update error:', err?.message || err);
    }
  }

  db.prepare(
    `UPDATE ArsipKesekretariatan SET namaDokumen = ?, jenisArsipId = ?, divisiId = ?, fileName = ?, filePath = ?, fileSize = ?, gdriveFileId = ?, gdriveWebViewLink = ? WHERE id = ?`
  ).run(namaDokumen, jenisArsipId, divisiId, fileName, filePath, fileSize, gdriveFileId, gdriveWebViewLink, id);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    fileDiganti ? 'ganti_file_kesekretariatan' : 'ubah_kesekretariatan',
    `${session.namaLengkap} mengubah arsip kesekretariatan "${namaDokumen}"`,
    session.id
  );

  return NextResponse.json({ ok: true });
}

// DELETE /api/kesekretariatan/:id
export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!canModify(session)) {
    return NextResponse.json({ error: 'Role Anda tidak punya akses untuk menghapus arsip.' }, { status: 403 });
  }

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 });

  const arsip = db.prepare('SELECT * FROM ArsipKesekretariatan WHERE id = ?').get(id);
  if (!arsip) return NextResponse.json({ error: 'Arsip tidak ditemukan.' }, { status: 404 });

  const absPath = path.join(UPLOAD_DIR, arsip.filePath);
  try {
    await unlink(absPath);
  } catch {
    // file fisik mungkin sudah tidak ada
  }

  if (arsip.gdriveFileId) {
    try {
      await deleteFromGoogleDrive(arsip.gdriveFileId);
    } catch (err) {
      console.error('[GDrive] Delete error:', err?.message || err);
    }
  }

  db.prepare('DELETE FROM ArsipKesekretariatan WHERE id = ?').run(id);
  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'hapus_kesekretariatan',
    `${session.namaLengkap} menghapus arsip kesekretariatan "${arsip.namaDokumen}"`,
    session.id
  );

  return NextResponse.json({ ok: true });
}
