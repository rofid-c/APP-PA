import { NextResponse } from 'next/server';
const { db } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');

function requireAdmin(session) {
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (session.role !== 'admin') return { error: 'Hanya admin yang boleh mengelola Capaian Kinerja.', status: 403 };
  return null;
}

// POST /api/kinerja/indikator
// body { sasaranId, nama, tipeInput (1|2), labelInput1, labelInput2 }
export async function POST(request) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const { sasaranId, nama, tipeInput, labelInput1, labelInput2 } = await request.json();

  if (!sasaranId) return NextResponse.json({ error: 'Sasaran kinerja induk wajib dipilih.' }, { status: 400 });
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

  const sasaran = db.prepare('SELECT * FROM SasaranKinerja WHERE id = ?').get(sasaranId);
  if (!sasaran) return NextResponse.json({ error: 'Sasaran kinerja tidak ditemukan.' }, { status: 404 });

  const maxUrutan = db
    .prepare('SELECT COALESCE(MAX(urutan), -1) as m FROM IndikatorKinerja WHERE sasaranId = ?')
    .get(sasaranId).m;

  const info = db
    .prepare(
      `INSERT INTO IndikatorKinerja (sasaranId, nama, tipeInput, labelInput1, labelInput2, urutan)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(sasaranId, nama.trim(), Number(tipeInput), labelInput1.trim(), Number(tipeInput) === 2 ? labelInput2.trim() : null, maxUrutan + 1);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'tambah_indikator_kinerja',
    `${session.namaLengkap} menambahkan indikator kinerja "${nama.trim()}" di sasaran "${sasaran.nama}"`,
    session.id
  );

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
