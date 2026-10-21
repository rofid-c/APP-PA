'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function SidebarNav({ role, onNavigate }) {
  const pathname = usePathname();
  const router = useRouter();
  const [divisiList, setDivisiList] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [kesekretariatanOpen, setKesekretariatanOpen] = useState(pathname.startsWith('/kesekretariatan'));

  useEffect(() => {
    fetch('/api/divisi')
      .then((r) => r.json())
      .then((data) => setDivisiList(data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (role !== 'admin') return;

    function loadPendingCount() {
      fetch('/api/users?status=pending')
        .then((r) => r.json())
        .then((data) => setPendingCount((data.data || []).length))
        .catch(() => {});
    }

    loadPendingCount();
    window.addEventListener('pending-akun-berubah', loadPendingCount);
    return () => window.removeEventListener('pending-akun-berubah', loadPendingCount);
  }, [role, pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  function handleClick() {
    if (onNavigate) onNavigate();
  }

  const isActive = (href) => pathname === href;

  return (
    <nav>
      <a href="/dashboard" className={isActive('/dashboard') ? 'active' : ''} onClick={handleClick}>
        <span>🏠</span>
        <span className="label">Dashboard</span>
      </a>
      <a href="/cari" className={pathname.startsWith('/cari') ? 'active' : ''} onClick={handleClick}>
        <span>🔍</span>
        <span className="label">Arsip Perkara</span>
      </a>

      <a
        onClick={() => setKesekretariatanOpen((v) => !v)}
        style={{ cursor: 'pointer', justifyContent: 'space-between' }}
        className={pathname.startsWith('/kesekretariatan') && !kesekretariatanOpen ? 'active' : ''}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>📂</span>
          <span className="label">Arsip Kesekretariatan</span>
        </span>
        <span className="label" style={{ fontSize: 11, opacity: 0.8 }}>{kesekretariatanOpen ? '▾' : '▸'}</span>
      </a>
      {kesekretariatanOpen && (
        <div style={{ marginLeft: 14 }}>
          {divisiList.map((d) => (
            <a
              key={d.id}
              href={`/kesekretariatan/${d.slug}`}
              className={pathname === `/kesekretariatan/${d.slug}` ? 'active' : ''}
              onClick={handleClick}
              style={{ fontSize: 13, padding: '9px 14px' }}
            >
              <span>–</span>
              <span className="label">{d.nama}</span>
            </a>
          ))}
          {divisiList.length === 0 && (
            <div className="label" style={{ fontSize: 12, opacity: 0.7, padding: '6px 14px' }}>Belum ada divisi</div>
          )}
        </div>
      )}

      <a
        href="/laporan"
        className={pathname.startsWith('/laporan') || pathname.startsWith('/kinerja') ? 'active' : ''}
        onClick={handleClick}
      >
        <span>📊</span>
        <span className="label">Laporan & Kinerja</span>
      </a>

      {role !== 'staf_umum' && (
        <a href="/log-aktivitas" className={isActive('/log-aktivitas') ? 'active' : ''} onClick={handleClick}>
          <span>📋</span>
          <span className="label">Log Aktivitas</span>
        </a>
      )}

      <a
        href="/pengaturan"
        className={isActive('/pengaturan') ? 'active' : ''}
        onClick={handleClick}
        style={{ justifyContent: 'space-between' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>⚙️</span>
          <span className="label">Pengaturan</span>
        </span>
        {role === 'admin' && pendingCount > 0 && (
          <span
            className="label"
            style={{
              background: '#e5484d', color: 'white', fontSize: 11, fontWeight: 700,
              borderRadius: 999, minWidth: 20, height: 20, padding: '0 6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {pendingCount}
          </span>
        )}
      </a>

      {role === 'admin' && (
        <a href="/bantuan" className={isActive('/bantuan') ? 'active' : ''} onClick={handleClick}>
          <span>❓</span>
          <span className="label">Bantuan</span>
        </a>
      )}

      <a onClick={handleLogout} style={{ marginTop: 12, color: '#ffc2c2', cursor: 'pointer' }}>
        <span>🚪</span>
        <span className="label">Logout</span>
      </a>
    </nav>
  );
}
