import { NextResponse } from 'next/server';
const { db } = require('../../../lib/db');
const { getSession } = require('../../../lib/session');

// GET /api/rapat?q=...&tahun=...&bulan=...&page=1
export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const tahun = searchParams.get('tahun') || '';
  const bulan = searchParams.get('bulan') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = 15;

  let where = 'WHERE 1=1';
  const params = [];

  if (q) {
    where += ' AND (Rapat.judul LIKE ? OR Rapat.tempat LIKE ? OR Rapat.agenda LIKE ? OR Rapat.pimpinanRapat LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (tahun) {
    where += " AND strftime('%Y', Rapat.tanggal) = ?";
    params.push(String(tahun));
  }
  if (bulan) {
    const formattedBulan = String(bulan).padStart(2, '0');
    where += " AND strftime('%m', Rapat.tanggal) = ?";
    params.push(formattedBulan);
  }

  const total = db.prepare(`SELECT COUNT(*) as c FROM Rapat ${where}`).get(...params).c;

  const data = db
    .prepare(
      `SELECT Rapat.*, User.namaLengkap as pembuatNama,
       (SELECT COUNT(*) FROM PresensiRapat WHERE PresensiRapat.rapatId = Rapat.id) as jumlahPresensi
       FROM Rapat
       LEFT JOIN User ON Rapat.createdBy = User.id
       ${where}
       ORDER BY Rapat.tanggal DESC, Rapat.createdAt DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, (page - 1) * pageSize);

  return NextResponse.json({ data, total, page, pageSize });
}

// POST /api/rapat (create new meeting)
export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role === 'staf_umum') {
    return NextResponse.json({ error: 'Role Anda tidak memiliki izin membuat rapat.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      judul,
      tanggal,
      waktuMulai,
      waktuSelesai,
      tempat,
      pimpinanRapat,
      notulis,
      agenda,
    } = body;

    if (!judul || !tanggal) {
      return NextResponse.json({ error: 'Judul dan Tanggal rapat wajib diisi.' }, { status: 400 });
    }

    const info = db
      .prepare(
        `INSERT INTO Rapat (
          judul, tanggal, waktuMulai, waktuSelesai, tempat, pimpinanRapat, notulis, agenda, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        judul.trim(),
        tanggal.trim(),
        (waktuMulai || '').trim() || null,
        (waktuSelesai || '').trim() || null,
        (tempat || '').trim() || null,
        (pimpinanRapat || '').trim() || null,
        (notulis || '').trim() || null,
        (agenda || '').trim() || null,
        session.id
      );

    db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
      'buat_rapat',
      `${session.namaLengkap} membuat agenda rapat baru: "${judul}" (Tanggal: ${tanggal})`,
      session.id
    );

    return NextResponse.json({ ok: true, id: info.lastInsertRowid });
  } catch (err) {
    console.error('Error creating rapat:', err);
    return NextResponse.json({ error: 'Gagal menyimpan rapat: ' + err.message }, { status: 500 });
  }
}

