import { NextResponse } from 'next/server';
const { db } = require('../../../../../lib/db');
const { getSession } = require('../../../../../lib/session');

function requireAdmin(session) {
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (session.role !== 'admin') return { error: 'Hanya admin yang boleh mengelola Capaian Kinerja.', status: 403 };
  return null;
}

// PATCH /api/kinerja/sasaran/:id
// body { nama } untuk ganti nama, ATAU { arah: 'naik' | 'turun' } untuk pindah urutan
export async function PATCH(request, { params }) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const id = Number(params.id);
  const current = db.prepare('SELECT * FROM SasaranKinerja WHERE id = ?').get(id);
  if (!current) return NextResponse.json({ error: 'Sasaran kinerja tidak ditemukan.' }, { status: 404 });

  const body = await request.json();

  if (body.arah) {
    const arah = body.arah;
    const tetangga = db
      .prepare(
        arah === 'naik'
          ? 'SELECT * FROM SasaranKinerja WHERE urutan < ? ORDER BY urutan DESC LIMIT 1'
          : 'SELECT * FROM SasaranKinerja WHERE urutan > ? ORDER BY urutan ASC LIMIT 1'
      )
      .get(current.urutan);
    if (!tetangga) return NextResponse.json({ error: 'Sudah di posisi paling ujung.' }, { status: 400 });

    const swap = db.transaction(() => {
      db.prepare('UPDATE SasaranKinerja SET urutan = ? WHERE id = ?').run(tetangga.urutan, current.id);
      db.prepare('UPDATE SasaranKinerja SET urutan = ? WHERE id = ?').run(current.urutan, tetangga.id);
    });
    swap();
    return NextResponse.json({ ok: true });
  }

  if (body.aktif !== undefined) {
    db.prepare('UPDATE SasaranKinerja SET aktif = ? WHERE id = ?').run(body.aktif ? 1 : 0, id);
    db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
      body.aktif ? 'aktifkan_sasaran_kinerja' : 'nonaktifkan_sasaran_kinerja',
      `${session.namaLengkap} ${body.aktif ? 'mengaktifkan' : 'menonaktifkan'} sasaran kinerja "${current.nama}"`,
      session.id
    );
    return NextResponse.json({ ok: true });
  }

  if (body.nama !== undefined) {
    if (!body.nama.trim()) {
      return NextResponse.json({ error: 'Nama sasaran kinerja wajib diisi.' }, { status: 400 });
    }
    db.prepare('UPDATE SasaranKinerja SET nama = ? WHERE id = ?').run(body.nama.trim(), id);
    db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
      'ubah_sasaran_kinerja',
      `${session.namaLengkap} mengubah sasaran kinerja "${current.nama}" menjadi "${body.nama.trim()}"`,
      session.id
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Tidak ada perubahan yang dikirim.' }, { status: 400 });
}

// DELETE /api/kinerja/sasaran/:id
export async function DELETE(request, { params }) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const id = Number(params.id);
  const current = db.prepare('SELECT * FROM SasaranKinerja WHERE id = ?').get(id);
  if (!current) return NextResponse.json({ error: 'Sasaran kinerja tidak ditemukan.' }, { status: 404 });

  const del = db.transaction(() => {
    const indikators = db.prepare('SELECT id FROM IndikatorKinerja WHERE sasaranId = ?').all(id);
    for (const ind of indikators) {
      db.prepare('DELETE FROM CapaianKinerja WHERE indikatorId = ?').run(ind.id);
      db.prepare('DELETE FROM TargetKinerja WHERE indikatorId = ?').run(ind.id);
    }
    db.prepare('DELETE FROM IndikatorKinerja WHERE sasaranId = ?').run(id);
    db.prepare('DELETE FROM SasaranKinerja WHERE id = ?').run(id);
  });
  del();
  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'hapus_sasaran_kinerja',
    `${session.namaLengkap} menghapus sasaran kinerja "${current.nama}"`,
    session.id
  );

  return NextResponse.json({ ok: true });
}
