import { NextResponse } from 'next/server';
const { db } = require('../../../lib/db');
const { getSession } = require('../../../lib/session');

// GET /api/logs?page=1&search=...&kategori=... - semua log aktivitas (admin & petugas, staf_umum tidak boleh)
export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role === 'staf_umum') {
    return NextResponse.json({ error: 'Role Anda tidak punya akses ke log aktivitas.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const search = (searchParams.get('search') || '').trim();
  const kategori = (searchParams.get('kategori') || 'semua').trim().toLowerCase();
  const pageSize = 20;

  const EXCLUDED = "('login','ubah_akun','ubah_profil','verifikasi_akun','lihat','download')";

  const whereConditions = [`LogAktivitas.aksi NOT IN ${EXCLUDED}`];
  const params = [];

  if (search) {
    whereConditions.push(`(LogAktivitas.deskripsi LIKE ? OR User.namaLengkap LIKE ? OR User.username LIKE ?)`);
    const q = `%${search}%`;
    params.push(q, q, q);
  }

  if (kategori === 'upload') {
    whereConditions.push(`LogAktivitas.aksi LIKE 'upload%'`);
  } else if (kategori === 'hapus') {
    whereConditions.push(`LogAktivitas.aksi LIKE 'hapus%'`);
  } else if (kategori === 'ubah') {
    whereConditions.push(`(LogAktivitas.aksi LIKE 'ubah%' OR LogAktivitas.aksi LIKE 'ganti%' OR LogAktivitas.aksi LIKE 'isi_%')`);
  } else if (kategori === 'master') {
    whereConditions.push(`(LogAktivitas.aksi LIKE '%perkara' OR LogAktivitas.aksi LIKE '%kesekretariatan' OR LogAktivitas.aksi LIKE '%divisi' OR LogAktivitas.aksi LIKE '%laporan' OR LogAktivitas.aksi LIKE '%kinerja')`);
  } else if (kategori === 'akun') {
    whereConditions.push(`(LogAktivitas.aksi LIKE '%akun%' OR LogAktivitas.aksi LIKE '%pendaftaran%')`);
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

  const total = db.prepare(
    `SELECT COUNT(*) as c FROM LogAktivitas
     JOIN User ON LogAktivitas.userId = User.id
     ${whereClause}`
  ).get(...params).c;

  const rows = db.prepare(
    `SELECT LogAktivitas.*, 
            User.namaLengkap, 
            User.username, 
            User.role, 
            User.avatarType, 
            User.avatarIcon, 
            User.avatarColor, 
            User.avatarPhotoPath 
     FROM LogAktivitas
     JOIN User ON LogAktivitas.userId = User.id
     ${whereClause}
     ORDER BY LogAktivitas.createdAt DESC
     LIMIT ? OFFSET ?`
  ).all(...params, pageSize, (page - 1) * pageSize);

  // Statistik menyeluruh (tanpa filter) untuk KPI Header
  const statsTotal = db.prepare(`SELECT COUNT(*) as c FROM LogAktivitas WHERE aksi NOT IN ${EXCLUDED}`).get().c;
  const statsHariIni = db.prepare(
    `SELECT COUNT(*) as c FROM LogAktivitas 
     WHERE aksi NOT IN ${EXCLUDED} AND substr(createdAt, 1, 10) = substr(datetime('now'), 1, 10)`
  ).get().c;
  const statsUpload = db.prepare(
    `SELECT COUNT(*) as c FROM LogAktivitas 
     WHERE aksi NOT IN ${EXCLUDED} AND aksi LIKE 'upload%'`
  ).get().c;
  const statsHapus = db.prepare(
    `SELECT COUNT(*) as c FROM LogAktivitas 
     WHERE aksi NOT IN ${EXCLUDED} AND aksi LIKE 'hapus%'`
  ).get().c;

  return NextResponse.json({
    data: rows,
    total,
    page,
    pageSize,
    stats: {
      total: statsTotal,
      hariIni: statsHariIni,
      totalUpload: statsUpload,
      totalHapus: statsHapus,
    },
  });
}
