'use client';
import { useEffect, useState } from 'react';
import { formatTanggalWaktu } from '../../lib/formatDate';

const ROLE_OPTIONS = [
  { value: 'petugas', label: 'Petugas' },
  { value: 'staf_umum', label: 'Peninjau' },
  { value: 'admin', label: 'Admin' },
];

export default function VerifikasiAkun() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleTerpilih, setRoleTerpilih] = useState({}); // { [id]: role }

  function load() {
    setLoading(true);
    fetch('/api/users?status=pending')
      .then((r) => r.json())
      .then((data) => {
        setList(data.data || []);
        setLoading(false);
      });
  }

  useEffect(load, []);

  async function handleVerifikasi(user) {
    const role = roleTerpilih[user.id] || 'petugas';
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, status: 'aktif' }),
      });
      const data = await res.json();
      if (res.ok) {
        load();
        window.dispatchEvent(new Event('pending-akun-berubah'));
      } else {
        alert(data.error || 'Gagal memverifikasi akun.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan atau server.');
    }
  }

  async function handleTolak(user) {
    if (!confirm(`Tolak pendaftaran ${user.namaLengkap}? Akun akan dihapus permanen.`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        load();
        window.dispatchEvent(new Event('pending-akun-berubah'));
      } else {
        alert(data.error || 'Gagal menolak pendaftaran.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan atau server.');
    }
  }

  return (
    <div className="stitch-card" style={{ marginBottom: 28 }}>
      {/* Header Otorisasi Akun (Stitch Card 3) */}
      <div className="stitch-card-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#fef7e7',
              color: '#b5680a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>admin_panel_settings</span>
          </div>
          <div>
            <h2 className="stitch-card-title">Otorisasi & Verifikasi Akun Baru</h2>
            <p className="stitch-card-subtitle">
              Persetujuan hak akses calon aparatur sebelum dapat masuk ke sistem
            </p>
          </div>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: 999,
            background: list.length > 0 ? '#ffdad6' : '#eaf7ed',
            color: list.length > 0 ? '#93000a' : 'var(--hijau)',
          }}
        >
          {list.length > 0 ? `${list.length} Pending Persetujuan` : 'Semua Akun Terverifikasi'}
        </span>
      </div>

      {/* Daftar User Pending */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((u) => (
          <div
            key={u.id}
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: '#f4f6f5',
              border: '1px solid #e2e6e4',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--hijau-container)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {u.namaLengkap ? u.namaLengkap.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--hijau-tua)', fontSize: 14 }}>
                    {u.namaLengkap}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--teks-muted)', marginTop: 2 }}>
                    NIP / Username: <strong style={{ color: 'var(--teks)' }}>{u.username}</strong> • Mendaftar: {formatTanggalWaktu(u.createdAt)}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: '#ffdad6',
                  color: '#93000a',
                  padding: '3px 8px',
                  borderRadius: 6,
                }}
              >
                Menunggu Konfirmasi
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
                paddingTop: 8,
                borderTop: '1px solid #e5ebe7',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 200 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teks-muted)' }}>Tetapkan Role:</span>
                <select
                  className="dashboard-select"
                  style={{ padding: '6px 28px 6px 10px', fontSize: 12, flex: 1 }}
                  value={roleTerpilih[u.id] || 'petugas'}
                  onChange={(e) => setRoleTerpilih({ ...roleTerpilih, [u.id]: e.target.value })}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{
                    background: 'var(--hijau-terang)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    fontSize: 12,
                  }}
                  onClick={() => handleVerifikasi(u)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                  <span>Setujui Akun</span>
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    fontSize: 12,
                  }}
                  onClick={() => handleTolak(u)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>cancel</span>
                  <span>Tolak</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && list.length === 0 && (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              background: '#f4f6f5',
              borderRadius: 10,
              border: '1px dashed #dce8e1',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#e6f7ee',
                color: 'var(--hijau)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>verified_user</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--hijau-tua)', marginBottom: 4 }}>
              Tidak Ada Pendaftaran Tertunda
            </div>
            <div style={{ fontSize: 12, color: 'var(--teks-muted)' }}>
              Semua aparatur yang mendaftar telah diverifikasi dan memiliki akses aktif.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
