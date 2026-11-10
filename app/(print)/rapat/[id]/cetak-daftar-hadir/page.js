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

  useEffect(() => {
    if (!id) return;
    fetch(`/api/rapat/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

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
  // Persis 20 baris seperti di template Word (atau lebih jika peserta > 20)
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
            {data.judul} &bull; <strong style={{ color: '#0f4d3a' }}>{presensiList.length} Peserta Hadir</strong> ({totalBaris} baris)
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-toolbar-print"
          >
            <span>🖨️</span> Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* LEMBAR KERTAS A4 PERSIS TEMPLATE WORD */}
      <div className="paper-sheet">
        {/* KOP SURAT MAHKAMAH AGUNG (Tabel 2 Kolom Persis Word) */}
        <table className="kop-table">
          <tbody>
            <tr>
              <td style={{ width: 85, verticalAlign: 'middle', textAlign: 'center', padding: '0 8px 0 0' }}>
                <img
                  src="/logo-pa.svg"
                  alt="Logo Mahkamah Agung"
                  style={{ width: 75, height: 90, objectFit: 'contain', display: 'block', margin: '0 auto' }}
                />
              </td>
              <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '0' }}>
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
          </tbody>
        </table>

        {/* JUDUL DAFTAR HADIR (Di Tengah Bergaris Bawah Sesuai Template Word) */}
        <div style={{ textAlign: 'center', marginTop: 14, marginBottom: 12 }}>
          <span
            style={{
              fontSize: '11.5pt',
              fontWeight: 700,
              textDecoration: 'underline',
              letterSpacing: '0.5px',
            }}
          >
            DAFTAR HADIR
          </span>
        </div>

        {/* METADATA KEGIATAN PERSIS FORMAT WORD (Tanpa Garis Horizontal) */}
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

        {/* TABEL KEHADIRAN 20 BARIS PERSIS TEMPLATE WORD */}
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
            {rows.map((r) => (
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
      </div>

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
          justifyContent: space-between;
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

        .btn-toolbar-print {
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

        .kop-table {
          width: 100%;
          border-collapse: collapse;
          border: none;
          margin-bottom: 4px;
        }
        .kop-table td {
          border: none;
          line-height: 1.25;
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
          border: 1px solid #222222;
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
        }
      `}</style>
    </div>
  );
}
