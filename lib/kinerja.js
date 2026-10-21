// lib/kinerja.js
// Perhitungan Realisasi% dan Capaian% untuk fitur Catatan Kinerja Tahunan.
//
// Ada 2 tipe indikator:
// - tipeInput 2 (pembanding): diisi tiap bulan (nilai1 & nilai2), Jumlah = total semua
//   bulan yang sudah terisi. Realisasi% = Jumlah nilai1 / Jumlah nilai2 * 100.
//   Capaian% = Realisasi% / Target * 100.
// - tipeInput 1 (langsung): satu nilai per tahun (disimpan di baris bulan=0).
//   Capaian% = nilai / Target * 100.

function hitungIndikator(indikator, capaianRows, target) {
  if (indikator.tipeInput === 1) {
    const row = capaianRows.find((r) => r.bulan === 0);
    const nilai = row && row.nilai1 != null ? row.nilai1 : null;
    const capaian = nilai != null && target ? (nilai / target) * 100 : null;
    return { nilai, jumlah1: null, jumlah2: null, realisasi: null, capaian };
  }

  let jumlah1 = 0;
  let jumlah2 = 0;
  let ada = false;
  for (let bulan = 1; bulan <= 12; bulan++) {
    const row = capaianRows.find((r) => r.bulan === bulan);
    if (row) {
      if (row.nilai1 != null) { jumlah1 += row.nilai1; ada = true; }
      if (row.nilai2 != null) { jumlah2 += row.nilai2; ada = true; }
    }
  }
  const realisasi = ada && jumlah2 > 0 ? (jumlah1 / jumlah2) * 100 : null;
  const capaian = realisasi != null && target ? (realisasi / target) * 100 : null;
  return { nilai: null, jumlah1: ada ? jumlah1 : null, jumlah2: ada ? jumlah2 : null, realisasi, capaian };
}

module.exports = { hitungIndikator };
