'use client';
import { useEffect, useState, useCallback } from 'react';

function splitTanggalWaktu(iso) {
  if (!iso) return { tanggal: '-', jam: '-' };
  try {
    const d = new Date(iso.replace(' ', 'T') + 'Z');
    const tanggal = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });
    const jam = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    });
    return { tanggal, jam: `${jam} WIB` };
  } catch {
    return { tanggal: iso, jam: '' };
  }
}

function getAksiBadge(aksi) {
  if (aksi?.startsWith('upload')) {
    let sub = 'Arsip';
    if (aksi.includes('kesekretariatan')) sub = 'Kesekretariatan';
    else if (aksi.includes('laporan')) sub = 'Laporan';
    return {
      label: `Upload ${sub}`,
      icon: 'cloud_upload',
      bg: '#e6f7ee',
      color: '#136b4e',
      border: '#cce5d6',
    };
  }
  if (aksi?.startsWith('hapus')) {
    let sub = 'Data';
    if (aksi.includes('arsip')) sub = 'Arsip';
    else if (aksi.includes('kesekretariatan')) sub = 'Kesekretariatan';
    else if (aksi.includes('laporan')) sub = 'Laporan';
    else if (aksi.includes('divisi')) sub = 'Divisi';
    else if (aksi.includes('perkara')) sub = 'Jenis Perkara';
    else if (aksi.includes('akun')) sub = 'Akun';
    return {
      label: `Hapus ${sub}`,
      icon: 'delete_forever',
      bg: '#fde8e8',
      color: '#9b1c1c',
      border: '#f8b4b4',
    };
  }
  if (aksi?.startsWith('ubah') || aksi?.startsWith('ganti')) {
    let sub = 'Data';
    if (aksi.includes('arsip')) sub = 'Arsip';
    else if (aksi.includes('kesekretariatan')) sub = 'Kesekretariatan';
    else if (aksi.includes('laporan')) sub = 'Laporan';
    else if (aksi.includes('divisi')) sub = 'Divisi';
    else if (aksi.includes('perkara')) sub = 'Jenis Perkara';
    return {
      label: `Ubah ${sub}`,
      icon: 'edit_document',
      bg: '#e1effe',
      color: '#1e429f',
      border: '#b4c6fc',
    };
  }
  if (aksi?.startsWith('tambah')) {
    let sub = 'Master';
    if (aksi.includes('perkara')) sub = 'Perkara';
    else if (aksi.includes('kesekretariatan')) sub = 'Kesekretariatan';
    else if (aksi.includes('divisi')) sub = 'Divisi';
    else if (aksi.includes('laporan')) sub = 'Laporan';
    return {
      label: `Tambah ${sub}`,
      icon: 'add_circle',
      bg: '#e0f2fe',
      color: '#0369a1',
      border: '#bae6fd',
    };
  }
  if (aksi?.includes('akun') || aksi?.includes('pendaftaran')) {
    const isTolak = aksi.includes('tolak');
    return {
      label: isTolak ? 'Tolak Akun' : aksi === 'daftar_akun' ? 'Daftar Akun' : 'Kelola Akun',
      icon: isTolak ? 'person_remove' : 'person_add',
      bg: isTolak ? '#fde8e8' : '#ede9fe',
      color: isTolak ? '#9b1c1c' : '#5b21b6',
      border: isTolak ? '#f8b4b4' : '#ddd6fe',
    };
  }
  if (aksi?.includes('pinjam') || aksi?.includes('kembali')) {
    return {
      label: aksi.includes('kembali') ? 'Kembali Arsip' : 'Pinjam Arsip',
      icon: 'assignment_return',
      bg: '#fef3c7',
      color: '#92400e',
      border: '#fde68a',
    };
  }
  return {
    label: aksi?.replace(/_/g, ' ') || 'Aktivitas',
    icon: 'info',
    bg: '#f3f4f6',
    color: '#374151',
    border: '#e5e7eb',
  };
}

const KATEGORI_OPTIONS = [
  { key: 'semua', label: 'Semua', icon: 'list_alt' },
  { key: 'upload', label: 'Unggahan', icon: 'cloud_upload' },
  { key: 'hapus', label: 'Penghapusan', icon: 'delete_outline' },
  { key: 'ubah', label: 'Perubahan', icon: 'edit_note' },
  { key: 'master', label: 'Data Master', icon: 'tune' },
  { key: 'akun', label: 'Akun', icon: 'manage_accounts' },
];

export default function LogList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [kategori, setKategori] = useState('semua');
  const [result, setResult] = useState({ data: [], total: 0, pageSize: 20, stats: null });
  const [loading, setLoading] = useState(true);

  // Debounce input pencarian
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      kategori,
      _t: String(Date.now()),
    });
    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    }

    fetch(`/api/logs?${params.toString()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, kategori, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(result.total / (result.pageSize || 20)));
  const stats = result.stats || {};

  return (
    <div>
      {/* Top Header Section */}
      <div className="dashboard-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="dashboard-title">Log Aktivitas</h1>
          <p className="dashboard-subtitle">
            Rekam riwayat audit dan aktivitas pengguna sistem.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={load}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              padding: '8px 14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
            }}
          >
            <span
              className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}
              style={{ fontSize: 16 }}
            >
              refresh
            </span>
            <span>{loading ? 'Memuat...' : 'Segarkan'}</span>
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* KPI Summary Cards (Horizontal Grid) */}
        <div className="kpi-grid">
          {/* Card 1: Total Riwayat */}
          <div className="kpi-card">
            <div className="kpi-top-row">
              <span className="kpi-label">TOTAL LOG</span>
              <div className="kpi-icon-chip" style={{ background: '#e6f7ee', color: 'var(--hijau)' }}>
                <span className="material-symbols-outlined">history</span>
              </div>
            </div>
            <div className="kpi-metric-row">
              <span className="kpi-metric-number">{stats.total ?? result.total ?? 0}</span>
            </div>
          </div>

          {/* Card 2: Hari Ini */}
          <div className="kpi-card">
            <div className="kpi-top-row">
              <span className="kpi-label">HARI INI</span>
              <div className="kpi-icon-chip" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <span className="material-symbols-outlined">today</span>
              </div>
            </div>
            <div className="kpi-metric-row">
              <span className="kpi-metric-number" style={{ color: '#0284c7' }}>{stats.hariIni ?? 0}</span>
            </div>
          </div>

          {/* Card 3: Total Unggahan */}
          <div className="kpi-card">
            <div className="kpi-top-row">
              <span className="kpi-label">UNGGAHAN</span>
              <div className="kpi-icon-chip" style={{ background: '#ecfdf5', color: '#059669' }}>
                <span className="material-symbols-outlined">cloud_upload</span>
              </div>
            </div>
            <div className="kpi-metric-row">
              <span className="kpi-metric-number" style={{ color: '#059669' }}>{stats.totalUpload ?? 0}</span>
            </div>
          </div>

          {/* Card 4: Penghapusan */}
          <div className="kpi-card">
            <div className="kpi-top-row">
              <span className="kpi-label">PENGHAPUSAN</span>
              <div className="kpi-icon-chip" style={{ background: '#fef2f2', color: '#dc2626' }}>
                <span className="material-symbols-outlined">delete_sweep</span>
              </div>
            </div>
            <div className="kpi-metric-row">
              <span className="kpi-metric-number" style={{ color: '#dc2626' }}>{stats.totalHapus ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Main Card: Search, Tabs & Table */}
        <div className="stitch-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Filter & Search Bar */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f0f4f2',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Search Box */}
              <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 18,
                    color: 'var(--teks-muted)',
                    pointerEvents: 'none',
                  }}
                >
                  search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari pengguna atau keterangan..."
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 38px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    fontSize: 13,
                    outline: 'none',
                    background: '#f8faf9',
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: 'var(--teks-muted)',
                      fontSize: 16,
                      padding: 2,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Status Info */}
              <div style={{ fontSize: 12, color: 'var(--teks-muted)', whiteSpace: 'nowrap' }}>
                Total: <strong>{result.total}</strong> riwayat
              </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {KATEGORI_OPTIONS.map((opt) => {
                const isActive = kategori === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setKategori(opt.key);
                      setPage(1);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: isActive ? 'var(--hijau-tua)' : 'var(--border)',
                      background: isActive ? 'var(--hijau-tua)' : '#ffffff',
                      color: isActive ? '#ffffff' : 'var(--teks)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                      {opt.icon}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Container */}
          <div className="table-scroll" style={{ margin: 0 }}>
            <table className="stitch-table">
              <thead>
                <tr>
                  <th style={{ width: 160 }}>WAKTU</th>
                  <th style={{ width: 200 }}>PENGGUNA</th>
                  <th style={{ width: 170 }}>AKSI</th>
                  <th>DESKRIPSI</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((log) => {
                  const waktu = splitTanggalWaktu(log.createdAt);
                  const badge = getAksiBadge(log.aksi);

                  return (
                    <tr key={log.id}>
                      {/* Waktu */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--teks)', fontSize: 13 }}>
                          {waktu.tanggal}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--teks-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            marginTop: 2,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
                          <span>{waktu.jam}</span>
                        </div>
                      </td>

                      {/* Pengguna & Avatar */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {log.avatarType === 'photo' && log.avatarPhotoPath ? (
                            <img
                              src={log.avatarPhotoPath}
                              alt={log.namaLengkap}
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1px solid #dce8e1',
                                flexShrink: 0,
                              }}
                            />
                          ) : log.avatarType === 'icon' && log.avatarIcon ? (
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                background: log.avatarColor || '#e8f5e9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16,
                                flexShrink: 0,
                              }}
                            >
                              {log.avatarIcon}
                            </div>
                          ) : (
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                background: 'var(--hijau-container)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 13,
                                flexShrink: 0,
                              }}
                            >
                              {log.namaLengkap ? log.namaLengkap.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}

                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                color: 'var(--hijau-tua)',
                                fontSize: 13,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {log.namaLengkap}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <span style={{ fontSize: 11, color: 'var(--teks-muted)' }}>
                                @{log.username || 'user'}
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: log.role === 'admin' ? '#fff3e0' : '#e6f7ee',
                                  color: log.role === 'admin' ? '#b5680a' : 'var(--hijau)',
                                  textTransform: 'capitalize',
                                }}
                              >
                                {log.role || 'petugas'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Jenis Aksi Badge */}
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                            {badge.icon}
                          </span>
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Deskripsi */}
                      <td>
                        <div
                          style={{
                            color: 'var(--teks)',
                            fontSize: 13,
                            lineHeight: 1.45,
                            wordBreak: 'break-word',
                          }}
                        >
                          {log.deskripsi}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Empty State */}
                {!loading && result.data.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '48px 16px' }}>
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          background: '#f4f6f5',
                          color: 'var(--teks-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px auto',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
                          manage_search
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--hijau-tua)', marginBottom: 4 }}>
                        Tidak Ada Aktivitas Ditemukan
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--teks-muted)', marginBottom: 12 }}>
                        {search || kategori !== 'semua'
                          ? 'Coba ubah kata kunci pencarian atau pilih kategori filter yang lain.'
                          : 'Belum ada riwayat aktivitas yang tercatat pada sistem.'}
                      </div>
                      {(search || kategori !== 'semua') && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setSearch('');
                            setKategori('semua');
                            setPage(1);
                          }}
                          style={{ fontSize: 12, padding: '6px 14px' }}
                        >
                          Reset Pencarian & Filter
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {result.total > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                borderTop: '1px solid #f0f4f2',
                background: '#f8faf9',
                fontSize: 12,
                color: 'var(--teks-muted)',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                Menampilkan <strong>{Math.min(result.total, (page - 1) * (result.pageSize || 20) + 1)}</strong> –{' '}
                <strong>{Math.min(result.total, page * (result.pageSize || 20))}</strong> dari{' '}
                <strong>{result.total}</strong> aktivitas
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>chevron_left</span>
                  <span>Sebelumnya</span>
                </button>

                <span
                  style={{
                    padding: '4px 10px',
                    fontWeight: 700,
                    color: 'var(--hijau-tua)',
                    fontSize: 12,
                  }}
                >
                  Halaman {page} dari {totalPages}
                </span>

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>Berikutnya</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
