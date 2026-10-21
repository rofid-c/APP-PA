import { NextResponse } from 'next/server';
const { db } = require('../../../lib/db');
const { getSession } = require('../../../lib/session');
const { hitungIndikator } = require('../../../lib/kinerja');

// GET /api/kinerja?tahun=2026&semua=1
// Mengembalikan seluruh Sasaran Kinerja + Indikator Kinerja di bawahnya, lengkap dengan
// target, isian capaian tahun tsb, dan hasil hitungan Realisasi%/Capaian% -- dalam 1 query
// per tabel (bukan query berulang per indikator).
//
// Indikator/Sasaran yang statusnya nonaktif otomatis disembunyikan dari tahun yang belum
// ada datanya (supaya tidak nyampah di tahun-tahun baru), TAPI tetap tampil kalau tahun
// tsb sudah punya data historis (supaya laporan lama tetap lengkap & akurat).
// Kirim ?semua=1 untuk mengambil SEMUA indikator apa adanya tanpa filter ini -- dipakai
// halaman Kelola Kinerja di Pengaturan supaya admin tetap bisa lihat & kelola yang nonaktif.
export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang bisa mengakses Capaian Kinerja.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tahun = parseInt(searchParams.get('tahun') || new Date().getFullYear(), 10);
  const includeAll = searchParams.get('semua') === '1';

  const sasaranList = db.prepare('SELECT * FROM SasaranKinerja ORDER BY urutan ASC').all();
  const indikatorList = db.prepare('SELECT * FROM IndikatorKinerja ORDER BY urutan ASC').all();
  const targetList = db.prepare('SELECT * FROM TargetKinerja WHERE tahun = ?').all(tahun);
  const capaianList = db.prepare('SELECT * FROM CapaianKinerja WHERE tahun = ?').all(tahun);

  const targetMap = {};
  targetList.forEach((t) => { targetMap[t.indikatorId] = t.target; });

  const capaianByIndikator = {};
  capaianList.forEach((c) => {
    if (!capaianByIndikator[c.indikatorId]) capaianByIndikator[c.indikatorId] = [];
    capaianByIndikator[c.indikatorId].push(c);
  });

  const data = sasaranList
    .map((s) => {
      const indikatorSasaran = indikatorList
        .filter((i) => i.sasaranId === s.id)
        .map((i) => {
          const rows = capaianByIndikator[i.id] || [];
          const target = targetMap[i.id] ?? null;
          const hasil = hitungIndikator(i, rows, target);
          const punyaData = rows.some((r) => r.nilai1 != null || r.nilai2 != null);
          return {
            id: i.id,
            sasaranId: i.sasaranId,
            nama: i.nama,
            tipeInput: i.tipeInput,
            labelInput1: i.labelInput1,
            labelInput2: i.labelInput2,
            urutan: i.urutan,
            aktif: i.aktif === 1,
            target,
            capaianRows: rows,
            ...hasil,
            _tampilTahunIni: i.aktif === 1 || punyaData,
          };
        });

      const indikatorTampil = includeAll ? indikatorSasaran : indikatorSasaran.filter((i) => i._tampilTahunIni);

      return {
        id: s.id,
        nama: s.nama,
        urutan: s.urutan,
        aktif: s.aktif === 1,
        indikator: indikatorTampil.map(({ _tampilTahunIni, ...rest }) => rest),
      };
    })
    .filter((s) => includeAll || s.aktif || s.indikator.length > 0);

  return NextResponse.json({ tahun, data });
}
