'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getBadgeStyle } from '../../../lib/badgeColors';
import { formatTanggal, formatTanggalWaktu } from '../../../lib/formatDate';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DetailArsip({ id, role }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [peminjam, setPeminjam] = useState('');
  const [tanggalPinjam, setTanggalPinjam] = useState(todayStr());
  const [tanggalKembali, setTanggalKembali] = useState(todayStr());
  const [submitting, setSubmitting] = useState(false);

  const [editPeminjaman, setEditPeminjaman] = useState(null); // { id, peminjam, tanggalPinjam, tanggalKembali }
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const bisaEdit = role !== 'staf_umum';

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/documents/${id}?mode=meta`)
      .then((r) => r.json())
      .then((res) => {
        setData(res.data || null);
        setLoading(false);
      });
  }, [id]);

  useEffect(load, [load]);

  async function handlePinjam(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await fetch(`/api/documents/${id}/peminjaman`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peminjam, tanggalPinjam }),
    });
    const resData = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(resData.error || 'Gagal mencatat peminjaman.');
      return;
    }
    setPeminjam('');
    setTanggalPinjam(todayStr());
    load();
  }

  async function handleKembalikan(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await fetch(`/api/documents/${id}/peminjaman`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tanggalKembali }),
    });
    const resData = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(resData.error || 'Gagal mencatat pengembalian.');
      return;
    }
    setTanggalKembali(todayStr());
    load();
  }

  function openEditPeminjaman(row) {
    setEditPeminjaman({
      id: row.id,
      peminjam: row.peminjam,
      tanggalPinjam: row.tanggalPinjam.slice(0, 10),
      tanggalKembali: row.tanggalKembali ? row.tanggalKembali.slice(0, 10) : '',
    });
    setEditError('');
  }

  async function handleSaveEditPeminjaman(e) {
    e.preventDefault();
    setEditError('');
    setSavingEdit(true);
    const res = await fetch(`/api/documents/${id}/peminjaman/${editPeminjaman.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        peminjam: editPeminjaman.peminjam,
        tanggalPinjam: editPeminjaman.tanggalPinjam,
        tanggalKembali: editPeminjaman.tanggalKembali || null,
      }),
    });
    const resData = await res.json();
    setSavingEdit(false);
    if (!res.ok) {
      setEditError(resData.error || 'Gagal menyimpan perubahan.');
      return;
    }
    setEditPeminjaman(null);
    load();
  }

  if (loading) {
    return (
      <div>
        <div className="topbar"><div style={{ fontWeight: 700 }}>DETAIL ARSIP</div></div>
        <div className="page-body">Memuat data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <div className="topbar"><div style={{ fontWeight: 700 }}>DETAIL ARSIP</div></div>
        <div className="page-body">Arsip tidak ditemukan.</div>
      </div>
    );
  }

  const badge = getBadgeStyle(data.jenisPerkaraUrutan || 0);

  return (
    <div>
      <div className="topbar">
        <div style={{ fontWeight: 700, letterSpacing: 0.3 }}>DETAIL ARSIP</div>
        <button className="btn-secondary" onClick={() => router.push('/cari')}>← Kembali ke Daftar</button>
      </div>
      <div className="page-body">
        <div className="detail-grid">
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{data.nomorPerkara}</div>
                  <span className="badge" style={{ background: badge.bg, color: badge.text, marginTop: 6, display: 'inline-block' }}>
                    {data.jenisPerkaraNama}
                  </span>
                </div>
                <span
                  style={{
                    padding: '6px 14px', borderRadius: 999, fontWeight: 700, fontSize: 13,
                    background: data.status === 'dipinjam' ? '#fff3e0' : '#e6f7ee',
                    color: data.status === 'dipinjam' ? '#b5680a' : '#146c4f',
                  }}
                >
                  {data.status === 'dipinjam' ? '📕 Dipinjam' : '📗 Ada'}
                </span>
              </div>

              <table style={{ fontSize: 14 }}>
                <tbody>
                  <tr><td style={{ color: '#667', padding: '6px 0', width: 160 }}>Nama Pihak</td><td>{data.namaPihak || '-'}</td></tr>
                  <tr><td style={{ color: '#667', padding: '6px 0' }}>Tanggal BHT</td><td>{formatTanggal(data.tanggalBht)}</td></tr>
                  <tr><td style={{ color: '#667', padding: '6px 0' }}>Keterangan</td><td>{data.keterangan || '-'}</td></tr>
                  <tr><td style={{ color: '#667', padding: '6px 0' }}>Lokasi Fisik</td>
                    <td>Ruang {data.nomorRuang}, Rak {data.nomorRakLemari}, Laci {data.nomorTingkatLaci}, Boks {data.nomorBoks}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: 16 }}>
                <a href={`/api/documents/${id}?mode=view`} target="_blank" rel="noreferrer" className="btn-secondary" style={{ marginRight: 8 }}>
                  👁️ Lihat PDF
                </a>
                <a href={`/api/documents/${id}?mode=download`} className="btn-secondary">⬇️ Download</a>
                {bisaEdit && (
                  <button className="btn-secondary" style={{ marginLeft: 8 }} onClick={() => router.push(`/cari/${id}/edit`)}>
                    ✏️ Edit
                  </button>
                )}
              </div>
            </div>

            {bisaEdit && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 14 }}>
                  {data.status === 'dipinjam' ? 'Peminjaman Aktif' : 'Catat Peminjaman'}
                </div>

                {data.status === 'dipinjam' ? (
                  <div>
                    <div style={{ fontSize: 14, marginBottom: 14 }}>
                      Sedang dipinjam oleh <strong>{data.peminjamanAktif?.peminjam}</strong>, sejak {formatTanggal(data.peminjamanAktif?.tanggalPinjam)}.
                    </div>
                    <form onSubmit={handleKembalikan}>
                      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Tanggal Kembali</label>
                      <input
                        type="date"
                        className="input-field"
                        value={tanggalKembali}
                        onChange={(e) => setTanggalKembali(e.target.value)}
                        style={{ marginBottom: 12, maxWidth: 220 }}
                        required
                      />
                      <div>
                        <button className="btn-primary" disabled={submitting}>
                          {submitting ? 'Menyimpan...' : '✅ Tandai Dikembalikan'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <form onSubmit={handlePinjam}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Peminjam</label>
                      <input
                        className="input-field"
                        value={peminjam}
                        onChange={(e) => setPeminjam(e.target.value)}
                        placeholder="Contoh: Pengadilan Tinggi Lampung"
                        required
                      />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Tanggal Pinjam</label>
                      <input
                        type="date"
                        className="input-field"
                        value={tanggalPinjam}
                        onChange={(e) => setTanggalPinjam(e.target.value)}
                        style={{ maxWidth: 220 }}
                        required
                      />
                    </div>
                    <button className="btn-primary" disabled={submitting}>
                      {submitting ? 'Menyimpan...' : '📤 Catat Peminjaman'}
                    </button>
                  </form>
                )}
                {error && <div className="error-text" style={{ marginTop: 12 }}>{error}</div>}
              </div>
            )}

            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 14 }}>Riwayat Peminjaman</div>
              <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Peminjam</th>
                    <th>Tanggal Pinjam</th>
                    <th>Tanggal Kembali</th>
                    <th>Dicatat oleh</th>
                    {role === 'admin' && <th style={{ textAlign: 'center' }}>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.riwayatPeminjaman.map((r) => (
                    <tr key={r.id}>
                      <td>{r.peminjam}</td>
                      <td>{formatTanggal(r.tanggalPinjam)}</td>
                      <td>{r.tanggalKembali ? formatTanggal(r.tanggalKembali) : <span style={{ color: '#b5680a', fontWeight: 600 }}>Belum kembali</span>}</td>
                      <td>{r.dicatatOlehNama}</td>
                      {role === 'admin' && (
                        <td style={{ textAlign: 'center' }}>
                          <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => openEditPeminjaman(r)}>
                            ✏️ Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {data.riwayatPeminjaman.length === 0 && (
                    <tr><td colSpan={role === 'admin' ? 5 : 4} style={{ color: '#889', textAlign: 'center', padding: 20 }}>Belum pernah dipinjam.</td></tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>QR Code</div>
            <img
              src={`/api/documents/${id}/qrcode`}
              alt={`QR Code untuk arsip ${data.nomorPerkara}`}
              style={{ width: '100%', maxWidth: 220, borderRadius: 10, border: '1px solid var(--border)' }}
            />
            <div style={{ fontSize: 12, color: '#889', marginTop: 10, marginBottom: 14 }}>
              Scan untuk langsung membuka halaman ini.
            </div>
            <a
              href={`/cari/cetak-qr?ids=${id}`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
              style={{ display: 'inline-block' }}
            >
              🖨️ Cetak QR
            </a>
          </div>
        </div>
      </div>

      {editPeminjaman && (
        <div className="modal-overlay" onClick={() => !savingEdit && setEditPeminjaman(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Edit Data Peminjaman</div>
            <form onSubmit={handleSaveEditPeminjaman}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Nama Peminjam *</label>
                <input
                  className="input-field"
                  value={editPeminjaman.peminjam}
                  onChange={(e) => setEditPeminjaman({ ...editPeminjaman, peminjam: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Tanggal Pinjam *</label>
                <input
                  type="date"
                  className="input-field"
                  value={editPeminjaman.tanggalPinjam}
                  onChange={(e) => setEditPeminjaman({ ...editPeminjaman, tanggalPinjam: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Tanggal Kembali <span style={{ fontWeight: 400, color: '#889' }}>(kosongkan kalau masih dipinjam)</span>
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={editPeminjaman.tanggalKembali}
                  onChange={(e) => setEditPeminjaman({ ...editPeminjaman, tanggalKembali: e.target.value })}
                />
              </div>
              {editError && <div className="error-text" style={{ marginBottom: 12 }}>{editError}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-primary" disabled={savingEdit}>{savingEdit ? 'Menyimpan...' : 'Simpan'}</button>
                <button type="button" className="btn-secondary" onClick={() => setEditPeminjaman(null)}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
