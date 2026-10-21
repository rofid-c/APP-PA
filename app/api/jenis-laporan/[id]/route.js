import { NextResponse } from 'next/server';
const { db } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');

function canManage(session) {
  if (!session) return false;
  return session.role !== 'staf_umum';
}

// PATCH /api/jenis-laporan/:id - rename
export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!canManage(session)) {
    return NextResponse.json({ error: 'Tidak punya akses untuk mengelola jenis laporan.' }, { status: 403 });
  }

  const id = Number(params.id);
  const { nama } = await request.json();
  if (!nama || !nama.trim()) {
    return NextResponse.json({ error: 'Nama jenis laporan wajib diisi.' }, { status: 400 });
  }

  const target = db.prepare('SELECT * FROM JenisLaporan WHERE id = ?').get(id);
  if (!target) return NextResponse.json({ error: 'Jenis laporan tidak ditemukan.' }, { status: 404 });

  const existing = db.prepare('SELECT id FROM JenisLaporan WHERE nama = ? AND id != ?').get(nama.trim(), id);
  if (existing) return NextResponse.json({ error: 'Nama ini sudah dipakai jenis laporan lain.' }, { status: 400 });

  db.prepare('UPDATE JenisLaporan SET nama = ? WHERE id = ?').run(nama.trim(), id);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'ubah_jenis_laporan',
    `${session.namaLengkap} mengubah nama jenis laporan "${target.nama}" menjadi "${nama.trim()}"`,
    session.id
  );

  return NextResponse.json({ ok: true });
}

// DELETE /api/jenis-laporan/:id?penggantiId=X
export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!canManage(session)) {
    return NextResponse.json({ error: 'Tidak punya akses untuk mengelola jenis laporan.' }, { status: 403 });
  }

  const id = Number(params.id);
  const { searchParams } = new URL(request.url);
  const penggantiId = searchParams.get('penggantiId') ? Number(searchParams.get('penggantiId')) : null;

  const target = db.prepare('SELECT * FROM JenisLaporan WHERE id = ?').get(id);
  if (!target) return NextResponse.json({ error: 'Jenis laporan tidak ditemukan.' }, { status: 404 });

  const totalJenis = db.prepare('SELECT COUNT(*) as c FROM JenisLaporan').get().c;
  if (totalJenis <= 1) {
    return NextResponse.json({ error: 'Tidak bisa menghapus — ini jenis laporan terakhir yang tersisa.' }, { status: 400 });
  }

  const jumlahArsip = db.prepare('SELECT COUNT(*) as c FROM ArsipLaporan WHERE jenisLaporanId = ?').get(id).c;

  if (jumlahArsip > 0) {
    if (!penggantiId) {
      return NextResponse.json(
        { error: 'Jenis laporan ini masih dipakai arsip.', jumlahArsip, butuhPengganti: true },
        { status: 400 }
      );
    }
    const pengganti = db.prepare('SELECT id FROM JenisLaporan WHERE id = ?').get(penggantiId);
    if (!pengganti) return NextResponse.json({ error: 'Jenis laporan pengganti tidak ditemukan.' }, { status: 400 });
    if (penggantiId === id) return NextResponse.json({ error: 'Jenis pengganti tidak boleh sama dengan yang dihapus.' }, { status: 400 });

    // Kalau pengganti sudah punya laporan di bulan+tahun yang sama, migrasi ini akan
    // melanggar constraint UNIQUE(jenisLaporanId, bulan, tahun) -- deteksi dan tolak dengan pesan jelas
    // daripada biarkan error mentah dari database.
    const bentrok = db
      .prepare(
        `SELECT COUNT(*) as c FROM ArsipLaporan a1
         WHERE a1.jenisLaporanId = ? AND EXISTS (
           SELECT 1 FROM ArsipLaporan a2 WHERE a2.jenisLaporanId = ? AND a2.bulan = a1.bulan AND a2.tahun = a1.tahun
         )`
      )
      .get(id, penggantiId).c;
    if (bentrok > 0) {
      return NextResponse.json(
        { error: 'Tidak bisa memindahkan — ada bulan/tahun yang sudah punya laporan di jenis pengganti. Selesaikan bentrok itu dulu secara manual.' },
        { status: 400 }
      );
    }

    db.prepare('UPDATE ArsipLaporan SET jenisLaporanId = ? WHERE jenisLaporanId = ?').run(penggantiId, id);
  }

  db.prepare('DELETE FROM JenisLaporan WHERE id = ?').run(id);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'hapus_jenis_laporan',
    `${session.namaLengkap} menghapus jenis laporan "${target.nama}"${jumlahArsip > 0 ? ` (${jumlahArsip} arsip dipindahkan)` : ''}`,
    session.id
  );

  return NextResponse.json({ ok: true });
}
