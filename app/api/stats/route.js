import { NextResponse } from 'next/server';
const { db } = require('../../../lib/db');
const { getSession } = require('../../../lib/session');

export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tahun = parseInt(searchParams.get('tahun') || new Date().getFullYear(), 10);

  const total = db.prepare('SELECT COUNT(*) as c FROM Arsip').get().c;
  const sedangDipinjam = db
    .prepare(`SELECT COUNT(*) as c FROM Peminjaman WHERE tanggalKembali IS NULL`)
    .get().c;

  // Breakdown dinamis per jenis perkara (untuk tahun yang dipilih)
  const jenisBreakdown = db
    .prepare(
      `SELECT JenisPerkara.id, JenisPerkara.nama, JenisPerkara.urutan, COUNT(Arsip.id) as jumlah
       FROM JenisPerkara
       LEFT JOIN Arsip ON Arsip.jenisPerkaraId = JenisPerkara.id AND Arsip.tahun = ?
       GROUP BY JenisPerkara.id
       ORDER BY JenisPerkara.urutan ASC`
    )
    .all(tahun);

  const perTahun = db
    .prepare(`SELECT tahun, COUNT(*) as c FROM Arsip GROUP BY tahun ORDER BY tahun ASC`)
    .all();

  const terbaru = db
    .prepare(
      `SELECT Arsip.*, User.namaLengkap as uploaderNama, JenisPerkara.nama as jenisPerkaraNama, JenisPerkara.urutan as jenisPerkaraUrutan,
       (SELECT COUNT(*) FROM Peminjaman WHERE Peminjaman.arsipId = Arsip.id AND Peminjaman.tanggalKembali IS NULL) as sedangDipinjamIni
       FROM Arsip
       JOIN User ON Arsip.uploadedBy = User.id
       LEFT JOIN JenisPerkara ON Arsip.jenisPerkaraId = JenisPerkara.id
       ORDER BY Arsip.createdAt DESC LIMIT 5`
    )
    .all()
    .map((r) => ({ ...r, status: r.sedangDipinjamIni > 0 ? 'dipinjam' : 'ada' }));

  const aktivitas = db
    .prepare(
      `SELECT LogAktivitas.*, User.namaLengkap FROM LogAktivitas
       JOIN User ON LogAktivitas.userId = User.id
       WHERE LogAktivitas.aksi NOT IN ('login','ubah_akun','ubah_profil','verifikasi_akun','lihat','download')
       ORDER BY LogAktivitas.createdAt DESC LIMIT 6`
    )
    .all();

  return NextResponse.json({
    total,
    sedangDipinjam,
    jenisBreakdown,
    perTahun,
    terbaru,
    aktivitas,
    tahun,
  });
}
