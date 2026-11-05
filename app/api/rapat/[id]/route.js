import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
const { db, UPLOAD_DIR } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');
const { getExternalBaseUrl } = require('../../../../lib/network');

function parseValidId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/rapat/:id
export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID rapat tidak valid.' }, { status: 400 });

  const rapat = db
    .prepare(
      `SELECT Rapat.*, User.namaLengkap as pembuatNama
       FROM Rapat
       LEFT JOIN User ON Rapat.createdBy = User.id
       WHERE Rapat.id = ?`
    )
    .get(id);

  if (!rapat) {
    return NextResponse.json({ error: 'Data rapat tidak ditemukan.' }, { status: 404 });
  }

  const presensi = db
    .prepare(
      `SELECT * FROM PresensiRapat
       WHERE rapatId = ?
       ORDER BY waktuHadir ASC, id ASC`
    )
    .all(id);

  const baseUrl = getExternalBaseUrl(request);

  return NextResponse.json({
    data: {
      ...rapat,
      presensi,
      jumlahPresensi: presensi.length,
      presensiUrl: `${baseUrl}/presensi/${id}`,
      networkBaseUrl: baseUrl,
    },
  });
}

// PUT /api/rapat/:id
export async function PUT(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role === 'staf_umum') {
    return NextResponse.json({ error: 'Role Anda tidak memiliki izin mengedit rapat.' }, { status: 403 });
  }

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID rapat tidak valid.' }, { status: 400 });

  try {
    const body = await request.json();
    const {
      judul,
      tanggal,
      waktuMulai,
      waktuSelesai,
      tempat,
      pimpinanRapat,
      notulis,
      agenda,
      catatanHasil,
    } = body;

    const existing = db.prepare('SELECT id, judul FROM Rapat WHERE id = ?').get(id);
    if (!existing) return NextResponse.json({ error: 'Data rapat tidak ditemukan.' }, { status: 404 });

    db.prepare(
      `UPDATE Rapat SET
        judul = COALESCE(?, judul),
        tanggal = COALESCE(?, tanggal),
        waktuMulai = ?,
        waktuSelesai = ?,
        tempat = ?,
        pimpinanRapat = ?,
        notulis = ?,
        agenda = ?,
        catatanHasil = ?
       WHERE id = ?`
    ).run(
      judul !== undefined ? judul.trim() : null,
      tanggal !== undefined ? tanggal.trim() : null,
      waktuMulai !== undefined ? waktuMulai : null,
      waktuSelesai !== undefined ? waktuSelesai : null,
      tempat !== undefined ? tempat : null,
      pimpinanRapat !== undefined ? pimpinanRapat : null,
      notulis !== undefined ? notulis : null,
      agenda !== undefined ? agenda : null,
      catatanHasil !== undefined ? catatanHasil : null,
      id
    );

    db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
      'edit_rapat',
      `${session.namaLengkap} memperbarui data rapat "${judul || existing.judul}"`,
      session.id
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error updating rapat:', err);
    return NextResponse.json({ error: 'Gagal memperbarui rapat: ' + err.message }, { status: 500 });
  }
}

// DELETE /api/rapat/:id
export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role === 'staf_umum') {
    return NextResponse.json({ error: 'Role Anda tidak memiliki izin menghapus rapat.' }, { status: 403 });
  }

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID rapat tidak valid.' }, { status: 400 });

  const existing = db.prepare('SELECT * FROM Rapat WHERE id = ?').get(id);
  if (!existing) return NextResponse.json({ error: 'Data rapat tidak ditemukan.' }, { status: 404 });

  // Hapus berkas rangkuman fisik jika ada
  if (existing.fileRangkumanPath) {
    const absPath = path.join(UPLOAD_DIR, existing.fileRangkumanPath);
    try {
      await unlink(absPath);
    } catch (e) {
      console.warn('Gagal menghapus file fisik rangkuman rapat:', e.message);
    }
  }

  // Hapus data presensi dan data rapat
  db.prepare('DELETE FROM PresensiRapat WHERE rapatId = ?').run(id);
  db.prepare('DELETE FROM Rapat WHERE id = ?').run(id);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'hapus_rapat',
    `${session.namaLengkap} menghapus agenda rapat "${existing.judul}"`,
    session.id
  );

  return NextResponse.json({ ok: true });
}

