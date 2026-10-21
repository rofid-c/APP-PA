import { NextResponse } from 'next/server';
const { db } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');
const { NAMA_BULAN } = require('../../../lib/bulan');

// PUT /api/kinerja/capaian
// body { indikatorId, tahun, bulan, nilai1, nilai2 }
// - Untuk indikator tipeInput=2: bulan wajib 1-12, nilai1 & nilai2 diisi.
// - Untuk indikator tipeInput=1: bulan dikirim 0 (nilai tahunan tunggal), hanya nilai1 dipakai.
export async function PUT(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang boleh mengisi Capaian Kinerja.' }, { status: 403 });
  }

  const { indikatorId, tahun, bulan, nilai1, nilai2 } = await request.json();
  if (!indikatorId || !tahun) {
    return NextResponse.json({ error: 'indikatorId dan tahun wajib diisi.' }, { status: 400 });
  }

  const indikator = db.prepare('SELECT * FROM IndikatorKinerja WHERE id = ?').get(indikatorId);
  if (!indikator) return NextResponse.json({ error: 'Indikator kinerja tidak ditemukan.' }, { status: 404 });

  const bulanNum = Number(bulan);
  if (indikator.tipeInput === 1 && bulanNum !== 0) {
    return NextResponse.json({ error: 'Indikator ini pakai input tahunan tunggal, bulan harus 0.' }, { status: 400 });
  }
  if (indikator.tipeInput === 2 && (bulanNum < 1 || bulanNum > 12)) {
    return NextResponse.json({ error: 'Bulan harus antara 1 sampai 12.' }, { status: 400 });
  }

  const n1 = nilai1 === '' || nilai1 === null || nilai1 === undefined ? null : Number(nilai1);
  const n2 = nilai2 === '' || nilai2 === null || nilai2 === undefined ? null : Number(nilai2);
  if (n1 !== null && isNaN(n1)) return NextResponse.json({ error: 'Nilai pertama harus berupa angka.' }, { status: 400 });
  if (n2 !== null && isNaN(n2)) return NextResponse.json({ error: 'Nilai kedua harus berupa angka.' }, { status: 400 });

  db.prepare(
    `INSERT INTO CapaianKinerja (indikatorId, tahun, bulan, nilai1, nilai2, updatedBy, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(indikatorId, tahun, bulan) DO UPDATE SET
       nilai1 = excluded.nilai1, nilai2 = excluded.nilai2, updatedBy = excluded.updatedBy, updatedAt = datetime('now')`
  ).run(indikatorId, tahun, bulanNum, n1, n2, session.id);

  const labelWaktu = indikator.tipeInput === 1 ? `tahun ${tahun}` : `${NAMA_BULAN[bulanNum - 1]} ${tahun}`;
  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'isi_capaian_kinerja',
    `${session.namaLengkap} mengisi capaian "${indikator.nama}" untuk ${labelWaktu}`,
    session.id
  );

  return NextResponse.json({ ok: true });
}
