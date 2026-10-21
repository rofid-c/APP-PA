const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// Format tanggal+jam dari createdAt (disimpan di database sebagai UTC oleh SQLite).
// Di-parse eksplisit sebagai UTC (tambahkan 'Z'), lalu ditampilkan di zona WIB secara
// eksplisit -- supaya hasilnya selalu benar apa pun timezone mesin server, bukan cuma
// kebetulan benar kalau server-nya sudah di-set WIB.
export function formatTanggalWaktu(iso) {
  const d = new Date(iso.replace(' ', 'T') + 'Z');
  const tanggal = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' });
  return `${tanggal} ${jam}`;
}

// Format tanggal saja, untuk field tanpa jam (Tanggal BHT, tanggal pinjam/kembali) yang
// disimpan sebagai string murni "YYYY-MM-DD". Diparse manual (bukan lewat Date) supaya
// tidak mungkin kena geser timezone.
export function formatTanggal(iso) {
  const [tahun, bulan, hari] = iso.slice(0, 10).split('-');
  return `${parseInt(hari, 10)} ${NAMA_BULAN[parseInt(bulan, 10) - 1]} ${tahun}`;
}
