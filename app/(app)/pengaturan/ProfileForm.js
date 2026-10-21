'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileForm({ initialData }) {
  const router = useRouter();
  const [namaLengkap, setNamaLengkap] = useState(initialData.namaLengkap);
  const [username, setUsername] = useState(initialData.username);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namaLengkap, username, password: password || undefined }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Gagal menyimpan perubahan.');
      return;
    }
    setSuccess('Profil berhasil diperbarui.');
    setPassword('');
    router.refresh();
  }

  return (
    <div className="stitch-card" style={{ maxWidth: 520, marginBottom: 28 }}>
      <div className="stitch-card-header" style={{ marginBottom: 16 }}>
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
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>manage_accounts</span>
          </div>
          <div>
            <h2 className="stitch-card-title">Informasi Akun Pribadi</h2>
            <p className="stitch-card-subtitle">Perbarui identitas dan kata sandi login Anda</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6, color: 'var(--teks-muted)' }}>
            Nama Lengkap & Gelar *
          </label>
          <input
            className="input-field"
            value={namaLengkap}
            onChange={(e) => setNamaLengkap(e.target.value)}
            style={{ background: '#ffffff', border: '1px solid #e2e6e4', borderRadius: 8 }}
            required
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6, color: 'var(--teks-muted)' }}>
            NIP / Username *
          </label>
          <input
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ background: '#ffffff', border: '1px solid #e2e6e4', borderRadius: 8 }}
            required
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6, color: 'var(--teks-muted)' }}>
            Password Baru (kosongkan jika tidak ingin diubah)
          </label>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter unik..."
            style={{ background: '#ffffff', border: '1px solid #e2e6e4', borderRadius: 8 }}
          />
        </div>

        {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
        {success && (
          <div
            style={{
              color: '#135c36',
              background: '#eafaf1',
              border: '1px solid #a3e6be',
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
            <span>{success}</span>
          </div>
        )}

        <button
          className="btn-primary"
          disabled={loading}
          style={{
            background: 'var(--hijau-terang)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 18px',
            fontSize: 13,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
          <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan Akun'}</span>
        </button>
      </form>
    </div>
  );
}
