import { NextResponse } from 'next/server';
const { db } = require('../../../../../lib/db');
const { getSession } = require('../../../../../lib/session');

function canModify(session) {
  if (!session) return false;
  return session.role !== 'staf_umum';
}

function parseValidId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// POST /api/documents/:id/peminjaman -- catat peminjaman baru
export async function POST(request, { params }) {
  const session = await getSession();
  if (!canModify(session)) {
    return NextResponse.json({ error: 'Role Anda tidak punya akses untuk mencatat peminjaman.' }, { status: 403 });
  }

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID arsip tidak valid.' }, { status: 400 });

  const { peminjam, tanggalPinjam } = await request.json();
  if (!peminjam || !peminjam.trim()) {
    return NextResponse.json({ error: 'Nama peminjam wajib diisi.' }, { status: 400 });
  }
  if (!tanggalPinjam || isNaN(new Date(tanggalPinjam).getTime())) {
    return NextResponse.json({ error: 'Tanggal pinjam tidak valid.' }, { status: 400 });
  }

  const arsip = db.prepare('SELECT id, nomorPerkara FROM Arsip WHERE id = ?').get(id);
  if (!arsip) return NextResponse.json({ error: 'Arsip tidak ditemukan.' }, { status: 404 });

  // Seluruh proses cek+simpan dibungkus 1 transaksi -- supaya kalau 2 permintaan pinjam
  // untuk arsip yang sama masuk nyaris bersamaan, tidak mungkin keduanya lolos jadi
  // 2 peminjaman aktif sekaligus untuk 1 dokumen fisik yang sama.
  const buatPeminjaman = db.transaction(() => {
    const aktif = db
      .prepare('SELECT id FROM Peminjaman WHERE arsipId = ? AND tanggalKembali IS NULL')
      .get(id);
    if (aktif) {
      throw new Error('SUDAH_DIPINJAM');
    }
    return db
      .prepare('INSERT INTO Peminjaman (arsipId, peminjam, tanggalPinjam, dicatatOleh) VALUES (?, ?, ?, ?)')
      .run(id, peminjam.trim(), tanggalPinjam, session.id);
  });

  let info;
  try {
    info = buatPeminjaman();
  } catch (e) {
    if (e.message === 'SUDAH_DIPINJAM') {
      return NextResponse.json({ error: 'Arsip ini sudah sedang dipinjam.' }, { status: 400 });
    }
    throw e;
  }

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'pinjam_arsip',
    `${session.namaLengkap} mencatat peminjaman arsip ${arsip.nomorPerkara} oleh ${peminjam.trim()}`,
    session.id
  );

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}

// PATCH /api/documents/:id/peminjaman -- tandai dikembalikan
export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!canModify(session)) {
    return NextResponse.json({ error: 'Role Anda tidak punya akses untuk mencatat pengembalian.' }, { status: 403 });
  }

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID arsip tidak valid.' }, { status: 400 });

  const { tanggalKembali } = await request.json();
  const tglKembali = tanggalKembali || new Date().toISOString().slice(0, 10);
  if (isNaN(new Date(tglKembali).getTime())) {
    return NextResponse.json({ error: 'Tanggal kembali tidak valid.' }, { status: 400 });
  }

  const arsip = db.prepare('SELECT id, nomorPerkara FROM Arsip WHERE id = ?').get(id);
  if (!arsip) return NextResponse.json({ error: 'Arsip tidak ditemukan.' }, { status: 404 });

  const tandaiKembali = db.transaction(() => {
    const aktif = db
      .prepare('SELECT id FROM Peminjaman WHERE arsipId = ? AND tanggalKembali IS NULL')
      .get(id);
    if (!aktif) {
      throw new Error('TIDAK_SEDANG_DIPINJAM');
    }
    db.prepare('UPDATE Peminjaman SET tanggalKembali = ? WHERE id = ?').run(tglKembali, aktif.id);
  });

  try {
    tandaiKembali();
  } catch (e) {
    if (e.message === 'TIDAK_SEDANG_DIPINJAM') {
      return NextResponse.json({ error: 'Arsip ini sedang tidak dipinjam.' }, { status: 400 });
    }
    throw e;
  }

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'kembalikan_arsip',
    `${session.namaLengkap} mencatat pengembalian arsip ${arsip.nomorPerkara}`,
    session.id
  );

  return NextResponse.json({ ok: true });
}
