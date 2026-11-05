'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

function formatWaktu(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  } catch {
    return isoString;
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
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat dokumen daftar hadir...</div>;
  }

  if (!data) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>Data rapat tidak ditemukan.</div>;
  }

  return (
    <div style={{ background: '#f0f2f1', minHeight: '100vh', padding: '24px 16px' }}>
      {/* Tombol Cetak / Kontrol */}
      <div
        className="no-print"
        style={{
          maxWidth: 820,
          margin: '0 auto 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'white',
          padding: '12px 18px',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          fontFamily: 'sans-serif',
        }}
      >
        <button
          type="button"
          onClick={() => window.close()}
          style={{
            background: '#f4f6f5',
            color: '#334',
            border: '1px solid #ccc',
            padding: '8px 14px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ✕ Tutup Jendela
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              background: '#0f4d3a',
              color: 'white',
              border: 'none',
              padding: '9px 20px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>🖨️</span> Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* Lembar Dokumen Resmi Format Kedinasan Peradilan */}
      <div
        className="print-sheet"
        style={{
          maxWidth: 820,
          margin: '0 auto',
          background: 'white',
          padding: '40px 48px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          color: '#000000',
          fontFamily: "'Times New Roman', Times, serif",
          lineHeight: 1.3,
        }}
      >
        {/* KOP SURAT RESMI */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, borderBottom: '3px double #000000', paddingBottom: 12, marginBottom: 20 }}>
          <img src="/logo-pa.svg" alt="Logo PA" style={{ width: 68, height: 68 }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
              PENGADILAN TINGGI AGAMA BANDAR LAMPUNG
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>
              PENGADILAN AGAMA GUNUNG SUGIH KELAS I B
            </div>
            <div style={{ fontSize: 11, fontFamily: 'Arial, sans-serif', marginTop: 4 }}>
              Jl. Lintas Sumatera KM 60, Gunung Sugih, Kabupaten Lampung Tengah, Lampung 34161
            </div>
            <div style={{ fontSize: 10.5, fontFamily: 'Arial, sans-serif' }}>
              Website: www.pa-gunungsugih.go.id • Email: pa.gunungsugih@gmail.com
            </div>
          </div>
        </div>

        {/* JUDUL DOKUMEN */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 800, textDecoration: 'underline', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            DAFTAR HADIR PESERTA RAPAT
          </div>
        </div>

        {/* INFORMASI RAPAT */}
        <div style={{ marginBottom: 18, fontSize: 12.5, fontFamily: 'Arial, sans-serif' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: 140, padding: '3px 0', fontWeight: 600 }}>Agenda Rapat</td>
                <td style={{ width: 15, padding: '3px 0' }}>:</td>
                <td style={{ padding: '3px 0', fontWeight: 700 }}>{data.judul}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', fontWeight: 600 }}>Hari / Tanggal</td>
                <td style={{ padding: '3px 0' }}>:</td>
                <td style={{ padding: '3px 0' }}>{data.tanggal}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', fontWeight: 600 }}>Waktu</td>
                <td style={{ padding: '3px 0' }}>:</td>
                <td style={{ padding: '3px 0' }}>{data.waktuMulai ? `${data.waktuMulai} - ${data.waktuSelesai || 'Selesai'} WIB` : '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', fontWeight: 600 }}>Tempat</td>
                <td style={{ padding: '3px 0' }}>:</td>
                <td style={{ padding: '3px 0' }}>{data.tempat || '-'}</td>
              </tr>
              {data.pimpinanRapat && (
                <tr>
                  <td style={{ padding: '3px 0', fontWeight: 600 }}>Pimpinan Rapat</td>
                  <td style={{ padding: '3px 0' }}>:</td>
                  <td style={{ padding: '3px 0' }}>{data.pimpinanRapat}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TABEL DAFTAR HADIR */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 11.5,
            fontFamily: 'Arial, sans-serif',
            marginBottom: 24,
          }}
        >
          <thead>
            <tr style={{ background: '#f2f2f2', textAlign: 'center' }}>
              <th style={{ border: '1px solid #000', padding: '8px 4px', width: 35 }}>NO</th>
              <th style={{ border: '1px solid #000', padding: '8px 8px', textAlign: 'left' }}>NAMA LENGKAP & NIP</th>
              <th style={{ border: '1px solid #000', padding: '8px 8px', textAlign: 'left', width: 200 }}>JABATAN</th>
              <th style={{ border: '1px solid #000', padding: '8px 4px', width: 90 }}>WAKTU HADIR</th>
              <th style={{ border: '1px solid #000', padding: '8px 6px', width: 140 }}>TANDA TANGAN</th>
            </tr>
          </thead>
          <tbody>
            {(!data.presensi || data.presensi.length === 0) ? (
              <tr>
                <td colSpan={5} style={{ border: '1px solid #000', padding: '24px', textAlign: 'center', fontStyle: 'italic', color: '#666' }}>
                  Belum ada catatan presensi kehadiran peserta.
                </td>
              </tr>
            ) : (
              data.presensi.map((p, idx) => (
                <tr key={p.id}>
                  <td style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center' }}>
                    {idx + 1}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px' }}>
                    <div style={{ fontWeight: 700 }}>{p.nama}</div>
                    {p.nip && <div style={{ fontSize: 10.5, color: '#444' }}>NIP. {p.nip}</div>}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px' }}>
                    {p.jabatan}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center', fontSize: 11 }}>
                    {formatWaktu(p.waktuHadir)}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>
                    {p.ttdData ? (
                      <img
                        src={p.ttdData}
                        alt="TTD"
                        style={{ height: 38, maxWidth: 110, objectFit: 'contain', display: 'block', margin: '0 auto' }}
                      />
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* KOLOM TANDA TANGAN PIMPINAN RAPAT */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 30, fontSize: 12, fontFamily: 'Arial, sans-serif' }}>
          <div style={{ textAlign: 'center', width: 260 }}>
            <div>Gunung Sugih, {data.tanggal}</div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>
              {data.pimpinanRapat ? `Pimpinan Rapat,` : `Mengetahui,`}
            </div>
            <div style={{ height: 70 }} />
            <div style={{ fontWeight: 700, textDecoration: 'underline' }}>
              {data.pimpinanRapat || '...........................................'}
            </div>
            <div>NIP. ...........................................</div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-sheet {
            box-shadow: none !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

