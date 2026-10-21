const { getSession } = require('../../../lib/session');
const { redirect } = require('next/navigation');
import PengaturanTabs from './PengaturanTabs';

export default async function PengaturanPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="dashboard-container" style={{ padding: '24px 28px' }}>
      {/* Header Pengaturan Sistem Stitch */}
      <div className="dashboard-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="dashboard-badge-tag">
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>settings</span>
            PENGATURAN SISTEM • MANAJEMEN DATA & PENGGUNA
          </div>
          <h1 className="dashboard-title">Pengaturan Sistem</h1>
          <p className="dashboard-subtitle">
            Konfigurasi klasifikasi data master, sasaran kinerja & pejabat penandatangan, otorisasi aparatur, dan sinkronisasi cloud.
          </p>
        </div>

        <div className="dashboard-actions">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 999,
              background: '#e6f7ee',
              color: 'var(--hijau)',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--hijau-terang)',
                display: 'inline-block',
              }}
            ></span>
            <span>Sistem Operasional Normal</span>
          </div>
        </div>
      </div>

      <PengaturanTabs
        role={session.role}
        currentUserId={session.id}
        initialProfile={{ namaLengkap: session.namaLengkap, username: session.username }}
        sessionUser={session}
      />
    </div>
  );
}
