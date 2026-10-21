import { NextResponse } from 'next/server';
const { db } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');

function requireAdmin(session) {
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (session.role !== 'admin') return { error: 'Hanya admin yang boleh mengelola Capaian Kinerja.', status: 403 };
  return null;
}

// GET /api/kinerja/sasaran - daftar sasaran kinerja + jumlah indikator di bawahnya
export async function GET() {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const data = db
    .prepare(
      `SELECT SasaranKinerja.*, (
         SELECT COUNT(*) FROM IndikatorKinerja WHERE IndikatorKinerja.sasaranId = SasaranKinerja.id
       ) as jumlahIndikator
       FROM SasaranKinerja ORDER BY urutan ASC`
    )
    .all();

  return NextResponse.json({ data });
}

// POST /api/kinerja/sasaran - tambah sasaran kinerja baru
export async function POST(request) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const { nama } = await request.json();
  if (!nama || !nama.trim()) {
    return NextResponse.json({ error: 'Nama sasaran kinerja wajib diisi.' }, { status: 400 });
  }

  const maxUrutan = db.prepare('SELECT COALESCE(MAX(urutan), -1) as m FROM SasaranKinerja').get().m;
  const info = db
    .prepare('INSERT INTO SasaranKinerja (nama, urutan) VALUES (?, ?)')
    .run(nama.trim(), maxUrutan + 1);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'tambah_sasaran_kinerja',
    `${session.namaLengkap} menambahkan sasaran kinerja "${nama.trim()}"`,
    session.id
  );

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
