import { NextResponse } from 'next/server';
const { db } = require('../../../lib/db');
const { getSession } = require('../../../lib/session');
const { slugify } = require('../../../lib/slugify');

function requireAdmin(session) {
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (session.role !== 'admin') return { error: 'Hanya admin yang boleh mengelola divisi.', status: 403 };
  return null;
}

// GET /api/divisi - daftar divisi (semua role login boleh baca, untuk sidebar & filter)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = db
    .prepare(
      `SELECT Divisi.*, (
         SELECT COUNT(*) FROM ArsipKesekretariatan WHERE ArsipKesekretariatan.divisiId = Divisi.id
       ) as jumlahArsip
       FROM Divisi ORDER BY urutan ASC`
    )
    .all();

  return NextResponse.json({ data });
}

// POST /api/divisi - tambah divisi baru (admin only)
export async function POST(request) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const { nama } = await request.json();
  if (!nama || !nama.trim()) {
    return NextResponse.json({ error: 'Nama divisi wajib diisi.' }, { status: 400 });
  }

  const namaTrim = nama.trim();
  const existing = db.prepare('SELECT id FROM Divisi WHERE nama = ?').get(namaTrim);
  if (existing) {
    return NextResponse.json({ error: 'Divisi ini sudah ada.' }, { status: 400 });
  }

  let slug = slugify(namaTrim);
  // Kalau slug sudah dipakai (mis. nama beda tapi slug-nya kebetulan sama), tambahkan angka
  let slugFinal = slug;
  let counter = 2;
  while (db.prepare('SELECT id FROM Divisi WHERE slug = ?').get(slugFinal)) {
    slugFinal = `${slug}-${counter}`;
    counter++;
  }

  const maxUrutan = db.prepare('SELECT COALESCE(MAX(urutan), -1) as m FROM Divisi').get().m;
  const info = db
    .prepare('INSERT INTO Divisi (nama, slug, urutan) VALUES (?, ?, ?)')
    .run(namaTrim, slugFinal, maxUrutan + 1);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'tambah_divisi',
    `${session.namaLengkap} menambahkan divisi "${namaTrim}"`,
    session.id
  );

  return NextResponse.json({ ok: true, id: info.lastInsertRowid, slug: slugFinal });
}
