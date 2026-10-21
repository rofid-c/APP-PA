import { NextResponse } from 'next/server';
const { db } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');

// GET /api/laporan/grid?tahun=2024
// Mengembalikan semua jenis laporan + status upload tiap bulan (1-12) dalam 1 query efisien,
// bukan query berulang per kotak grid.
export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tahun = parseInt(searchParams.get('tahun') || new Date().getFullYear(), 10);

  const jenisList = db.prepare('SELECT * FROM JenisLaporan ORDER BY urutan ASC').all();

  const uploaded = db
    .prepare('SELECT id, jenisLaporanId, bulan, namaDokumen FROM ArsipLaporan WHERE tahun = ?')
    .all(tahun);

  const map = {}; // `${jenisLaporanId}-${bulan}` -> { id, namaDokumen }
  uploaded.forEach((u) => {
    map[`${u.jenisLaporanId}-${u.bulan}`] = { id: u.id, namaDokumen: u.namaDokumen };
  });

  const grid = jenisList.map((jenis) => ({
    jenisLaporanId: jenis.id,
    nama: jenis.nama,
    bulan: Array.from({ length: 12 }, (_, i) => {
      const bulanKe = i + 1;
      const entry = map[`${jenis.id}-${bulanKe}`];
      return { bulan: bulanKe, sudahUpload: !!entry, arsipId: entry?.id || null, namaDokumen: entry?.namaDokumen || null };
    }),
  }));

  return NextResponse.json({ tahun, grid });
}
