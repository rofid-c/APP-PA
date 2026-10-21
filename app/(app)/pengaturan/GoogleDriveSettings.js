'use client';
import { useState, useEffect } from 'react';

export default function GoogleDriveSettings() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tested, setTested] = useState(false);

  async function checkStatus() {
    setLoading(true);
    try {
      const res = await fetch('/api/gdrive/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      setStatus({ configured: false, ok: false, error: 'Gagal menghubungi server status' });
    }
    setLoading(false);
    setTested(true);
  }

  useEffect(() => {
    checkStatus();
  }, []);

  const folderUrl = `https://drive.google.com/drive/folders/${status?.folderId || '1TQ4uJrd64oMTTbncXQUWfC4LQgSCaRui'}`;

  return (
    <div className="stitch-card" style={{ maxWidth: 840, marginBottom: 28 }}>
      <div className="stitch-card-header" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#eaf7ed',
              color: 'var(--hijau)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>cloud_sync</span>
          </div>
          <div>
            <h2 className="stitch-card-title">Sinkronisasi Google Drive Cloud</h2>
            <p className="stitch-card-subtitle">
              Pencadangan otomatis setiap berkas PDF ke repositori Google Drive Pengadilan Agama
            </p>
          </div>
        </div>
        <button
          onClick={checkStatus}
          disabled={loading}
          className="btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            fontSize: 12,
          }}
        >
          <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`} style={{ fontSize: 16 }}>
            sync
          </span>
          <span>{loading ? 'Memeriksa...' : 'Uji Koneksi Cloud'}</span>
        </button>
      </div>

      {/* Target Folder Info */}
      <div
        style={{
          background: '#f4f6f5',
          border: '1px solid #e2e6e4',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teks-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
          Folder Tujuan Google Drive
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--hijau-tua)', background: '#ffffff', padding: '4px 10px', borderRadius: 6, border: '1px solid #dce8e1' }}>
            ID: {status?.folderId || '1TQ4uJrd64oMTTbncXQUWfC4LQgSCaRui'}
          </div>
          <a
            href={folderUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{
              background: 'var(--hijau-terang)',
              fontSize: 12,
              padding: '7px 14px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
            <span>Buka Folder di Google Drive</span>
          </a>
        </div>
      </div>

      {/* Status Box */}
      {tested && (
        <div style={{ marginBottom: 20 }}>
          {status?.ok ? (
            <div
              style={{
                background: '#eafaf1',
                border: '1px solid #a3e6be',
                borderRadius: 10,
                padding: '16px 18px',
                color: '#135c36',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#135c36' }}>check_circle</span>
                <span>Koneksi Google Drive Aktif & Terhubung Sempurna!</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                Aplikasi berhasil mengakses folder <strong>"{status.folderName}"</strong> menggunakan akun bot kredensial:
                <br />
                <code
                  style={{
                    background: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: '1px solid #bcead1',
                    fontSize: 12,
                    display: 'inline-block',
                    marginTop: 6,
                    color: '#0f4d3a',
                    fontWeight: 600,
                  }}
                >
                  {status.serviceAccountEmail}
                </code>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: '#fef7e7',
                border: '1px solid #f9d89c',
                borderRadius: 10,
                padding: '16px 18px',
                color: '#7a5105',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#b5680a' }}>warning</span>
                <span>Google Drive Belum Siap / Butuh Konfigurasi Kunci</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                {status?.error || status?.message}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Panduan Setup */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px 0', color: 'var(--hijau-tua)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--hijau)' }}>help_outline</span>
          <span>Petunjuk Menghubungkan Google Service Account:</span>
        </h3>
        <ol style={{ fontSize: 13, color: '#445', lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
          <li>
            Buka <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--hijau-terang)', fontWeight: 700, textDecoration: 'underline' }}>Google Cloud Console</a> dan aktifkan <strong>Google Drive API</strong>.
          </li>
          <li>
            Buat <strong>Service Account</strong> baru dan unduh kuncinya dalam format <strong>JSON</strong>.
          </li>
          <li>
            Beri nama file JSON tersebut: <code style={{ background: '#f4f6f5', padding: '2px 6px', borderRadius: 4, fontWeight: 600, border: '1px solid #e2e6e4' }}>google-service-account.json</code> lalu simpan di folder proyek aplikasi.
          </li>
          <li>
            <strong>PENTING:</strong> Buka folder Google Drive Anda, klik <strong>Bagikan (Share)</strong>, lalu masukkan email Service Account (contoh: <code>...@...iam.gserviceaccount.com</code>) sebagai <strong>Editor</strong>.
          </li>
          <li>
            Klik tombol <strong>Uji Koneksi Cloud</strong> di atas untuk memverifikasi kesiapan cadangan digital.
          </li>
        </ol>
      </div>
    </div>
  );
}
