'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [namaLengkap, setNamaLengkap] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namaLengkap, username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal membuat akun.');
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError('Terjadi kesalahan jaringan.');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="login-page">
        <div className="login-box" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Akun berhasil dibuat</div>
          <p style={{ color: '#667', fontSize: 14, marginBottom: 20 }}>
            Akun kamu masih menunggu verifikasi admin sebelum bisa dipakai untuk login. Hubungi admin untuk mempercepat proses verifikasi.
          </p>
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => router.push('/login')}>
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--hijau-tua)' }}>BANK DATA DIGITAL</div>
          <div style={{ color: '#667', fontSize: 13, marginTop: 4 }}>Buat Akun Baru</div>
        </div>
        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Nama Lengkap</label>
          <input
            className="input-field"
            value={namaLengkap}
            onChange={(e) => setNamaLengkap(e.target.value)}
            placeholder="Masukkan nama lengkap"
            style={{ marginBottom: 14 }}
            required
          />
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Username</label>
          <input
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Masukkan username"
            style={{ marginBottom: 14 }}
            required
          />
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Password</label>
          <input
            className="input-field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            style={{ marginBottom: 8 }}
            required
          />
          {error && <div className="error-text">{error}</div>}
          <button className="btn-primary" style={{ width: '100%', marginTop: 18 }} disabled={loading}>
            {loading ? 'Memproses...' : 'Buat Akun'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#667' }}>
          Sudah punya akun? <a href="/login" style={{ color: 'var(--hijau-tua)', fontWeight: 600 }}>Login di sini</a>
        </div>
      </div>
    </div>
  );
}
