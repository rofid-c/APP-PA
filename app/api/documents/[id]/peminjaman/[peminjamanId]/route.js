import { NextResponse } from 'next/server';
const { db } = require('../../../../../../lib/db');
const { getSession } = require('../../../../../../lib/session');

function parseValidId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// PATCH /api/documents/:id/peminjaman/:peminjamanId
// Mengoreksi data peminjaman yang sudah tercatat (nama peminjam, tanggal pinjam,
// tanggal kembali) -- termasuk peminjaman yang masih aktif (belum dikembalikan).
// Khusus admin, karena ini mengubah data historis/audit trail peminjaman.
export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang boleh mengedit data peminjaman.' }, { status: 403 });
  }

  const arsipId = parseValidId(params.id);
  const peminjamanId = parseValidId(params.peminjamanId);
  if (!arsipId || !peminjamanId) {
    return NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 });
  }

  const record = db.prepare('SELECT * FROM Peminjaman WHERE id = ? AND arsipId = ?').get(peminjamanId, arsipId);
  if (!record) return NextResponse.json({ error: 'Data peminjaman tidak ditemukan.' }, { status: 404 });

  const arsip = db.prepare('SELECT id, nomorPerkara FROM Arsip WHERE id = ?').get(arsipId);
  if (!arsip) return NextResponse.json({ error: 'Arsip tidak ditemukan.' }, { status: 404 });

  const { peminjam, tanggalPinjam, tanggalKembali } = await request.json();

  if (!peminjam || !peminjam.trim()) {
    return NextResponse.json({ error: 'Nama peminjam wajib diisi.' }, { status: 400 });
  }
  if (!tanggalPinjam || isNaN(new Date(tanggalPinjam).getTime())) {
    return NextResponse.json({ error: 'Tanggal pinjam tidak valid.' }, { status: 400 });
  }

  const kembaliKosong = tanggalKembali === '' || tanggalKembali === null || tanggalKembali === undefined;
  if (!kembaliKosong && isNaN(new Date(tanggalKembali).getTime())) {
    return NextResponse.json({ error: 'Tanggal kembali tidak valid.' }, { status: 400 });
  }
  if (!kembaliKosong && new Date(tanggalKembali).getTime() < new Date(tanggalPinjam).getTime()) {
    return NextResponse.json({ error: 'Tanggal kembali tidak boleh sebelum tanggal pinjam.' }, { status: 400 });
  }

  // Kalau hasil editan ini bikin record jadi "aktif lagi" (tanggal kembali dikosongkan),
  // pastikan tidak ada peminjaman aktif LAIN untuk arsip yang sama -- supaya tidak pernah
  // ada 2 peminjaman aktif sekaligus untuk 1 arsip fisik yang sama.
  if (kembaliKosong) {
    const aktifLain = db
      .prepare('SELECT id FROM Peminjaman WHERE arsipId = ? AND tanggalKembali IS NULL AND id != ?')
      .get(arsipId, peminjamanId);
    if (aktifLain) {
      return NextResponse.json(
        { error: 'Arsip ini sudah punya peminjaman aktif lain yang belum dikembalikan. Tidak bisa mengosongkan tanggal kembali di sini.' },
        { status: 400 }
      );
    }
  }

  db.prepare('UPDATE Peminjaman SET peminjam = ?, tanggalPinjam = ?, tanggalKembali = ? WHERE id = ?').run(
    peminjam.trim(),
    tanggalPinjam,
    kembaliKosong ? null : tanggalKembali,
    peminjamanId
  );

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'ubah_peminjaman',
    `${session.namaLengkap} mengoreksi data peminjaman arsip ${arsip.nomorPerkara} (peminjam: ${peminjam.trim()})`,
    session.id
  );

  return NextResponse.json({ ok: true });
}
