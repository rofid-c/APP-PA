'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function CetakQrMejaPage() {
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
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat data lembar QR...</div>;
  }

  if (!data) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>Data rapat tidak ditemukan.</div>;
  }

  return (
    <div style={{ background: '#f0f2f1', minHeight: '100vh', padding: '24px 16px' }}>
      {/* Tombol Cetak (Tidak tercetak saat diprint) */}
      <div
        className="no-print"
        style={{
          maxWidth: 680,
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
          <span>🖨️</span> Cetak Lembar Meja (A4)
        </button>
      </div>

      {/* Lembar A4 Cetak */}
      <div
        className="print-sheet"
        style={{
          maxWidth: 680,
          margin: '0 auto',
          background: 'white',
          padding: '40px 36px',
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          textAlign: 'center',
          fontFamily: 'Georgia, serif',
          color: '#112',
          border: '1px solid #dcdfdc',
        }}
      >
        {/* Kop PA Gunung Sugih */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, borderBottom: '2.5px solid #0f4d3a', paddingBottom: 16, marginBottom: 24 }}>
          <img src="/logo-pa.svg" alt="Logo PA" style={{ width: 62, height: 62 }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#334' }}>
              Mahkamah Agung Republik Indonesia
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#0f4d3a', letterSpacing: 0.5, marginTop: 2 }}>
              PENGADILAN AGAMA GUNUNG SUGIH
            </div>
            <div style={{ fontSize: 11.5, color: '#556', marginTop: 2, fontFamily: 'sans-serif' }}>
              Sistem Informasi Presensi & Manajemen Rapat Kedinasan
            </div>
          </div>
        </div>

        {/* Judul Lembar */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'inline-block',
              background: '#0f4d3a',
              color: 'white',
              fontSize: 13,
              fontWeight: 800,
              padding: '6px 18px',
              borderRadius: 20,
              letterSpacing: 1,
              fontFamily: 'sans-serif',
              marginBottom: 12,
            }}
          >
            PRESENSI KEHADIRAN PESERTA RAPAT
          </div>

          <h1 style={{ fontSize: 21, fontWeight: 800, color: '#0f4d3a', margin: '0 0 10px', lineHeight: 1.35 }}>
            {data.judul}
          </h1>

          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 13,
              fontFamily: 'sans-serif',
              color: '#334',
              background: '#f8faf9',
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #e2e6e4',
            }}
          >
            <div>📅 <strong>Hari/Tanggal:</strong> {data.tanggal}</div>
            {data.waktuMulai && <div>⏰ <strong>Waktu:</strong> {data.waktuMulai} {data.waktuSelesai ? `- ${data.waktuSelesai}` : ''} WIB</div>}
            {data.tempat && <div>📍 <strong>Tempat:</strong> {data.tempat}</div>}
          </div>
        </div>

        {/* QR Code Container */}
        <div
          style={{
            margin: '20px auto',
            padding: '20px',
            border: '3px solid #0f4d3a',
            borderRadius: 16,
            width: 'fit-content',
            background: 'white',
            boxShadow: '0 4px 12px rgba(15,77,58,0.1)',
          }}
        >
          <img
            src={`/api/rapat/${id}/qrcode`}
            alt="QR Presensi Rapat"
            style={{ width: 280, height: 280, display: 'block' }}
          />
        </div>

        {/* Instruksi Pengisian */}
        <div style={{ fontFamily: 'sans-serif', maxWidth: 460, margin: '0 auto 20px' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0f4d3a', marginBottom: 6 }}>
            📱 SCAN UNTUK MENGISI DAFTAR HADIR
          </div>
          <p style={{ fontSize: 13, color: '#445', lineHeight: 1.5, margin: 0 }}>
            1. Buka kamera ponsel Anda dan arahkan ke QR Code di atas.<br />
            2. Isi Nama, NIP, dan Jabatan Anda.<br />
            3. Bubuhkan Tanda Tangan Digital pada layar ponsel, lalu klik Kirim.
          </p>
        </div>

        <div style={{ borderTop: '1px dashed #ccc', paddingTop: 14, fontSize: 11, color: '#778', fontFamily: 'sans-serif' }}>
          Dicetak melalui Aplikasi Bank Data Digital • Pengadilan Agama Gunung Sugih
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
            border: none !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

