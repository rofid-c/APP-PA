'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login gagal.');
        setLoading(false);
        return;
      }
      window.location.href = '/dashboard';
    } catch {
      setError('Terjadi kesalahan jaringan.');
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/logo-pa.svg" alt="Logo Pengadilan Agama" style={{ width: 64, height: 64, marginBottom: 10 }} />
          <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--hijau-tua)' }}>BANK DATA DIGITAL</div>
          <div style={{ color: '#667', fontSize: 13, marginTop: 4 }}>Pengadilan Agama Gunung Sugih</div>
        </div>
        <form onSubmit={handleSubmit}>
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
            placeholder="Masukkan password"
            style={{ marginBottom: 8 }}
            required
          />
          {error && <div className="error-text">{error}</div>}
          <button className="btn-primary" style={{ width: '100%', marginTop: 18 }} disabled={loading}>
            {loading ? 'Memproses...' : '🔒 Login'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#667' }}>
          Belum punya akun? <a href="/register" style={{ color: 'var(--hijau-tua)', fontWeight: 600 }}>Buat Akun</a>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#889' }}>
          Lupa password? Silahkan hubungi admin.
        </div>
      </div>
    </div>
  );
}
