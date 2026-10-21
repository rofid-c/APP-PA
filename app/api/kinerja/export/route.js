import { NextResponse } from 'next/server';
const ExcelJS = require('exceljs');
const { db } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');
const { hitungIndikator } = require('../../../../lib/kinerja');
const { NAMA_BULAN } = require('../../../lib/bulan');

const BULAN_PENDEK = NAMA_BULAN.map((b) => b.slice(0, 3));
const TOTAL_KOLOM = 3 + 1 + 1 + 12 + 1 + 1 + 1; // No,Sasaran,Indikator + Keterangan + Target + 12bulan + Jumlah + Realisasi + Capaian
const THIN = { style: 'thin', color: { argb: 'FFB0B0B0' } };
const BORDER_ALL = { top: THIN, left: THIN, bottom: THIN, right: THIN };

function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '';
  return Math.round(n * 100) / 100;
}

// GET /api/kinerja/export?tahun=2026
export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang bisa mengekspor Capaian Kinerja.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tahun = parseInt(searchParams.get('tahun') || new Date().getFullYear(), 10);

  const sasaranList = db.prepare('SELECT * FROM SasaranKinerja ORDER BY urutan ASC').all();
  const indikatorList = db.prepare('SELECT * FROM IndikatorKinerja ORDER BY urutan ASC').all();
  const targetList = db.prepare('SELECT * FROM TargetKinerja WHERE tahun = ?').all(tahun);
  const capaianList = db.prepare('SELECT * FROM CapaianKinerja WHERE tahun = ?').all(tahun);
  const penandatangan = db.prepare('SELECT * FROM PengaturanKinerja WHERE id = 1').get();

  if (sasaranList.length === 0) {
    return NextResponse.json({ error: 'Belum ada data Sasaran & Indikator Kinerja untuk diekspor.' }, { status: 400 });
  }

  const targetMap = {};
  targetList.forEach((t) => { targetMap[t.indikatorId] = t.target; });
  const capaianByIndikator = {};
  capaianList.forEach((c) => {
    if (!capaianByIndikator[c.indikatorId]) capaianByIndikator[c.indikatorId] = [];
    capaianByIndikator[c.indikatorId].push(c);
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Kinerja ${tahun}`, {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    },
  });

  sheet.columns = [
    { width: 5 }, { width: 24 }, { width: 30 }, { width: 22 }, { width: 9 },
    ...BULAN_PENDEK.map(() => ({ width: 7 })),
    { width: 9 }, { width: 11 }, { width: 11 },
  ];

  // --- Judul ---
  sheet.mergeCells(1, 1, 1, TOTAL_KOLOM);
  sheet.getCell(1, 1).value = `CAPAIAN KINERJA TAHUN ${tahun}`;
  sheet.getCell(1, 1).font = { bold: true, size: 13 };
  sheet.getCell(1, 1).alignment = { horizontal: 'center' };

  sheet.mergeCells(2, 1, 2, TOTAL_KOLOM);
  sheet.getCell(2, 1).value = 'PA GUNUNG SUGIH';
  sheet.getCell(2, 1).font = { bold: true, size: 12 };
  sheet.getCell(2, 1).alignment = { horizontal: 'center' };

  // --- Header tabel ---
  const headerRowIdx = 4;
  const headerLabels = ['No', 'Sasaran Kinerja', 'Indikator Kinerja', 'Keterangan', 'Target', ...BULAN_PENDEK, 'Jumlah', 'Realisasi (%)', 'Capaian (%)'];
  headerLabels.forEach((label, i) => {
    const cell = sheet.getCell(headerRowIdx, i + 1);
    cell.value = label;
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = BORDER_ALL;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF3F0' } };
  });
  sheet.getRow(headerRowIdx).height = 28;

  let rowIdx = headerRowIdx + 1;
  let no = 1;

  sasaranList.forEach((sasaran) => {
    const indikatorSasaran = indikatorList.filter((i) => {
      if (i.sasaranId !== sasaran.id) return false;
      const punyaData = (capaianByIndikator[i.id] || []).some((r) => r.nilai1 != null || r.nilai2 != null);
      return i.aktif === 1 || punyaData;
    });
    if (indikatorSasaran.length === 0) return;

    const sasaranStartRow = rowIdx;

    indikatorSasaran.forEach((indikator) => {
      const rows = capaianByIndikator[indikator.id] || [];
      const target = targetMap[indikator.id] ?? null;
      const hasil = hitungIndikator(indikator, rows, target);
      const indikatorStartRow = rowIdx;

      if (indikator.tipeInput === 2) {
        // Baris pembilang (nilai1)
        const rBaris1 = sheet.getRow(rowIdx);
        rBaris1.getCell(1).value = no;
        rBaris1.getCell(3).value = indikator.nama;
        rBaris1.getCell(4).value = indikator.labelInput1;
        rBaris1.getCell(5).value = target;
        for (let b = 1; b <= 12; b++) {
          const r = rows.find((x) => x.bulan === b);
          rBaris1.getCell(5 + b).value = r && r.nilai1 != null ? r.nilai1 : null;
        }
        rBaris1.getCell(18).value = hasil.jumlah1;
        rowIdx++;

        // Baris penyebut (nilai2)
        const rBaris2 = sheet.getRow(rowIdx);
        rBaris2.getCell(4).value = indikator.labelInput2;
        for (let b = 1; b <= 12; b++) {
          const r = rows.find((x) => x.bulan === b);
          rBaris2.getCell(5 + b).value = r && r.nilai2 != null ? r.nilai2 : null;
        }
        rBaris2.getCell(18).value = hasil.jumlah2;
        rowIdx++;

        sheet.mergeCells(indikatorStartRow, 1, indikatorStartRow + 1, 1); // No
        sheet.mergeCells(indikatorStartRow, 3, indikatorStartRow + 1, 3); // Indikator
        sheet.mergeCells(indikatorStartRow, 5, indikatorStartRow + 1, 5); // Target
        sheet.mergeCells(indikatorStartRow, 19, indikatorStartRow + 1, 19); // Realisasi
        sheet.mergeCells(indikatorStartRow, 20, indikatorStartRow + 1, 20); // Capaian
        sheet.getCell(indikatorStartRow, 19).value = fmt(hasil.realisasi);
        sheet.getCell(indikatorStartRow, 20).value = fmt(hasil.capaian);
      } else {
        // Tipe 1: satu baris saja, tanpa kolom bulan (nilai tahunan tunggal)
        const r = sheet.getRow(rowIdx);
        r.getCell(1).value = no;
        r.getCell(3).value = indikator.nama;
        r.getCell(4).value = indikator.labelInput1;
        r.getCell(5).value = target;
        r.getCell(18).value = hasil.nilai;
        r.getCell(19).value = '-';
        r.getCell(20).value = fmt(hasil.capaian);
        sheet.mergeCells(rowIdx, 6, rowIdx, 17); // kolom bulan digabung jadi 1 sel kosong
        rowIdx++;
      }

      no++;
    });

    if (rowIdx - 1 > sasaranStartRow) {
      sheet.mergeCells(sasaranStartRow, 2, rowIdx - 1, 2);
    }
    sheet.getCell(sasaranStartRow, 2).value = sasaran.nama;
  });

  // Border & alignment untuk seluruh area tabel yang sudah diisi
  for (let r = headerRowIdx; r < rowIdx; r++) {
    for (let c = 1; c <= TOTAL_KOLOM; c++) {
      const cell = sheet.getCell(r, c);
      cell.border = BORDER_ALL;
      if (r > headerRowIdx) {
        cell.alignment = { vertical: 'middle', horizontal: c <= 4 ? 'left' : 'center', wrapText: c <= 4 };
      }
    }
  }

  // --- Blok tanda tangan ---
  const tanggalExport = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  const ttdCol = TOTAL_KOLOM - 4;
  let ttdRow = rowIdx + 2;

  sheet.mergeCells(ttdRow, ttdCol, ttdRow, TOTAL_KOLOM);
  sheet.getCell(ttdRow, ttdCol).value = `Gunung Sugih, ${tanggalExport}`;
  sheet.getCell(ttdRow, ttdCol).alignment = { horizontal: 'center' };
  ttdRow++;

  sheet.mergeCells(ttdRow, ttdCol, ttdRow, TOTAL_KOLOM);
  sheet.getCell(ttdRow, ttdCol).value = 'Ketua';
  sheet.getCell(ttdRow, ttdCol).alignment = { horizontal: 'center' };
  ttdRow += 4; // ruang kosong untuk tanda tangan basah

  sheet.mergeCells(ttdRow, ttdCol, ttdRow, TOTAL_KOLOM);
  sheet.getCell(ttdRow, ttdCol).value = penandatangan?.namaPenandatangan || '(Nama penandatangan belum diisi di Pengaturan)';
  sheet.getCell(ttdRow, ttdCol).font = { bold: true, underline: true };
  sheet.getCell(ttdRow, ttdCol).alignment = { horizontal: 'center' };
  ttdRow++;

  sheet.mergeCells(ttdRow, ttdCol, ttdRow, TOTAL_KOLOM);
  sheet.getCell(ttdRow, ttdCol).value = penandatangan?.nipPenandatangan ? `NIP. ${penandatangan.nipPenandatangan}` : '';
  sheet.getCell(ttdRow, ttdCol).alignment = { horizontal: 'center' };

  const buffer = await workbook.xlsx.writeBuffer();

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'export_kinerja',
    `${session.namaLengkap} mengekspor Capaian Kinerja Tahunan ${tahun}`,
    session.id
  );

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Capaian-Kinerja-${tahun}.xlsx"`,
    },
  });
}
