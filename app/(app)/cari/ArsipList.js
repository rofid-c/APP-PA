'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getBadgeStyle } from '../../lib/badgeColors';
import { formatTanggal } from '../../lib/formatDate';

export default function ArsipList({ role }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [jenisId, setJenisId] = useState('');
  const [tahun, setTahun] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], total: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [jenisOptions, setJenisOptions] = useState([]);
  const [hapusTarget, setHapusTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [qrMode, setQrMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const bisaEdit = role !== 'staf_umum';

  useEffect(() => {
    fetch('/api/jenis-perkara')
      .then((r) => r.json())
      .then((data) => setJenisOptions(data.data || []));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (jenisId) params.set('jenisId', jenisId);
    if (tahun) params.set('tahun', tahun);
    if (status) params.set('status', status);
    params.set('page', String(page));

    fetch(`/api/documents?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setResult(data);
        setLoading(false);
      });
  }, [q, jenisId, tahun, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleDelete() {
    if (!hapusTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/documents/${hapusTarget.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) {
      setHapusTarget(null);
      load();
    } else {
      const data = await res.json();
      alert(data.error || 'Gagal menghapus arsip.');
    }
  }

  function toggleQrMode() {
    setQrMode((v) => !v);
    setSelectedIds([]);
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleCetakTerpilih() {
    window.open(`/cari/cetak-qr?ids=${selectedIds.join(',')}`, '_blank');
  }

  const totalPages = Math.max(1, Math.ceil(result.total / (result.pageSize || 20)));

  return (
    <div>
      <div className="topbar">
        <div style={{ fontWeight: 700, letterSpacing: 0.3 }}>ARSIP PERKARA</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!qrMode && (
            <button className="btn-secondary" onClick={toggleQrMode}>🔳 Cetak QR</button>
          )}
          {qrMode && (
            <>
              {selectedIds.length > 0 && (
                <button className="btn-primary" onClick={handleCetakTerpilih}>
                  🖨️ Cetak QR Terpilih ({selectedIds.length})
                </button>
              )}
              <button className="btn-secondary" onClick={toggleQrMode}>Batal</button>
            </>
          )}
          {bisaEdit && !qrMode && (
            <button className="btn-primary" onClick={() => router.push('/cari/upload')}>+ Upload</button>
          )}
        </div>
      </div>
      <div className="page-body">
        <form onSubmit={handleSearchSubmit} className="card" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '2 1 220px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Cari nomor perkara / nama pihak</label>
            <input
              className="input-field"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Contoh: 123/Pdt.G/2024 atau nama pihak"
            />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Jenis Perkara</label>
            <select className="input-field" value={jenisId} onChange={(e) => setJenisId(e.target.value)}>
              <option value="">Semua Jenis</option>
              {jenisOptions.map((j) => (
                <option key={j.id} value={j.id}>{j.nama}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '0 1 130px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Status</label>
            <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua</option>
              <option value="ada">Ada</option>
              <option value="dipinjam">Dipinjam</option>
            </select>
          </div>
          <div style={{ flex: '0 1 120px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Tahun</label>
            <input
              className="input-field"
              value={tahun}
              onChange={(e) => setTahun(e.target.value.replace(/\D/g, ''))}
              placeholder="2024"
              maxLength={4}
            />
          </div>
          <button className="btn-primary" type="submit">🔍 Cari</button>
        </form>

        <div className="card">
          <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {qrMode && <th></th>}
                <th>Nomor Perkara</th>
                <th>Jenis</th>
                <th>Status</th>
                <th>Nama Pihak</th>
                <th>Tanggal BHT</th>
                <th>Diunggah oleh</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((a) => {
                const badge = getBadgeStyle(a.jenisPerkaraUrutan || 0);
                return (
                <tr key={a.id}>
                  {qrMode && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(a.id)}
                        onChange={() => toggleSelect(a.id)}
                      />
                    </td>
                  )}
                  <td>{a.nomorPerkara}</td>
                  <td>
                    <span className="badge" style={{ background: badge.bg, color: badge.text }}>
                      {a.jenisPerkaraNama || 'Tidak diketahui'}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                        background: a.status === 'dipinjam' ? '#fff3e0' : '#e6f7ee',
                        color: a.status === 'dipinjam' ? '#b5680a' : '#146c4f',
                      }}
                    >
                      {a.status === 'dipinjam' ? 'Dipinjam' : 'Ada'}
                    </span>
                  </td>
                  <td>{a.namaPihak || '-'}</td>
                  <td>{formatTanggal(a.tanggalBht)}</td>
                  <td>{a.uploaderNama}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {!qrMode && (
                      <>
                        <button className="btn-secondary" style={{ padding: '6px 12px', marginRight: 6 }} onClick={() => router.push(`/cari/${a.id}`)}>
                          Detail
                        </button>
                        <a href={`/api/documents/${a.id}?mode=view`} target="_blank" rel="noreferrer" title="Lihat" className="pill-icon-btn">👁️</a>
                        <a href={`/api/documents/${a.id}?mode=download`} title="Download" className="pill-icon-btn">⬇️</a>
                        {bisaEdit && (
                          <>
                            <button
                              title="Edit"
                              className="pill-icon-btn primary"
                              onClick={() => router.push(`/cari/${a.id}/edit`)}
                            >
                              ✏️
                            </button>
                            <button
                              title="Hapus"
                              className="pill-icon-btn danger"
                              onClick={() => setHapusTarget({ id: a.id, nomorPerkara: a.nomorPerkara })}
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </td>
                </tr>
                );
              })}
              {!loading && result.data.length === 0 && (
                <tr><td colSpan={qrMode ? 8 : 7} style={{ color: '#889', textAlign: 'center', padding: 24 }}>Tidak ada arsip yang cocok.</td></tr>
              )}
            </tbody>
          </table>
          </div>

          {result.total > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 13, color: '#667' }}>
              <div>Total {result.total} arsip</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹ Sebelumnya</button>
                <span style={{ padding: '10px 4px' }}>Halaman {page} / {totalPages}</span>
                <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Berikutnya ›</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {hapusTarget && (
        <div className="modal-overlay" onClick={() => !deleting && setHapusTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Hapus Arsip?</div>
            <p style={{ fontSize: 14, color: '#556', marginBottom: 20 }}>
              Yakin ingin menghapus arsip <strong>{hapusTarget.nomorPerkara}</strong>? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setHapusTarget(null)} disabled={deleting}>
                Batal
              </button>
              <button className="btn-danger" style={{ padding: '10px 18px' }} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
