import { NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import path from 'path';
const { db, UPLOAD_DIR } = require('../../../../../../lib/db');
const { getSession } = require('../../../../../../lib/session');

function parseValidId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'image/jpeg';
  }
}

// GET /api/rapat/:id/dokumentasi/:fotoId?mode=view|download
export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseValidId(params.id);
  const fotoId = parseValidId(params.fotoId);
  if (!id || !fotoId) return NextResponse.json({ error: 'Parameter tidak valid.' }, { status: 400 });

  const foto = db
    .prepare('SELECT * FROM DokumentasiRapat WHERE id = ? AND rapatId = ?')
    .get(fotoId, id);

  if (!foto) {
    return NextResponse.json({ error: 'Foto dokumentasi tidak ditemukan.' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') === 'download' ? 'download' : 'view';

  const absPath = path.join(UPLOAD_DIR, foto.filePath);
  try {
    const bytes = await readFile(absPath);
    const contentType = getContentType(foto.filePath);
    const disposition = mode === 'download' ? 'attachment' : 'inline';

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${foto.fileName || 'dokumentasi.jpg'}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('Error reading documentation photo:', err);
    return NextResponse.json({ error: 'Berkas foto tidak ditemukan di server.' }, { status: 404 });
  }
}

// DELETE /api/rapat/:id/dokumentasi/:fotoId
export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role === 'staf_umum') {
    return NextResponse.json({ error: 'Role Anda tidak memiliki izin menghapus foto.' }, { status: 403 });
  }

  const id = parseValidId(params.id);
  const fotoId = parseValidId(params.fotoId);
  if (!id || !fotoId) return NextResponse.json({ error: 'Parameter tidak valid.' }, { status: 400 });

  const foto = db
    .prepare('SELECT * FROM DokumentasiRapat WHERE id = ? AND rapatId = ?')
    .get(fotoId, id);

  if (!foto) {
    return NextResponse.json({ error: 'Foto dokumentasi tidak ditemukan.' }, { status: 404 });
  }

  const absPath = path.join(UPLOAD_DIR, foto.filePath);
  try {
    await unlink(absPath);
  } catch (e) {
    console.warn('Gagal menghapus file fisik foto dokumentasi:', e.message);
  }

  db.prepare('DELETE FROM DokumentasiRapat WHERE id = ?').run(fotoId);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'hapus_dokumentasi_rapat',
    `${session.namaLengkap} menghapus foto dokumentasi "${foto.fileName}"`,
    session.id
  );

  return NextResponse.json({ ok: true });
}

