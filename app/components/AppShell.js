'use client';
import { useState } from 'react';
import SidebarNav from './SidebarNav';
import Avatar from './Avatar';

export default function AppShell({ user, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const { role, namaLengkap } = user;

  return (
    <div className="app-shell">
      <button
        className="mobile-menu-btn"
        onClick={() => setIsOpen(true)}
        aria-label="Buka menu"
      >
        ☰
      </button>

      {isOpen && <div className="sidebar-backdrop" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="logo-area">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src="/logo-pa.svg" alt="Logo Pengadilan Agama" style={{ width: 26, height: 26 }} />
              </div>
              <div>
                <div>BANK DATA DIGITAL</div>
                <div style={{ fontWeight: 400, fontSize: 12, opacity: 0.85 }}>PA Gunung Sugih</div>
              </div>
            </div>
            <button className="sidebar-close-btn" onClick={() => setIsOpen(false)} aria-label="Tutup menu">
              ✕
            </button>
          </div>
        </div>
        <SidebarNav role={role} onNavigate={() => setIsOpen(false)} />
        <div className="user-area">
          <div className="avatar-name-row">
            <Avatar user={user} size={36} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{namaLengkap}</div>
              <div style={{ opacity: 0.85, textTransform: 'capitalize', fontSize: 12 }}>{role.replace('_', ' ')}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-content">{children}</div>
    </div>
  );
}
