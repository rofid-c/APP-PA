'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DigitalSignaturePad from '../../components/DigitalSignaturePad';

export default function PresensiPublicPage() {
  const params = useParams();
  const rapatId = params.id;

  const [rapat, setRapat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorRapat, setErrorRapat] = useState('');

  // Form State
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [instansi, setInstansi] = useState('Pengadilan Agama Gunung Sugih');
  const [ttdData, setTtdData] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (!rapatId) return;
    setLoading(true);
    fetch(`/api/presensi/${rapatId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setRapat(res.data);
        } else {
          setErrorRapat(res.error || 'Informasi rapat tidak ditemukan.');
        }
      })
      .catch((err) => {
        setErrorRapat('Gagal menghubungkan ke server.');
      })
      .finally(() => setLoading(false));
  }, [rapatId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!nama.trim()) {
      setFormError('Nama lengkap wajib diisi.');
      return;
    }
    if (!jabatan.trim()) {
      setFormError('Jabatan / Unit kerja wajib diisi.');
      return;
    }
    if (!ttdData) {
      setFormError('Tanda tangan digital belum dibubuhkan.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/presensi/${rapatId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: nama.trim(),
          jabatan: jabatan.trim(),
          instansi: instansi.trim(),
          ttdData,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Gagal menyimpan kehadiran.');
      } else {
        setSuccessData(data);
      }
    } catch (err) {
      setFormError('Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #072a1e 0%, #0f4d3a 180px, #f4f6f5 180px, #f4f6f5 100%)',
        padding: '16px 14px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'var(--font-sans, sans-serif)',
      }}
    >
      {/* Header Lembaga */}
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center', color: 'white', marginBottom: 14 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
            <img src="/logo-pa.svg" alt="Logo PA" style={{ width: 30, height: 30 }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.2 }}>PENGADILAN AGAMA GUNUNG SUGIH</div>
            <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 500 }}>Presensi Rapat Digital & Tanda Tangan</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, width: '100%' }}>
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: 14 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
            <div style={{ color: '#556', fontSize: 14 }}>Memuat informasi rapat...</div>
          </div>
        ) : errorRapat ? (
          <div className="card" style={{ textAlign: 'center', padding: '36px 20px', borderRadius: 14, borderLeft: '4px solid #c53030' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#c53030', marginBottom: 6 }}>Informasi Tidak Tersedia</div>
            <div style={{ color: '#556', fontSize: 14 }}>{errorRapat}</div>
          </div>
        ) : successData ? (
          /* TAMPILAN SUKSES SETELAH PRESENSI */
          <div className="card" style={{ padding: '28px 22px', borderRadius: 14, textAlign: 'center', boxShadow: '0 8px 24px rgba(15,77,58,0.1)' }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: '#e6f7ee',
                color: '#136b4e',
                fontSize: 34,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
                boxShadow: '0 4px 12px rgba(19,107,78,0.15)',
              }}
            >
              ✓
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f4d3a', margin: '0 0 6px' }}>Kehadiran Berhasil Dicatat!</h2>
            <p style={{ fontSize: 13.5, color: '#5a6b62', margin: '0 0 20px' }}>
              Terima kasih, data kehadiran dan tanda tangan digital Anda telah tersimpan secara resmi dalam sistem.
            </p>

            <div
              style={{
                background: '#f8faf9',
                border: '1px solid #e2e6e4',
                borderRadius: 12,
                padding: '16px',
                textAlign: 'left',
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#707974', marginBottom: 10, letterSpacing: 0.5 }}>
                Tanda Bukti Presensi
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: '#707974' }}>Nama:</span>
                <span style={{ fontWeight: 700, color: '#131e18' }}>{successData.nama}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: '#707974' }}>Jabatan:</span>
                <span style={{ fontWeight: 600, color: '#131e18' }}>{successData.jabatan}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: '#707974' }}>Rapat:</span>
                <span style={{ fontWeight: 600, color: '#0f4d3a', textAlign: 'right', maxWidth: '65%' }}>{rapat.judul}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px dashed #e2e6e4', paddingTop: 6, marginTop: 6 }}>
                <span style={{ color: '#707974' }}>Kode Barcode:</span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#136b4e' }}>{successData.barcodeData}</span>
              </div>

              {/* QR Bukti */}
              {successData.qrBukti && (
                <div style={{ textAlign: 'center', marginTop: 14 }}>
                  <img src={successData.qrBukti} alt="QR Bukti" style={{ width: 130, height: 130, borderRadius: 8, border: '1px solid #e2e6e4' }} />
                  <div style={{ fontSize: 11, color: '#889', marginTop: 4 }}>ID: {successData.barcodeData}</div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setSuccessData(null);
                setNama('');
                setJabatan('');
                setTtdData(null);
              }}
              className="btn-secondary"
              style={{ width: '100%', padding: '11px', fontSize: 14 }}
            >
              Isi Presensi untuk Peserta Lain
            </button>
          </div>
        ) : (
          /* FORM PRESENSI */
          <div className="card" style={{ padding: '22px 18px', borderRadius: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            {/* Info Rapat */}
            <div
              style={{
                background: '#eef6f1',
                borderLeft: '4px solid #146c4f',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#146c4f', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                Agenda Rapat Dinas
              </div>
              <h1 style={{ fontSize: 16, fontWeight: 800, color: '#0f4d3a', margin: '0 0 6px', lineHeight: 1.35 }}>
                {rapat.judul}
              </h1>
              <div style={{ fontSize: 12.5, color: '#334', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div>📅 <strong>Tanggal:</strong> {rapat.tanggal} {rapat.waktuMulai ? `• ${rapat.waktuMulai} ${rapat.waktuSelesai ? `- ${rapat.waktuSelesai}` : ''} WIB` : ''}</div>
                {rapat.tempat && <div>📍 <strong>Tempat:</strong> {rapat.tempat}</div>}
                {rapat.pimpinanRapat && <div>👤 <strong>Pimpinan:</strong> {rapat.pimpinanRapat}</div>}
              </div>
            </div>

            {formError && (
              <div
                style={{
                  background: '#fff0f0',
                  color: '#c53030',
                  border: '1px solid #f5c6c6',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>⚠️</span> {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f4d3a', marginBottom: 5 }}>
                  Nama Lengkap Peserta <span style={{ color: '#c53030' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: Drs. H. Ahmad Fauzi, M.H."
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f4d3a', marginBottom: 5 }}>
                  Jabatan / Unit Kerja <span style={{ color: '#c53030' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: Hakim / Panitera / Kasubbag / Staf"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f4d3a', marginBottom: 5 }}>
                  Instansi / Satuan Kerja
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={instansi}
                  onChange={(e) => setInstansi(e.target.value)}
                />
              </div>

              {/* Pad Tanda Tangan Digital */}
              <div style={{ marginBottom: 22 }}>
                <DigitalSignaturePad
                  onChange={(dataUrl) => setTtdData(dataUrl)}
                  height={180}
                  label="Tanda Tangan Digital Kehadiran"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  fontSize: 15,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderRadius: 10,
                  boxShadow: '0 4px 12px rgba(15,77,58,0.25)',
                }}
              >
                {submitting ? (
                  <>
                    <span>⏳</span> Menyimpan Kehadiran...
                  </>
                ) : (
                  <>
                    <span>✍️</span> Kirim Presensi Sekarang
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      <div style={{ marginTop: 22, fontSize: 12, color: '#707974', textAlign: 'center' }}>
        Bank Data Digital • Pengadilan Agama Gunung Sugih
      </div>
    </div>
  );
}

