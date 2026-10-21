import { NextResponse } from 'next/server';
const { db } = require('../../../../../lib/db');
const { getSession } = require('../../../../../lib/session');

function requireAdmin(session) {
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (session.role !== 'admin') return { error: 'Hanya admin yang boleh mengelola Capaian Kinerja.', status: 403 };
  return null;
}

// PATCH /api/kinerja/indikator/:id
// body { nama, tipeInput, labelInput1, labelInput2 } untuk edit, ATAU { arah } untuk reorder
// (reorder hanya bertukar posisi dengan indikator lain DALAM sasaran yang sama)
export async function PATCH(request, { params }) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const id = Number(params.id);
  const current = db.prepare('SELECT * FROM IndikatorKinerja WHERE id = ?').get(id);
  if (!current) return NextResponse.json({ error: 'Indikator kinerja tidak ditemukan.' }, { status: 404 });

  const body = await request.json();

  if (body.arah) {
    const tetangga = db
      .prepare(
        body.arah === 'naik'
          ? 'SELECT * FROM IndikatorKinerja WHERE sasaranId = ? AND urutan < ? ORDER BY urutan DESC LIMIT 1'
          : 'SELECT * FROM IndikatorKinerja WHERE sasaranId = ? AND urutan > ? ORDER BY urutan ASC LIMIT 1'
      )
      .get(current.sasaranId, current.urutan);
    if (!tetangga) return NextResponse.json({ error: 'Sudah di posisi paling ujung.' }, { status: 400 });

    const swap = db.transaction(() => {
      db.prepare('UPDATE IndikatorKinerja SET urutan = ? WHERE id = ?').run(tetangga.urutan, current.id);
      db.prepare('UPDATE IndikatorKinerja SET urutan = ? WHERE id = ?').run(current.urutan, tetangga.id);
    });
    swap();
    return NextResponse.json({ ok: true });
  }

  if (body.aktif !== undefined) {
    db.prepare('UPDATE IndikatorKinerja SET aktif = ? WHERE id = ?').run(body.aktif ? 1 : 0, id);
    db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
      body.aktif ? 'aktifkan_indikator_kinerja' : 'nonaktifkan_indikator_kinerja',
      `${session.namaLengkap} ${body.aktif ? 'mengaktifkan' : 'menonaktifkan'} indikator kinerja "${current.nama}"`,
      session.id
    );
    return NextResponse.json({ ok: true });
  }

  const { nama, tipeInput, labelInput1, labelInput2 } = body;
  if (!nama || !nama.trim()) return NextResponse.json({ error: 'Nama indikator kinerja wajib diisi.' }, { status: 400 });
  if (![1, 2].includes(Number(tipeInput))) {
    return NextResponse.json({ error: 'Tipe input harus 1 atau 2.' }, { status: 400 });
  }
  if (!labelInput1 || !labelInput1.trim()) {
    return NextResponse.json({ error: 'Label input pertama wajib diisi.' }, { status: 400 });
  }
  if (Number(tipeInput) === 2 && (!labelInput2 || !labelInput2.trim())) {
    return NextResponse.json({ error: 'Label input kedua (pembanding) wajib diisi untuk tipe 2 input.' }, { status: 400 });
  }

  db.prepare(
    'UPDATE IndikatorKinerja SET nama = ?, tipeInput = ?, labelInput1 = ?, labelInput2 = ? WHERE id = ?'
  ).run(nama.trim(), Number(tipeInput), labelInput1.trim(), Number(tipeInput) === 2 ? labelInput2.trim() : null, id);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'ubah_indikator_kinerja',
    `${session.namaLengkap} mengubah indikator kinerja "${current.nama}"`,
    session.id
  );

  return NextResponse.json({ ok: true });
}

// DELETE /api/kinerja/indikator/:id
export async function DELETE(request, { params }) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const id = Number(params.id);
  const current = db.prepare('SELECT * FROM IndikatorKinerja WHERE id = ?').get(id);
  if (!current) return NextResponse.json({ error: 'Indikator kinerja tidak ditemukan.' }, { status: 404 });

  const del = db.transaction(() => {
    db.prepare('DELETE FROM CapaianKinerja WHERE indikatorId = ?').run(id);
    db.prepare('DELETE FROM TargetKinerja WHERE indikatorId = ?').run(id);
    db.prepare('DELETE FROM IndikatorKinerja WHERE id = ?').run(id);
  });
  del();

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'hapus_indikator_kinerja',
    `${session.namaLengkap} menghapus indikator kinerja "${current.nama}"`,
    session.id
  );

  return NextResponse.json({ ok: true });
}
