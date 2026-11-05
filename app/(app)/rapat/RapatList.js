'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
const { NAMA_BULAN } = require('../../lib/bulan');

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

const emptyForm = {
  judul: '',
  tanggal: new Date().toISOString().slice(0, 10),
  waktuMulai: '09:00',
  waktuSelesai: '11:00',
  tempat: 'Ruang Media Center PA Gunung Sugih',
  pimpinanRapat: '',
  notulis: '',
  agenda: '',
};

export default function RapatList({ role, user }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [tahun, setTahun] = useState('');
  const [bulan, setBulan] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], total: 0, pageSize: 15 });
  const [loading, setLoading] = useState(true);

  // Modal Tambah Rapat
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal Quick QR
  const [qrModalRapat, setQrModalRapat] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Modal Hapus Rapat
  const [hapusTarget, setHapusTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const bisaKelola = role !== 'staf_umum';

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tahun) params.set('tahun', tahun);
    if (bulan) params.set('bulan', bulan);
    params.set('page', String(page));

    fetch(`/api/rapat?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setResult(data || { data: [], total: 0, pageSize: 15 });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Gagal memuat data rapat:', err);
        setLoading(false);
      });
  }, [q, tahun, bulan, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Statistik Ringkas
  const totalRapat = result.total || 0;
  const totalPresensi = (result.data || []).reduce((acc, curr) => acc + (curr.jumlahPresensi || 0), 0);
  const totalAdaPdf = (result.data || []).filter((r) => r.fileRangkumanPath).length;

  async function handleCreateRapat(e) {
    e.preventDefault();
    setFormError('');
    if (!form.judul.trim() || !form.tanggal) {
      setFormError('Judul dan Tanggal rapat wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/rapat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Gagal menyimpan rapat.');
      } else {
        setShowAddModal(false);
        setForm(emptyForm);
        loadData();
        // Arahkan ke halaman detail rapat yang baru dibuat
        router.push(`/rapat/${data.id}`);
      }
    } catch (err) {
      setFormError('Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteRapat() {
    if (!hapusTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/rapat/${hapusTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setHapusTarget(null);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menghapus rapat.');
      }
    } catch (err) {
      alert('Gagal menghubungi server.');
    } finally {
      setDeleting(false);
    }
  }

  function handleCopyLink(rapatId) {
    const origin = window.location.origin;
    const url = `${origin}/presensi/${rapatId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  }

  return (
    <div>
      {/* Topbar Header */}
      <div className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: 0.3, color: '#0f4d3a' }}>
            MANAJEMEN RAPAT & PRESENSI DIGITAL
          </div>
          <div style={{ fontSize: 12.5, color: '#5a6b62' }}>
            Absensi kehadiran peserta dengan TTD digital, barcode/QR presensi, dan arsip rangkuman notulensi (PDF).
          </div>
        </div>

        {bisaKelola && (
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm);
              setFormError('');
              setShowAddModal(true);
            }}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8 }}
          >
            <span style={{ fontSize: 16 }}>➕</span> Buat Agenda Rapat Baru
          </button>
        )}
      </div>

      <div className="page-body">
        {/* KPI Mini Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
          <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #0f4d3a' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#5a6b62', textTransform: 'uppercase' }}>Total Agenda Rapat</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f4d3a', marginTop: 4 }}>{totalRapat}</div>
          </div>
          <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #1e8a63' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#5a6b62', textTransform: 'uppercase' }}>Presensi Peserta Tercatat</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#1e8a63', marginTop: 4 }}>{totalPresensi} Hadir</div>
          </div>
          <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #1a56db' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#5a6b62', textTransform: 'uppercase' }}>Rangkuman Notulen PDF</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#1a56db', marginTop: 4 }}>{totalAdaPdf} Terarsip</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="card" style={{ padding: '16px 18px', marginBottom: 20 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              loadData();
            }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}
          >
            <div style={{ flex: '1 1 240px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Cari judul rapat, tempat, pimpinan, atau agenda..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div style={{ width: 140 }}>
              <select className="input-field" value={tahun} onChange={(e) => { setTahun(e.target.value); setPage(1); }}>
                <option value="">Semua Tahun</option>
                {[CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3].map((th) => (
                  <option key={th} value={th}>Tahun {th}</option>
                ))}
              </select>
            </div>

            <div style={{ width: 150 }}>
              <select className="input-field" value={bulan} onChange={(e) => { setBulan(e.target.value); setPage(1); }}>
                <option value="">Semua Bulan</option>
                {NAMA_BULAN.map((bln, idx) => (
                  <option key={idx + 1} value={idx + 1}>{bln}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn-secondary" style={{ padding: '10px 16px' }}>
              🔍 Filter
            </button>
            {(q || tahun || bulan) && (
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '10px 14px', color: '#c53030' }}
                onClick={() => {
                  setQ('');
                  setTahun('');
                  setBulan('');
                  setPage(1);
                }}
              >
                Reset
              </button>
            )}
          </form>
        </div>

        {/* Tabel / List Rapat */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#707974' }}>
              Sedang memuat data agenda rapat...
            </div>
          ) : result.data.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: '#707974' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f4d3a', marginBottom: 4 }}>Belum Ada Agenda Rapat</div>
              <div style={{ fontSize: 13, marginBottom: 16 }}>
                {q || tahun || bulan
                  ? 'Tidak ada rapat yang sesuai dengan kriteria filter pencarian.'
                  : 'Klik tombol "Buat Agenda Rapat Baru" untuk memulai rapat, presensi digital, dan rangkuman notulensi.'}
              </div>
              {bisaKelola && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  ➕ Buat Agenda Rapat Baru
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: '#f8faf9', borderBottom: '1px solid var(--border)', color: '#5a6b62', fontWeight: 700 }}>
                    <th style={{ padding: '12px 16px', width: 40 }}>No</th>
                    <th style={{ padding: '12px 16px' }}>Nama & Agenda Rapat</th>
                    <th style={{ padding: '12px 16px', width: 170 }}>Jadwal & Tempat</th>
                    <th style={{ padding: '12px 16px', width: 130 }}>Presensi</th>
                    <th style={{ padding: '12px 16px', width: 150 }}>Rangkuman PDF</th>
                    <th style={{ padding: '12px 16px', width: 190, textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((r, idx) => (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fdfefe')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                    >
                      <td style={{ padding: '14px 16px', color: '#707974', fontWeight: 600 }}>
                        {(page - 1) * result.pageSize + idx + 1}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <Link
                          href={`/rapat/${r.id}`}
                          style={{
                            fontWeight: 700,
                            color: '#0f4d3a',
                            fontSize: 14.5,
                            display: 'block',
                            marginBottom: 4,
                          }}
                        >
                          {r.judul}
                        </Link>
                        {r.agenda && (
                          <div
                            style={{
                              fontSize: 12,
                              color: '#5a6b62',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.4,
                            }}
                          >
                            {r.agenda}
                          </div>
                        )}
                        {(r.pimpinanRapat || r.notulis) && (
                          <div style={{ fontSize: 11.5, color: '#707974', marginTop: 4 }}>
                            {r.pimpinanRapat && <span>👤 Pimpinan: <strong>{r.pimpinanRapat}</strong> </span>}
                            {r.notulis && <span> • ✍️ Notulis: <strong>{r.notulis}</strong></span>}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#131e18', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>📅</span> {r.tanggal}
                        </div>
                        {r.waktuMulai && (
                          <div style={{ fontSize: 12, color: '#5a6b62', marginTop: 2 }}>
                            ⏰ {r.waktuMulai} {r.waktuSelesai ? `- ${r.waktuSelesai}` : ''} WIB
                          </div>
                        )}
                        {r.tempat && (
                          <div style={{ fontSize: 12, color: '#1e8a63', marginTop: 2, fontWeight: 500 }}>
                            📍 {r.tempat}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: r.jumlahPresensi > 0 ? '#e6f7ee' : '#f0f4f2',
                            color: r.jumlahPresensi > 0 ? '#136b4e' : '#707974',
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          <span>👥</span> {r.jumlahPresensi} Peserta
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {r.fileRangkumanPath ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: '#eaf7ed',
                                color: '#1e8a63',
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 700,
                                width: 'fit-content',
                              }}
                            >
                              <span>✓</span> PDF Terunggah
                            </span>
                            <a
                              href={`/api/rapat/${r.id}/rangkuman?mode=view`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: 12, color: '#1a56db', textDecoration: 'underline' }}
                            >
                              Buka Dokumen ↗
                            </a>
                          </div>
                        ) : (
                          <span
                            style={{
                              background: '#f4f6f5',
                              color: '#8a978f',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 600,
                            }}
                          >
                            Belum Ada PDF
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Link
                            href={`/rapat/${r.id}`}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: 12.5, borderRadius: 6 }}
                          >
                            Kelola
                          </Link>

                          <button
                            type="button"
                            onClick={() => setQrModalRapat(r)}
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: 12.5, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}
                            title="Tampilkan QR Presensi untuk discan peserta"
                          >
                            <span>📱</span> QR
                          </button>

                          {bisaKelola && (
                            <button
                              type="button"
                              onClick={() => setHapusTarget(r)}
                              className="btn-danger"
                              style={{ padding: '6px 9px', fontSize: 12 }}
                              title="Hapus Rapat"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL TAMBAH RAPAT BARU */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#0f4d3a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>👥</span> Buat Agenda Rapat Baru
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, color: '#707974', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={{ background: '#fff0f0', color: '#c53030', border: '1px solid #f5c6c6', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleCreateRapat}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 5 }}>
                  Nama / Judul Rapat <span style={{ color: '#c53030' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: Rapat Koordinasi Bulanan Kesekretariatan & Kepaniteraan"
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>
                    Tanggal <span style={{ color: '#c53030' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.tanggal}
                    onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Jam Mulai</label>
                  <input
                    type="time"
                    className="input-field"
                    value={form.waktuMulai}
                    onChange={(e) => setForm({ ...form, waktuMulai: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Jam Selesai</label>
                  <input
                    type="time"
                    className="input-field"
                    value={form.waktuSelesai}
                    onChange={(e) => setForm({ ...form, waktuSelesai: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 5 }}>Tempat / Ruangan</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: Ruang Media Center / Ruang Sidang Utama"
                  value={form.tempat}
                  onChange={(e) => setForm({ ...form, tempat: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Pimpinan Rapat</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ketua / Wakil Ketua / Panitera"
                    value={form.pimpinanRapat}
                    onChange={(e) => setForm({ ...form, pimpinanRapat: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Notulis</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Nama Notulis / Kasubbag"
                    value={form.notulis}
                    onChange={(e) => setForm({ ...form, notulis: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 5 }}>Agenda & Pokok Bahasan</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Tuliskan pokok agenda pembahasan rapat..."
                  value={form.agenda}
                  onChange={(e) => setForm({ ...form, agenda: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QUICK QR PRESENSI */}
      {qrModalRapat && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f4d3a', textAlign: 'left' }}>
                QR Code Presensi Kehadiran
              </div>
              <button
                type="button"
                onClick={() => setQrModalRapat(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, color: '#707974', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontWeight: 700, fontSize: 14.5, color: '#131e18', marginBottom: 4 }}>
              {qrModalRapat.judul}
            </div>
            <div style={{ fontSize: 12.5, color: '#5a6b62', marginBottom: 14 }}>
              📅 {qrModalRapat.tanggal} {qrModalRapat.tempat ? `• 📍 ${qrModalRapat.tempat}` : ''}
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '2px solid #0f4d3a',
                borderRadius: 12,
                padding: '16px',
                display: 'inline-block',
                marginBottom: 14,
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
              }}
            >
              <img
                src={`/api/rapat/${qrModalRapat.id}/qrcode`}
                alt="QR Presensi"
                style={{ width: 220, height: 220, display: 'block' }}
              />
            </div>

            <div style={{ fontSize: 12.5, color: '#5a6b62', marginBottom: 16 }}>
              Arahkan kamera HP peserta rapat ke QR Code di atas untuk mengisi nama, jabatan, dan tanda tangan digital.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  readOnly
                  className="input-field"
                  value={typeof window !== 'undefined' ? `${window.location.origin}/presensi/${qrModalRapat.id}` : ''}
                  style={{ fontSize: 12, background: '#f8faf9' }}
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink(qrModalRapat.id)}
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: 12.5, whiteSpace: 'nowrap' }}
                >
                  {copySuccess ? '✓ Tersalin!' : 'Salin Link'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <a
                  href={`/rapat/${qrModalRapat.id}/cetak-qr-meja`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ flex: 1, padding: '9px 12px', fontSize: 13, textAlign: 'center', textDecoration: 'none' }}
                >
                  🖨️ Cetak Lembar Meja (A4)
                </a>
                <button
                  type="button"
                  onClick={() => setQrModalRapat(null)}
                  className="btn-secondary"
                  style={{ padding: '9px 14px', fontSize: 13 }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS KONFIRMASI */}
      {hapusTarget && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 420 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#c53030', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠️</span> Hapus Agenda Rapat?
            </div>
            <p style={{ fontSize: 13.5, color: '#334', margin: '0 0 16px', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus agenda rapat <strong>"{hapusTarget.judul}"</strong>?
              Seluruh data absensi peserta dan berkas rangkuman PDF yang bersangkutan akan dihapus permanen.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setHapusTarget(null)} className="btn-secondary" disabled={deleting}>
                Batal
              </button>
              <button type="button" onClick={handleDeleteRapat} className="btn-danger" disabled={deleting}>
                {deleting ? 'Menghapus...' : 'Ya, Hapus Rapat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

