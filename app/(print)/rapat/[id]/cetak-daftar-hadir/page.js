'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

function formatTanggalIndonesia(tanggalStr) {
  if (!tanggalStr) return '';
  try {
    const parts = tanggalStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, monthIdx, day);

      const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][d.getDay()];
      const namaBulan = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ][monthIdx];

      return `${namaHari}, ${day} ${namaBulan} ${year}`;
    }
    return tanggalStr;
  } catch {
    return tanggalStr;
  }
}

export default function CetakDaftarHadirPage() {
  const params = useParams();
  const id = params.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/rapat/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Auto-trigger print/download dialog setelah data dimuat
  useEffect(() => {
    if (data && !downloaded) {
      setDownloaded(true);
      // Beri waktu render selesai lalu buka dialog simpan PDF
      const timer = setTimeout(() => {
        window.print();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [data, downloaded]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        Memuat dokumen daftar hadir...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        Data rapat tidak ditemukan.
      </div>
    );
  }

  const presensiList = data.presensi || [];
  // Minimal 20 baris, atau sesuai jumlah peserta jika lebih dari 20
  const totalBaris = Math.max(20, presensiList.length);
  const rows = [];
  for (let i = 0; i < totalBaris; i++) {
    rows.push({
      no: i + 1,
      nama: presensiList[i]?.nama || '',
      jabatan: presensiList[i]?.jabatan || '',
      ttdData: presensiList[i]?.ttdData || null,
    });
  }

  // Pecah rows menjadi halaman-halaman: halaman 1 = 20 baris, halaman berikutnya = 25 baris
  // (halaman lanjutan tidak ada kop/meta, jadi muat lebih banyak baris)
  const BARIS_HALAMAN_1 = 20;
  const BARIS_HALAMAN_LANJUTAN = 25;
  const pages = [];
  if (rows.length <= BARIS_HALAMAN_1) {
    pages.push(rows);
  } else {
    pages.push(rows.slice(0, BARIS_HALAMAN_1));
    let sisa = rows.slice(BARIS_HALAMAN_1);
    while (sisa.length > 0) {
      pages.push(sisa.slice(0, BARIS_HALAMAN_LANJUTAN));
      sisa = sisa.slice(BARIS_HALAMAN_LANJUTAN);
    }
  }

  // Helper: render tabel daftar hadir
  function renderTabel(pageRows) {
    return (
      <table className="daftar-tabel">
        <thead>
          <tr>
            <th style={{ width: '6%', textAlign: 'center' }}>NO.</th>
            <th style={{ width: '31%', textAlign: 'center' }}>NAMA</th>
            <th style={{ width: '25%', textAlign: 'center' }}>JABATAN</th>
            <th style={{ width: '38%', textAlign: 'center' }}>TANDA TANGAN</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((r) => (
            <tr key={r.no}>
              <td style={{ textAlign: 'center', fontSize: '9pt' }}>
                {r.no}.
              </td>
              <td style={{ padding: '0 6px', fontWeight: r.nama ? 700 : 400, fontSize: '10pt' }}>
                {r.nama || ''}
              </td>
              <td style={{ padding: '0 6px', fontSize: '9.5pt' }}>
                {r.jabatan || ''}
              </td>
              <td style={{ textAlign: 'center', padding: '1px 4px' }}>
                {r.ttdData ? (
                  <img
                    src={r.ttdData}
                    alt={`TTD ${r.nama}`}
                    style={{
                      height: 24,
                      maxWidth: 90,
                      objectFit: 'contain',
                      display: 'inline-block',
                      verticalAlign: 'middle',
                    }}
                  />
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="cetak-container">
      {/* TOOLBAR KONTROL DI LAYAR (Otomatis Sembunyi saat Dicetak) */}
      <div className="no-print screen-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => window.close()}
            className="btn-toolbar-close"
          >
            ✕ Tutup
          </button>
          <span style={{ fontSize: 13, color: '#334', fontWeight: 600 }}>
            {data.judul} &bull; <strong style={{ color: '#0f4d3a' }}>{presensiList.length} Peserta Hadir</strong> ({totalBaris} baris, {pages.length} halaman)
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-toolbar-download"
          >
            <span>📥</span> Unduh PDF
          </button>
        </div>
      </div>

      {/* HALAMAN 1: Kop Surat + Judul dalam Kotak Tabel Bergaris + Metadata + Tabel Baris 1-20 */}
      <div className="paper-sheet">
        {/* KOP SURAT & JUDUL DAFTAR HADIR (Tabel Tertutup Garis Atas, Bawah, Kiri, Kanan Persis Template Word) */}
        <table className="kop-box-table">
          <tbody>
            <tr className="kop-header-row">
              <td style={{ width: 85, verticalAlign: 'middle', textAlign: 'center', padding: '6px 8px 6px 12px' }}>
                <img
                  src="/logo-pa.svg"
                  alt="Logo Mahkamah Agung"
                  style={{ width: 75, height: 90, objectFit: 'contain', display: 'block', margin: '0 auto' }}
                />
              </td>
              <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '6px 16px 6px 0' }}>
                <div style={{ fontSize: '12pt', fontWeight: 400 }}>
                  MAHKAMAH AGUNG REPUBLIK INDONESIA
                </div>
                <div style={{ fontSize: '13pt', fontWeight: 700, marginTop: 1 }}>
                  DIREKTORAT JENDERAL BADAN PERADILAN AGAMA
                </div>
                <div style={{ fontSize: '13pt', fontWeight: 700, marginTop: 1 }}>
                  PENGADILAN TINGGI AGAMA BANDAR LAMPUNG
                </div>
                <div style={{ fontSize: '12pt', fontWeight: 400, marginTop: 1 }}>
                  PENGADILAN AGAMA GUNUNG SUGIH KELAS 1B
                </div>
                <div style={{ fontSize: '10pt', marginTop: 2 }}>
                  Jalan Negara No. 99 Gunung Sugih
                </div>
              </td>
            </tr>
            <tr className="kop-title-row">
              <td colSpan={2} style={{ textAlign: 'center', padding: '5px 4px', fontWeight: 700, fontSize: '11.5pt', letterSpacing: '0.5px' }}>
                DAFTAR HADIR
              </td>
            </tr>
          </tbody>
        </table>

        {/* METADATA KEGIATAN PERSIS FORMAT WORD */}
        <table className="meta-table">
          <tbody>
            <tr>
              <td style={{ width: 125, padding: '1.5px 0', verticalAlign: 'top', fontWeight: 700 }}>
                Nama Kegiatan
              </td>
              <td style={{ width: 16, padding: '1.5px 0', verticalAlign: 'top', textAlign: 'center' }}>:</td>
              <td style={{ padding: '1.5px 0', verticalAlign: 'top', fontWeight: 700 }}>
                {data.judul}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '1.5px 0', verticalAlign: 'top', fontWeight: 700 }}>
                Hari, Tgl.
              </td>
              <td style={{ padding: '1.5px 0', verticalAlign: 'top', textAlign: 'center' }}>:</td>
              <td style={{ padding: '1.5px 0', verticalAlign: 'top' }}>
                {formatTanggalIndonesia(data.tanggal)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '1.5px 0', verticalAlign: 'top', fontWeight: 700 }}>
                Waktu
              </td>
              <td style={{ padding: '1.5px 0', verticalAlign: 'top', textAlign: 'center' }}>:</td>
              <td style={{ padding: '1.5px 0', verticalAlign: 'top' }}>
                {data.waktuMulai ? `${data.waktuMulai} WIB s.d. ${data.waktuSelesai ? data.waktuSelesai + ' WIB' : 'Selesai'}` : '-'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '1.5px 0', verticalAlign: 'top', fontWeight: 700 }}>
                Tempat
              </td>
              <td style={{ padding: '1.5px 0', verticalAlign: 'top', textAlign: 'center' }}>:</td>
              <td style={{ padding: '1.5px 0', verticalAlign: 'top' }}>
                {data.tempat || 'Ruang Media Center PA Gunung Sugih'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* TABEL HALAMAN 1 */}
        {renderTabel(pages[0])}
      </div>

      {/* HALAMAN LANJUTAN (jika peserta > 20): setiap halaman punya kop + tabel lanjutan */}
      {pages.slice(1).map((pageRows, pageIdx) => (
        <div className="paper-sheet paper-lanjutan" key={pageIdx + 1}>
          {/* Kop Ringkas Halaman Lanjutan */}
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: '10pt', fontWeight: 700, marginBottom: 2 }}>
              DAFTAR HADIR (Lanjutan Halaman {pageIdx + 2})
            </div>
            <div style={{ fontSize: '9pt', color: '#333' }}>
              {data.judul} — {formatTanggalIndonesia(data.tanggal)}
            </div>
          </div>

          {/* TABEL HALAMAN LANJUTAN */}
          {renderTabel(pageRows)}
        </div>
      ))}

      <style jsx global>{`
        /* Reset & Container Layar */
        .cetak-container {
          background: #525659;
          min-height: 100vh;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Times New Roman', Times, serif;
          color: #000;
        }

        .screen-toolbar {
          width: 210mm;
          max-width: 100%;
          background: #ffffff;
          padding: 10px 16px;
          border-radius: 6px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          font-family: Arial, sans-serif;
          box-sizing: border-box;
        }

        .btn-toolbar-close {
          background: #f1f3f4;
          border: 1px solid #dadce0;
          color: #3c4043;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-toolbar-download {
          background: #0f4d3a;
          color: #ffffff;
          border: none;
          padding: 8px 18px;
          border-radius: 4px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        /* Lembar Kertas Ukuran A4 */
        .paper-sheet {
          width: 210mm;
          min-height: 297mm;
          background: #ffffff;
          padding: 12.5mm 13.5mm 11.5mm 13.5mm;
          box-shadow: 0 4px 16px rgba(0,0,0,0.35);
          box-sizing: border-box;
        }

        /* Halaman lanjutan: jarak antar halaman di layar + page-break saat cetak */
        .paper-lanjutan {
          margin-top: 24px;
        }

        /* Kotak Tabel Kop Surat & DAFTAR HADIR (Tertutup Garis Atas, Bawah, Kiri, Kanan Persis Template Word) */
        .kop-box-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000000;
          margin-bottom: 12px;
        }
        .kop-box-table td {
          border: none;
        }
        .kop-header-row td {
          line-height: 1.25;
        }
        .kop-title-row td {
          border-top: 1px solid #000000;
          background: #ffffff;
        }

        .meta-table {
          width: 100%;
          border-collapse: collapse;
          border: none;
          font-size: 10.5pt;
          margin-bottom: 10px;
        }
        .meta-table td {
          border: none;
        }

        /* Tabel Daftar Hadir Persis Word (Border 1px #222) */
        .daftar-tabel {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .daftar-tabel th,
        .daftar-tabel td {
          border: 1px solid #000000;
          vertical-align: middle;
        }

        .daftar-tabel th {
          font-size: 10pt;
          font-weight: 700;
          padding: 5px 4px;
          background: #ffffff;
        }

        .daftar-tabel td {
          height: 8.6mm;
          box-sizing: border-box;
        }

        /* Pengaturan Cetak Browser / Printer (PDF) */
        @media print {
          @page {
            size: A4 portrait;
            margin: 12.5mm 13.5mm 11.5mm 13.5mm;
          }
          body, html {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .cetak-container {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          .paper-sheet {
            width: 100% !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .paper-lanjutan {
            page-break-before: always;
            margin-top: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
