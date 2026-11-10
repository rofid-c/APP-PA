import { NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import path from 'path';
const { db, UPLOAD_DIR } = require('../../../../../lib/db');
const { getSession } = require('../../../../../lib/session');

function parseValidId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/rapat/:id/undangan?mode=view|download
export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID rapat tidak valid.' }, { status: 400 });

  const rapat = db.prepare('SELECT id, judul, fileUndanganPath, fileUndanganName FROM Rapat WHERE id = ?').get(id);
  if (!rapat || !rapat.fileUndanganPath) {
    return NextResponse.json({ error: 'Berkas undangan PDF belum diunggah.' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') === 'view' ? 'view' : 'download';

  const absPath = path.join(UPLOAD_DIR, rapat.fileUndanganPath);
  try {
    const bytes = await readFile(absPath);

    db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
      mode === 'view' ? 'lihat' : 'download',
      `${session.namaLengkap} ${mode === 'view' ? 'melihat' : 'mengunduh'} berkas undangan rapat "${rapat.judul}"`,
      session.id
    );

    const disposition = mode === 'view' ? 'inline' : 'attachment';
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${rapat.fileUndanganName || 'undangan-rapat.pdf'}"`,
      },
    });
  } catch (err) {
    console.error('Error reading file undangan:', err);
    return NextResponse.json({ error: 'Berkas tidak ditemukan di penyimpanan server.' }, { status: 404 });
  }
}

// DELETE /api/rapat/:id/undangan (hapus berkas undangan PDF)
export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role === 'staf_umum') {
    return NextResponse.json({ error: 'Role Anda tidak memiliki izin menghapus berkas.' }, { status: 403 });
  }

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID rapat tidak valid.' }, { status: 400 });

  const rapat = db.prepare('SELECT id, judul, fileUndanganPath FROM Rapat WHERE id = ?').get(id);
  if (!rapat) return NextResponse.json({ error: 'Data rapat tidak ditemukan.' }, { status: 404 });

  if (rapat.fileUndanganPath) {
    const absPath = path.join(UPLOAD_DIR, rapat.fileUndanganPath);
    try {
      await unlink(absPath);
    } catch (e) {
      console.warn('Gagal menghapus file fisik undangan:', e.message);
    }
  }

  db.prepare(
    `UPDATE Rapat SET
      fileUndanganPath = NULL,
      fileUndanganName = NULL,
      fileUndanganSize = NULL
     WHERE id = ?`
  ).run(id);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'hapus_undangan_rapat',
    `${session.namaLengkap} menghapus berkas undangan PDF untuk rapat "${rapat.judul}"`,
    session.id
  );

  return NextResponse.json({ ok: true });
}

