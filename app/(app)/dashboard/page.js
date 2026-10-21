'use client';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatTanggalWaktu, formatTanggal } from '../../lib/formatDate';

const WINDOW_SIZE = 5;
const CURRENT_YEAR = new Date().getFullYear();

// Palet warna resmi Wibawa Kehakiman (Stitch Design System)
const COLOR_PALETTE = [
  { bg: '#0f4d3a', text: '#ffffff', tag: '#e6f7ee', tagText: '#136b4e' }, // Deep Judicial Green
  { bg: '#1e8a63', text: '#ffffff', tag: '#eaf7ed', tagText: '#1e8a63' }, // Emerald Accent
  { bg: '#f2b418', text: '#261900', tag: '#fff3e0', tagText: '#b5680a' }, // Court Gold
  { bg: '#1a56db', text: '#ffffff', tag: '#e6f0ff', tagText: '#1a56db' }, // Info Blue
  { bg: '#7c3aed', text: '#ffffff', tag: '#f3e8ff', tagText: '#7c3aed' }, // Royal Purple
];

function getActivityIcon(aksi) {
  const act = String(aksi || '').toLowerCase();
  if (act.includes('upload') || act.includes('sync')) {
    return { icon: 'upload_file', bg: '#e6f7ee', color: '#136b4e' };
  }
  if (act.includes('pinjam')) {
    return { icon: 'outbox', bg: '#fff3e0', color: '#b5680a' };
  }
  if (act.includes('kembali')) {
    return { icon: 'assignment_return', bg: '#eaf7ed', color: '#1e8a63' };
  }
  if (act.includes('cetak') || act.includes('qr')) {
    return { icon: 'qr_code_scanner', bg: '#e6f0ff', color: '#1a56db' };
  }
  if (act.includes('hapus')) {
    return { icon: 'delete', bg: '#fde8e8', color: '#c53030' };
  }
  return { icon: 'history', bg: '#f4f6f5', color: '#556' };
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const [showNotFound, setShowNotFound] = useState(searchParams.get('notfound') === '1');
  const [allStats, setAllStats] = useState(null);
  const [tahunStats, setTahunStats] = useState(null);
  const [tahunDipilih, setTahunDipilih] = useState(CURRENT_YEAR);
  const [windowEnd, setWindowEnd] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stats?tahun=${tahunDipilih}`)
      .then((r) => r.json())
      .then((data) => {
        setAllStats(data);
        setTahunStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching dashboard stats:', err);
        setLoading(false);
      });
  }, [tahunDipilih]);

  const tahunOptions = useMemo(() => {
    if (!allStats || !allStats.perTahun || allStats.perTahun.length === 0) return [CURRENT_YEAR];
    const minYear = Math.min(...allStats.perTahun.map((p) => p.tahun), tahunDipilih);
    const maxYear = Math.max(CURRENT_YEAR, tahunDipilih);
    const years = [];
    for (let y = maxYear; y >= minYear; y--) years.push(y);
    return years;
  }, [allStats, tahunDipilih]);

  const chartData = useMemo(() => {
    if (!allStats || !allStats.perTahun) return [];
    const map = {};
    allStats.perTahun.forEach((p) => { map[p.tahun] = p.c; });
    const years = [];
    for (let y = windowEnd - WINDOW_SIZE + 1; y <= windowEnd; y++) years.push(y);
    return years.map((y) => ({ tahun: y, jumlah: map[y] || 0 }));
  }, [allStats, windowEnd]);

  if (loading || !allStats || !tahunStats) {
    return (
      <div className="page-body" style={{ textAlign: 'center', padding: '60px 20px', color: '#667' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🏛️</div>
        <div style={{ fontWeight: 600 }}>Memuat data dashboard Bank Data Digital...</div>
      </div>
    );
  }

  // Komposisi Perkara untuk Donut
  const breakdown = tahunStats.jenisBreakdown || [];
  const totalTahunIni = breakdown.reduce((sum, j) => sum + (j.jumlah || 0), 0);

  const pieData = breakdown
    .filter((j) => (j.jumlah || 0) > 0)
    .map((j, idx) => ({
      name: j.nama,
      value: j.jumlah,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length].bg,
      tagBg: COLOR_PALETTE[idx % COLOR_PALETTE.length].tag,
      tagColor: COLOR_PALETTE[idx % COLOR_PALETTE.length].tagText,
    }));

  // KPI Metrics Calculation
  const gugatItem = breakdown.find((j) => j.nama.toLowerCase().includes('gugat')) || breakdown[0];
  const gugatCount = gugatItem ? gugatItem.jumlah : 0;
  const gugatPct = totalTahunIni > 0 ? ((gugatCount / totalTahunIni) * 100).toFixed(1) : 0;

  const talakItem = breakdown.find((j) => j.nama.toLowerCase().includes('talak'));
  const otherItems = breakdown.filter((j) => j !== gugatItem);
  const otherCount = otherItems.reduce((acc, curr) => acc + (curr.jumlah || 0), 0);
  const otherPct = totalTahunIni > 0 ? ((otherCount / totalTahunIni) * 100).toFixed(1) : 0;

  const isAtLatest = windowEnd >= CURRENT_YEAR;

  return (
    <div className="page-body" style={{ background: '#f8faf9', minHeight: '100vh', paddingTop: 24 }}>
      <div className="dashboard-container">
        {showNotFound && (
          <div
            style={{
              background: '#fff3e0', border: '1px solid #ffd699', borderRadius: 10,
              padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 14, color: '#9a5b1e',
            }}
          >
            <span>⚠️ Halaman yang Anda tuju tidak ditemukan.</span>
            <button
              onClick={() => setShowNotFound(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9a5b1e' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header Section */}
        <div className="dashboard-header">
          <div>
            <div className="dashboard-badge-tag">
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>verified</span>
              REPOSITORI RESMI • PA GUNUNG SUGIH
            </div>
            <h1 className="dashboard-title">Ringkasan Arsip BHT</h1>
            <p className="dashboard-subtitle">
              Sistem Repositori Arsip Digital Berkas Berkekuatan Hukum Tetap & Administrasi Terpadu
            </p>
          </div>

          <div className="dashboard-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teks-muted)', textTransform: 'uppercase' }}>
                Tahun
              </span>
              <select
                className="dashboard-select"
                value={tahunDipilih}
                onChange={(e) => setTahunDipilih(Number(e.target.value))}
              >
                {tahunOptions.map((y) => (
                  <option key={y} value={y}>Tahun {y}</option>
                ))}
              </select>
            </div>

            <a href="/cari" className="dashboard-btn-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>manage_search</span>
              <span>Cari Arsip BHT</span>
            </a>
          </div>
        </div>

        {/* 4 Essential KPI Cards (Solid, Crisp, No Glass) */}
        <div className="kpi-grid">
          {/* Card 1: Total Arsip BHT */}
          <div className="kpi-card">
            <div className="kpi-top-row">
              <span className="kpi-label">TOTAL ARSIP BHT</span>
              <div className="kpi-icon-chip" style={{ background: '#e6f7ee', color: 'var(--hijau)' }}>
                <span className="material-symbols-outlined">folder_managed</span>
              </div>
            </div>
            <div className="kpi-metric-row">
              <span className="kpi-metric-number">{allStats.total.toLocaleString('id-ID')}</span>
              <span className="kpi-pill-badge" style={{ background: '#e6f7ee', color: 'var(--hijau)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>check_circle</span>
                Terdaftar
              </span>
            </div>
          </div>

          {/* Card 2: Sedang Dipinjam */}
          <div className="kpi-card">
            <div className="kpi-top-row">
              <span className="kpi-label">SEDANG DIPINJAM</span>
              <div className="kpi-icon-chip" style={{ background: '#fff3e0', color: '#b5680a' }}>
                <span className="material-symbols-outlined">outbox</span>
              </div>
            </div>
            <div className="kpi-metric-row">
              <span className="kpi-metric-number" style={{ color: '#b5680a' }}>
                {allStats.sedangDipinjam.toLocaleString('id-ID')}
              </span>
              <span className="kpi-pill-badge" style={{ background: '#fff3e0', color: '#b5680a' }}>
                Fisik Keluar
              </span>
            </div>
          </div>

          {/* Card 3: Cerai Gugat (Pdt.G) */}
          <div className="kpi-card">
            <div className="kpi-top-row">
              <span className="kpi-label">{gugatItem ? gugatItem.nama.toUpperCase() : 'CERAI GUGAT'}</span>
              <div className="kpi-icon-chip" style={{ background: '#e6f0ff', color: '#1a56db' }}>
                <span className="material-symbols-outlined">balance</span>
              </div>
            </div>
            <div className="kpi-metric-row">
              <span className="kpi-metric-number">{gugatCount.toLocaleString('id-ID')}</span>
              <span className="kpi-pill-badge" style={{ background: '#e6f0ff', color: '#1a56db' }}>
                {gugatPct}% ({tahunDipilih})
              </span>
            </div>
          </div>

          {/* Card 4: Cerai Talak & Lainnya */}
          <div className="kpi-card">
            <div className="kpi-top-row">
              <span className="kpi-label">
                {talakItem ? 'CERAI TALAK & LAINNYA' : 'JENIS LAINNYA'}
              </span>
              <div className="kpi-icon-chip" style={{ background: '#eaf7ed', color: '#0f4d3a' }}>
                <span className="material-symbols-outlined">library_books</span>
              </div>
            </div>
            <div className="kpi-metric-row">
              <span className="kpi-metric-number">{otherCount.toLocaleString('id-ID')}</span>
              <span className="kpi-pill-badge" style={{ background: '#eaf7ed', color: '#0f4d3a' }}>
                {otherPct}% ({tahunDipilih})
              </span>
            </div>
          </div>
        </div>

        {/* Charts Section: Tren Tahunan (Left) + Komposisi (Right) */}
        <div className="stitch-grid-2">
          {/* Left Chart: Tren Volume Tahunan */}
          <div className="stitch-card">
            <div>
              <div className="stitch-card-header">
                <div>
                  <h2 className="stitch-card-title">Tren Volume Tahunan</h2>
                  <p className="stitch-card-subtitle">
                    Statistik perkara berkekuatan hukum tetap ({chartData[0]?.tahun || CURRENT_YEAR}–{chartData[chartData.length - 1]?.tahun || CURRENT_YEAR})
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: 13, borderRadius: 6 }}
                    onClick={() => setWindowEnd((w) => w - 1)}
                    title="Tahun sebelumnya"
                  >
                    ←
                  </button>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teks)' }}>
                    {chartData[0]?.tahun} — {chartData[chartData.length - 1]?.tahun}
                  </span>
                  <button
                    className="btn-secondary"
                    style={{
                      padding: '4px 10px',
                      fontSize: 13,
                      borderRadius: 6,
                      opacity: isAtLatest ? 0.35 : 1,
                      cursor: isAtLatest ? 'not-allowed' : 'pointer'
                    }}
                    onClick={() => !isAtLatest && setWindowEnd((w) => w + 1)}
                    disabled={isAtLatest}
                    title="Tahun berikutnya"
                  >
                    →
                  </button>
                </div>
              </div>

              <div style={{ width: '100%', height: 240, paddingTop: 10 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="tahun"
                      tickLine={false}
                      axisLine={{ stroke: '#e2e6e4' }}
                      tick={{ fill: '#707974', fontSize: 12, fontWeight: 600 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#707974', fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f4f6f5' }}
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e2e6e4',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                      formatter={(val) => [`${val.toLocaleString('id-ID')} Berkas`, 'Total Arsip']}
                      labelFormatter={(label) => `Tahun ${label}`}
                    />
                    <Bar dataKey="jumlah" fill="#0f4d3a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f0f4f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--teks-muted)' }}>
              <span>Volume rata-rata per tahun</span>
              <span style={{ fontWeight: 700, color: 'var(--hijau)' }}>
                {Math.round(chartData.reduce((s, d) => s + d.jumlah, 0) / (chartData.length || 1))} Berkas / Thn
              </span>
            </div>
          </div>

          {/* Right Chart: Komposisi Perkara (Donut) */}
          <div className="stitch-card">
            <div>
              <div className="stitch-card-header">
                <div>
                  <h2 className="stitch-card-title">Komposisi Perkara</h2>
                  <p className="stitch-card-subtitle">Klasifikasi perkara tahun {tahunDipilih}</p>
                </div>
                <span className="kpi-pill-badge" style={{ background: '#eaf7ed', color: 'var(--hijau)' }}>
                  {tahunDipilih}
                </span>
              </div>

              {totalTahunIni === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 0', color: '#889', fontSize: 13 }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>📂</div>
                  Belum ada data perkara pada tahun {tahunDipilih}
                </div>
              ) : (
                <>
                  <div style={{ position: 'relative', width: '100%', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`donut-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [`${v} Dokumen`, 'Jumlah']} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Donut Center Label */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--hijau-tua)' }}>
                        {totalTahunIni.toLocaleString('id-ID')}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--teks-muted)', textTransform: 'uppercase' }}>
                        Perkara
                      </span>
                    </div>
                  </div>

                  {/* Legend Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, paddingTop: 10, borderTop: '1px solid #f0f4f2' }}>
                    {pieData.map((item) => {
                      const pct = ((item.value / totalTahunIni) * 100).toFixed(1);
                      return (
                        <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 9, height: 9, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                            <span style={{ color: 'var(--teks)' }}>{item.name}</span>
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--hijau-tua)' }}>
                            {item.value} <span style={{ color: 'var(--teks-muted)', fontWeight: 400, fontSize: 11 }}>({pct}%)</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tables & Activities: Arsip Terbaru (Left) + Log Aktivitas (Right) */}
        <div className="stitch-grid-2">
          {/* Left Table: Arsip Terbaru */}
          <div className="stitch-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px 14px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="stitch-card-title">Arsip Terbaru</h2>
                <p className="stitch-card-subtitle">Berkas BHT terdaftar belakangan ini</p>
              </div>
              <a href="/cari" className="stitch-link">
                <span>Lihat Semua</span>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </a>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="stitch-table">
                <thead>
                  <tr>
                    <th>Nomor & Pihak</th>
                    <th>Klasifikasi</th>
                    <th>Tgl BHT</th>
                    <th>Status Lokasi</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {allStats.terbaru.map((a) => {
                    const isDipinjam = a.status === 'dipinjam';
                    const pihak = [a.pihakSatu, a.pihakDua].filter(Boolean).join(' vs ') || 'Para Pihak';
                    const lokasiText = isDipinjam
                      ? 'Fisik Dipinjam'
                      : `Rak ${a.rak || '-'}${a.boks ? ` / Boks ${a.boks}` : ''}`;

                    return (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--hijau-tua)', fontSize: 13 }}>
                            {a.nomorPerkara}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--teks-muted)', marginTop: 2, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {pihak}
                          </div>
                        </td>
                        <td>
                          <span
                            className="kpi-pill-badge"
                            style={{
                              background: '#e6f0ff',
                              color: '#1a56db',
                              fontSize: 11,
                            }}
                          >
                            {a.jenisPerkaraNama || 'Umum'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--teks-muted)', whiteSpace: 'nowrap', fontSize: 12 }}>
                          {formatTanggal(a.tanggalBht)}
                        </td>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: isDipinjam ? '#b5680a' : 'var(--hijau)' }}>
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: isDipinjam ? '#b5680a' : 'var(--hijau)',
                              }}
                            />
                            <span>{lokasiText}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <a
                            href={`/api/documents/${a.id}?mode=view`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '5px 10px',
                              fontSize: 11,
                              borderRadius: 6,
                              textDecoration: 'none',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>visibility</span>
                            <span>Buka PDF</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                  {allStats.terbaru.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--teks-muted)' }}>
                        Belum ada dokumen arsip terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Activities: Log Aktivitas */}
          <div className="stitch-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px 14px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="stitch-card-title">Aktivitas Terakhir</h2>
                <p className="stitch-card-subtitle">Riwayat operasional pengguna</p>
              </div>
              <a href="/log-aktivitas" className="stitch-link">
                <span>Lihat Semua</span>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </a>
            </div>

            <div style={{ padding: '12px 22px' }}>
              {allStats.aktivitas.map((log) => {
                const iconInfo = getActivityIcon(log.aksi);
                return (
                  <div key={log.id} className="stitch-activity-item">
                    <div
                      className="stitch-activity-icon"
                      style={{ background: iconInfo.bg, color: iconInfo.color }}
                    >
                      <span className="material-symbols-outlined">{iconInfo.icon}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--hijau-tua)' }}>
                          {log.namaLengkap}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--teks-muted)', whiteSpace: 'nowrap' }}>
                          {formatTanggalWaktu(log.createdAt)}
                        </span>
                      </div>
                      <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--teks)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                        {log.deskripsi}
                      </p>
                    </div>
                  </div>
                );
              })}
              {allStats.aktivitas.length === 0 && (
                <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--teks-muted)', fontSize: 13 }}>
                  Belum ada catatan aktivitas.
                </div>
              )}
            </div>

            <div style={{ padding: '12px 22px', background: '#f8faf9', borderTop: '1px solid var(--border)' }}>
              <a
                href="/log-aktivitas"
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  width: '100%',
                  fontSize: 12,
                  padding: '8px',
                  borderRadius: 6,
                  textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>history</span>
                <span>Buka Log Aktivitas Lengkap</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="page-body">Memuat data dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
