import { NextResponse } from 'next/server';
const { db } = require('../../../lib/db');
const { getSession } = require('../../../lib/session');

function canManage(session) {
  // Semua role boleh akses KECUALI staf_umum
  if (!session) return false;
  return session.role !== 'staf_umum';
}

// GET /api/jenis-perkara - daftar jenis perkara + jumlah arsip yang memakainya
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = db
    .prepare(
      `SELECT JenisPerkara.*, (
         SELECT COUNT(*) FROM Arsip WHERE Arsip.jenisPerkaraId = JenisPerkara.id
       ) as jumlahArsip
       FROM JenisPerkara ORDER BY urutan ASC`
    )
    .all();

  return NextResponse.json({ data });
}

// POST /api/jenis-perkara - tambah jenis perkara baru
export async function POST(request) {
  const session = await getSession();
  if (!canManage(session)) {
    return NextResponse.json({ error: 'Tidak punya akses untuk mengelola jenis perkara.' }, { status: 403 });
  }

  const { nama } = await request.json();
  if (!nama || !nama.trim()) {
    return NextResponse.json({ error: 'Nama jenis perkara wajib diisi.' }, { status: 400 });
  }

  const existing = db.prepare('SELECT id FROM JenisPerkara WHERE nama = ?').get(nama.trim());
  if (existing) {
    return NextResponse.json({ error: 'Jenis perkara ini sudah ada.' }, { status: 400 });
  }

  const maxUrutan = db.prepare('SELECT COALESCE(MAX(urutan), -1) as m FROM JenisPerkara').get().m;
  const info = db
    .prepare('INSERT INTO JenisPerkara (nama, urutan) VALUES (?, ?)')
    .run(nama.trim(), maxUrutan + 1);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'tambah_jenis_perkara',
    `${session.namaLengkap} menambahkan jenis perkara "${nama.trim()}"`,
    session.id
  );

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
