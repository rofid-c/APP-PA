import { NextResponse } from 'next/server';
const { db } = require('../../../../../../lib/db');
const { getSession } = require('../../../../../../lib/session');

function parseValidId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// DELETE /api/rapat/:id/presensi/:presensiId
export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role === 'staf_umum') {
    return NextResponse.json({ error: 'Role Anda tidak memiliki izin menghapus presensi.' }, { status: 403 });
  }

  const rapatId = parseValidId(params.id);
  const presensiId = parseValidId(params.presensiId);
  if (!rapatId || !presensiId) {
    return NextResponse.json({ error: 'Parameter tidak valid.' }, { status: 400 });
  }

  const existing = db
    .prepare('SELECT id, nama FROM PresensiRapat WHERE id = ? AND rapatId = ?')
    .get(presensiId, rapatId);

  if (!existing) {
    return NextResponse.json({ error: 'Data kehadiran tidak ditemukan.' }, { status: 404 });
  }

  db.prepare('DELETE FROM PresensiRapat WHERE id = ?').run(presensiId);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'hapus_presensi',
    `${session.namaLengkap} menghapus data presensi peserta "${existing.nama}" dari rapat #${rapatId}`,
    session.id
  );

  return NextResponse.json({ ok: true });
}

