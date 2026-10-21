'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProfileForm from './ProfileForm';
import AvatarPicker from './AvatarPicker';
import JenisPerkaraList from './JenisPerkaraList';
import DivisiList from './DivisiList';
import JenisKesekretariatanList from './JenisKesekretariatanList';
import JenisLaporanList from './JenisLaporanList';
import VerifikasiAkun from './VerifikasiAkun';
import UserList from './UserList';
import KelolaKinerja from './KelolaKinerja';
import GoogleDriveSettings from './GoogleDriveSettings';

export default function PengaturanTabs({ role, currentUserId, initialProfile, sessionUser }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendingCount, setPendingCount] = useState(0);

  // Pantau jumlah pendaftaran pending secara live
  useEffect(() => {
    function checkPending() {
      fetch('/api/users?status=pending')
        .then((r) => r.json())
        .then((data) => setPendingCount((data.data || []).length))
        .catch(() => {});
    }
    checkPending();
    window.addEventListener('pending-akun-berubah', checkPending);
    return () => window.removeEventListener('pending-akun-berubah', checkPending);
  }, []);

  // Struktur 2 tingkat: kategori dulu, baru sub-tab di dalamnya.
  const categories = [];

  const masterItems = [];
  if (role !== 'staf_umum') {
    masterItems.push({ key: 'jenis-perkara', label: 'Jenis Perkara', render: <JenisPerkaraList /> });
    masterItems.push({ key: 'jenis-kesekretariatan', label: 'Kesekretariatan', render: <JenisKesekretariatanList /> });
    masterItems.push({ key: 'jenis-laporan', label: 'Jenis Laporan', render: <JenisLaporanList /> });
  }
  if (role === 'admin') {
    masterItems.push({ key: 'divisi', label: 'Divisi / Bagian', render: <DivisiList /> });
  }
  if (masterItems.length > 0) {
    categories.push({
      key: 'master',
      label: 'Data Master',
      icon: 'dataset',
      items: masterItems,
    });
  }

  if (role === 'admin') {
    categories.push({
      key: 'kinerja',
      label: 'Kinerja & Sasaran',
      icon: 'tune',
      items: [{ key: 'kinerja', label: 'Kinerja & Sasaran', render: <KelolaKinerja /> }],
    });
  }

  const akunItems = [];
  if (role === 'admin') {
    akunItems.push({ key: 'verifikasi', label: 'Verifikasi Akun', render: <VerifikasiAkun /> });
    akunItems.push({ key: 'pengguna', label: 'Kelola Pengguna', render: <UserList currentUserId={currentUserId} /> });
  }
  if (akunItems.length > 0) {
    categories.push({
      key: 'akun',
      label: 'Kelola Akun & Hak Akses',
      icon: 'badge',
      items: akunItems,
    });
  }

  if (role === 'admin') {
    categories.push({
      key: 'gdrive',
      label: 'Google Drive Cloud',
      icon: 'cloud',
      items: [{ key: 'gdrive', label: 'Sinkronisasi Cloud', render: <GoogleDriveSettings /> }],
    });
  }

  categories.push({
    key: 'profil',
    label: 'Profil Saya',
    icon: 'person_pin',
    items: [{
      key: 'profil',
      label: 'Profil Saya',
      render: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, alignItems: 'start' }}>
          <ProfileForm initialData={initialProfile} />
          <AvatarPicker user={sessionUser} onUpdated={() => router.refresh()} />
        </div>
      ),
    }],
  });

  // Kalau ada ?tab= di URL, cari kategori yang memuat sub-tab itu dan langsung buka ke situ.
  const requestedTab = searchParams.get('tab');
  let initialCategoryKey = categories[0].key;
  let initialItemKey = categories[0].items[0].key;
  for (const cat of categories) {
    if (cat.items.some((i) => i.key === requestedTab)) {
      initialCategoryKey = cat.key;
      initialItemKey = requestedTab;
      break;
    }
  }

  const [activeCategory, setActiveCategory] = useState(initialCategoryKey);
  const [activeItem, setActiveItem] = useState(initialItemKey);

  const currentCategory = categories.find((c) => c.key === activeCategory) || categories[0];
  const currentItem = currentCategory.items.find((i) => i.key === activeItem) || currentCategory.items[0];

  function handleSelectCategory(cat) {
    if (cat.key === activeCategory) return;
    setActiveCategory(cat.key);
    setActiveItem(cat.items[0].key);
  }

  return (
    <div>
      {/* Tab Navigation Utama Stitch */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '6px',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
      >
        {categories.map((c) => {
          const isActive = activeCategory === c.key;
          return (
            <button
              key={c.key}
              onClick={() => handleSelectCategory(c)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                background: isActive ? 'var(--hijau-tua)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--teks-muted)',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#f0fdf3';
                  e.currentTarget.style.color = 'var(--teks)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--teks-muted)';
                }
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: isActive ? '#ffffff' : 'var(--hijau)' }}
              >
                {c.icon}
              </span>
              <span>{c.label}</span>
              {c.key === 'akun' && pendingCount > 0 && (
                <span
                  style={{
                    background: '#ffdad6',
                    color: '#93000a',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  {pendingCount} Pending
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-tab Pills (Jika ada lebih dari 1 item di kategori aktif) */}
      {currentCategory.items.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            marginBottom: 20,
            paddingBottom: 4,
          }}
        >
          {currentCategory.items.map((i) => {
            const isActive = activeItem === i.key;
            return (
              <button
                key={i.key}
                onClick={() => setActiveItem(i.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  background: isActive ? 'var(--hijau-container)' : '#eaf7ed',
                  color: isActive ? '#ffffff' : '#304a3e',
                }}
              >
                <span>{i.label}</span>
                {i.key === 'verifikasi' && pendingCount > 0 && (
                  <span
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.25)' : '#ffdad6',
                      color: isActive ? '#ffffff' : '#93000a',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 999,
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Konten Tab Aktif */}
      <div>
        {currentItem.render}
      </div>
    </div>
  );
}
