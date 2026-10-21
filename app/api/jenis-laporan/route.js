import { NextResponse } from 'next/server';
const { db } = require('../../../lib/db');
const { getSession } = require('../../../lib/session');

function canManage(session) {
  if (!session) return false;
  return session.role !== 'staf_umum';
}

// GET /api/jenis-laporan
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = db
    .prepare(
      `SELECT JenisLaporan.*, (
         SELECT COUNT(*) FROM ArsipLaporan WHERE ArsipLaporan.jenisLaporanId = JenisLaporan.id
       ) as jumlahArsip
       FROM JenisLaporan ORDER BY urutan ASC`
    )
    .all();

  return NextResponse.json({ data });
}

// POST /api/jenis-laporan
export async function POST(request) {
  const session = await getSession();
  if (!canManage(session)) {
    return NextResponse.json({ error: 'Tidak punya akses untuk mengelola jenis laporan.' }, { status: 403 });
  }

  const { nama } = await request.json();
  if (!nama || !nama.trim()) {
    return NextResponse.json({ error: 'Nama jenis laporan wajib diisi.' }, { status: 400 });
  }

  const existing = db.prepare('SELECT id FROM JenisLaporan WHERE nama = ?').get(nama.trim());
  if (existing) {
    return NextResponse.json({ error: 'Jenis laporan ini sudah ada.' }, { status: 400 });
  }

  const maxUrutan = db.prepare('SELECT COALESCE(MAX(urutan), -1) as m FROM JenisLaporan').get().m;
  const info = db
    .prepare('INSERT INTO JenisLaporan (nama, urutan) VALUES (?, ?)')
    .run(nama.trim(), maxUrutan + 1);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'tambah_jenis_laporan',
    `${session.namaLengkap} menambahkan jenis laporan "${nama.trim()}"`,
    session.id
  );

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
