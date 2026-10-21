import { NextResponse } from 'next/server';
const { db } = require('../../../lib/db');
const { getSession } = require('../../../lib/session');

function canManage(session) {
  if (!session) return false;
  return session.role !== 'staf_umum';
}

// GET /api/jenis-kesekretariatan?divisiId=X
export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const divisiId = searchParams.get('divisiId') ? parseInt(searchParams.get('divisiId'), 10) : null;

  let query = `
    SELECT JenisArsipKesekretariatan.*, (
      SELECT COUNT(*) FROM ArsipKesekretariatan WHERE ArsipKesekretariatan.jenisArsipId = JenisArsipKesekretariatan.id
    ) as jumlahArsip
    FROM JenisArsipKesekretariatan
  `;
  const params = [];
  if (divisiId) {
    query += ` WHERE divisiId = ? OR divisiId IS NULL `;
    params.push(divisiId);
  }
  query += ` ORDER BY urutan ASC, id ASC`;

  const data = db.prepare(query).all(...params);
  return NextResponse.json({ data });
}

// POST /api/jenis-kesekretariatan
export async function POST(request) {
  const session = await getSession();
  if (!canManage(session)) {
    return NextResponse.json({ error: 'Tidak punya akses untuk mengelola folder / jenis arsip.' }, { status: 403 });
  }

  const { nama, divisiId } = await request.json();
  if (!nama || !nama.trim()) {
    return NextResponse.json({ error: 'Nama folder / jenis arsip wajib diisi.' }, { status: 400 });
  }

  const dId = divisiId ? parseInt(divisiId, 10) : null;
  const existing = dId
    ? db.prepare('SELECT id FROM JenisArsipKesekretariatan WHERE LOWER(nama) = LOWER(?) AND divisiId = ?').get(nama.trim(), dId)
    : db.prepare('SELECT id FROM JenisArsipKesekretariatan WHERE LOWER(nama) = LOWER(?) AND divisiId IS NULL').get(nama.trim());

  if (existing) {
    return NextResponse.json({ error: 'Folder / jenis arsip ini sudah ada di divisi ini.' }, { status: 400 });
  }

  const maxUrutan = db.prepare('SELECT COALESCE(MAX(urutan), -1) as m FROM JenisArsipKesekretariatan WHERE divisiId = ? OR (divisiId IS NULL AND ? IS NULL)').get(dId, dId).m;
  const info = db
    .prepare('INSERT INTO JenisArsipKesekretariatan (nama, divisiId, urutan) VALUES (?, ?, ?)')
    .run(nama.trim(), dId, maxUrutan + 1);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'tambah_jenis_kesekretariatan',
    `${session.namaLengkap} menambahkan folder / jenis arsip kesekretariatan "${nama.trim()}"`,
    session.id
  );

  return NextResponse.json({ ok: true, id: info.lastInsertRowid, data: { id: info.lastInsertRowid, nama: nama.trim(), divisiId: dId, urutan: maxUrutan + 1, jumlahArsip: 0 } });
}
