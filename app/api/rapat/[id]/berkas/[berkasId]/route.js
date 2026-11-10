import { NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import path from 'path';
const { db, UPLOAD_DIR } = require('../../../../../../lib/db');
const { getSession } = require('../../../../../../lib/session');

function parseValidId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/rapat/:id/berkas/:berkasId?mode=view|download
export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseValidId(params.id);
  const berkasId = parseValidId(params.berkasId);
  if (!id || !berkasId) return NextResponse.json({ error: 'Parameter tidak valid.' }, { status: 400 });

  const berkas = db
    .prepare('SELECT * FROM BerkasRapat WHERE id = ? AND rapatId = ?')
    .get(berkasId, id);

  if (!berkas) {
    return NextResponse.json({ error: 'Berkas tidak ditemukan.' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') === 'download' ? 'download' : 'view';

  const absPath = path.join(UPLOAD_DIR, berkas.filePath);
  try {
    const bytes = await readFile(absPath);
    const disposition = mode === 'download' ? 'attachment' : 'inline';

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${berkas.fileName || 'dokumen.pdf'}"`,
      },
    });
  } catch (err) {
    console.error('Error reading berkas rapat:', err);
    return NextResponse.json({ error: 'Berkas tidak ditemukan di server.' }, { status: 404 });
  }
}

// DELETE /api/rapat/:id/berkas/:berkasId
export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role === 'staf_umum') {
    return NextResponse.json({ error: 'Role Anda tidak memiliki izin menghapus berkas.' }, { status: 403 });
  }

  const id = parseValidId(params.id);
  const berkasId = parseValidId(params.berkasId);
  if (!id || !berkasId) return NextResponse.json({ error: 'Parameter tidak valid.' }, { status: 400 });

  const berkas = db
    .prepare('SELECT * FROM BerkasRapat WHERE id = ? AND rapatId = ?')
    .get(berkasId, id);

  if (!berkas) {
    return NextResponse.json({ error: 'Berkas tidak ditemukan.' }, { status: 404 });
  }

  const absPath = path.join(UPLOAD_DIR, berkas.filePath);
  try {
    await unlink(absPath);
  } catch (e) {
    console.warn('Gagal menghapus file fisik berkas rapat:', e.message);
  }

  db.prepare('DELETE FROM BerkasRapat WHERE id = ?').run(berkasId);

  // Jika berkas ini terdaftar di kolom Rapat, sinkronkan ke berkas lain atau NULL
  if (berkas.kategori === 'undangan') {
    const sisa = db.prepare("SELECT filePath, fileName, fileSize FROM BerkasRapat WHERE rapatId = ? AND kategori = 'undangan' ORDER BY id DESC LIMIT 1").get(id);
    if (sisa) {
      db.prepare("UPDATE Rapat SET fileUndanganPath = ?, fileUndanganName = ?, fileUndanganSize = ? WHERE id = ?")
        .run(sisa.filePath, sisa.fileName, sisa.fileSize, id);
    } else {
      db.prepare("UPDATE Rapat SET fileUndanganPath = NULL, fileUndanganName = NULL, fileUndanganSize = NULL WHERE id = ?").run(id);
    }
  } else if (berkas.kategori === 'notulen') {
    const sisa = db.prepare("SELECT filePath, fileName, fileSize FROM BerkasRapat WHERE rapatId = ? AND kategori = 'notulen' ORDER BY id DESC LIMIT 1").get(id);
    if (sisa) {
      db.prepare("UPDATE Rapat SET fileRangkumanPath = ?, fileRangkumanName = ?, fileRangkumanSize = ? WHERE id = ?")
        .run(sisa.filePath, sisa.fileName, sisa.fileSize, id);
    } else {
      db.prepare("UPDATE Rapat SET fileRangkumanPath = NULL, fileRangkumanName = NULL, fileRangkumanSize = NULL WHERE id = ?").run(id);
    }
  }

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'hapus_berkas_rapat',
    `${session.namaLengkap} menghapus berkas ${berkas.kategori} "${berkas.fileName}"`,
    session.id
  );

  return NextResponse.json({ ok: true });
}

