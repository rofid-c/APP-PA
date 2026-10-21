import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
const { db, UPLOAD_DIR } = require('../../../../../lib/db');
const { getSession } = require('../../../../../lib/session');
const { uploadToGoogleDrive } = require('../../../../../lib/gdrive');

// POST /api/kesekretariatan/:id/sync-gdrive - Upload dokumen spesifik ke Google Drive
export async function POST(request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  }

  const arsip = db.prepare('SELECT * FROM ArsipKesekretariatan WHERE id = ?').get(id);
  if (!arsip) {
    return NextResponse.json({ error: 'Dokumen tidak ditemukan.' }, { status: 404 });
  }

  const absPath = path.join(UPLOAD_DIR, arsip.filePath);
  let bytes;
  try {
    bytes = await readFile(absPath);
  } catch (e) {
    return NextResponse.json({ error: 'File fisik dokumen tidak ditemukan di server.' }, { status: 404 });
  }

  const divisi = db.prepare('SELECT nama FROM Divisi WHERE id = ?').get(arsip.divisiId);
  const fileName = `${arsip.namaDokumen}${divisi ? ' - ' + divisi.nama : ''}.pdf`;

  const result = await uploadToGoogleDrive({
    fileName,
    buffer: bytes,
  });

  if (!result || !result.fileId) {
    return NextResponse.json({
      error: 'Gagal mengunggah ke Google Drive. Layanan Google Drive bot mungkin terkendala kuota pada akun pribadi.',
      needManualUpload: true,
      folderUrl: `https://drive.google.com/drive/folders/1TQ4uJrd64oMTTbncXQUWfC4LQgSCaRui`,
      downloadUrl: `/api/kesekretariatan/${id}?mode=download`,
    }, { status: 400 });
  }

  db.prepare('UPDATE ArsipKesekretariatan SET gdriveFileId = ?, gdriveWebViewLink = ? WHERE id = ?')
    .run(result.fileId, result.webViewLink, id);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'sync_gdrive',
    `${session.namaLengkap} mengunggah arsip kesekretariatan "${arsip.namaDokumen}" ke Google Drive`,
    session.id
  );

  return NextResponse.json({
    ok: true,
    fileId: result.fileId,
    gdriveWebViewLink: result.webViewLink,
    message: 'Dokumen berhasil diunggah ke Google Drive!',
  });
}
