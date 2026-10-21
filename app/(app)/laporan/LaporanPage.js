'use client';
import { useEffect, useState, useCallback } from 'react';
const { NAMA_BULAN } = require('../../lib/bulan');

const CURRENT_YEAR = new Date().getFullYear();
const emptyForm = { namaDokumen: '', bulan: '', tahun: CURRENT_YEAR, jenisLaporanId: '', file: null };

export default function LaporanPage({ role }) {
  const [tahun, setTahun] = useState(CURRENT_YEAR);
  const [grid, setGrid] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jenisOptions, setJenisOptions] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [currentFileInfo, setCurrentFileInfo] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [actionCell, setActionCell] = useState(null); // { arsipId, namaDokumen, jenisLaporanId, jenisNama, bulan }
  const [hapusTarget, setHapusTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const bisaEdit = role !== 'staf_umum';

  useEffect(() => {
    fetch('/api/jenis-laporan')
      .then((r) => r.json())
      .then((data) => setJenisOptions(data.data || []));
  }, []);

  const loadGrid = useCallback(() => {
    setLoading(true);
    fetch(`/api/laporan/grid?tahun=${tahun}`)
      .then((r) => r.json())
      .then((data) => {
        setGrid(data.grid || []);
        setLoading(false);
      });
  }, [tahun]);

  useEffect(() => {
    loadGrid();
  }, [loadGrid]);

  function openUploadFor(jenisLaporanId, bulan) {
    setForm({ ...emptyForm, jenisLaporanId: String(jenisLaporanId), bulan: String(bulan), tahun });
    setEditId(null);
    setCurrentFileInfo(null);
    setFormError('');
    setShowForm(true);
  }

  function openUploadFree() {
    setForm({ ...emptyForm, tahun, jenisLaporanId: jenisOptions[0] ? String(jenisOptions[0].id) : '' });
    setEditId(null);
    setCurrentFileInfo(null);
    setFormError('');
    setShowForm(true);
  }

  async function openCellAction(jenis, bulanData) {
    setActionCell({ arsipId: bulanData.arsipId, namaDokumen: bulanData.namaDokumen, jenisLaporanId: jenis.jenisLaporanId, jenisNama: jenis.nama, bulan: bulanData.bulan });
  }

  async function handleEditFromAction() {
    const res = await fetch(`/api/laporan/${actionCell.arsipId}?mode=meta`);
    const data = await res.json();
    const a = data.data;
    setForm({ namaDokumen: a.namaDokumen, bulan: String(a.bulan), tahun: a.tahun, jenisLaporanId: String(a.jenisLaporanId), file: null });
    setCurrentFileInfo({ fileName: a.fileName, fileSize: a.fileSize, id: a.id });
    setEditId(a.id);
    setFormError('');
    setActionCell(null);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!editId && !form.file) {
      setFormError('Pilih file PDF terlebih dahulu.');
      return;
    }
    if (form.file && form.file.type !== 'application/pdf') {
      setFormError('File harus berformat PDF.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('namaDokumen', form.namaDokumen);
    formData.append('bulan', form.bulan);
    formData.append('tahun', form.tahun);
    formData.append('jenisLaporanId', form.jenisLaporanId);
    if (form.file) formData.append('file', form.file);

    const url = editId ? `/api/laporan/${editId}` : '/api/laporan';
    const method = editId ? 'PATCH' : 'POST';

    const res = await fetch(url, { method, body: formData });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setFormError(data.error || 'Gagal menyimpan.');
      return;
    }
    setShowForm(false);
    loadGrid();
  }

  async function handleDelete() {
    if (!hapusTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/laporan/${hapusTarget.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) {
      setHapusTarget(null);
      loadGrid();
    } else {
      const data = await res.json();
      alert(data.error || 'Gagal menghapus laporan.');
    }
  }

  return (
    <div>
      <div className="topbar">
        <div style={{ fontWeight: 700, letterSpacing: 0.3 }}>ARSIP LAPORAN</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 13, color: '#667', fontWeight: 600 }}>Tahun</label>
          <select className="input-field" style={{ width: 110 }} value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
            {Array.from({ length: 8 }, (_, i) => CURRENT_YEAR - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {bisaEdit && <button className="btn-primary" onClick={openUploadFree}>+ Upload</button>}
        </div>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: 'white' }}>Jenis Laporan</th>
                {NAMA_BULAN.map((b, i) => (
                  <th key={i} style={{ textAlign: 'center', minWidth: 46 }}>{b.slice(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((jenis) => (
                <tr key={jenis.jenisLaporanId}>
                  <td style={{ fontWeight: 600, position: 'sticky', left: 0, background: 'white', whiteSpace: 'nowrap' }}>{jenis.nama}</td>
                  {jenis.bulan.map((b) => (
                    <td key={b.bulan} style={{ textAlign: 'center', padding: 6 }}>
                      <button
                        onClick={() =>
                          b.sudahUpload
                            ? openCellAction(jenis, b)
                            : bisaEdit && openUploadFor(jenis.jenisLaporanId, b.bulan)
                        }
                        title={b.sudahUpload ? b.namaDokumen : (bisaEdit ? 'Klik untuk upload' : 'Belum ada')}
                        style={{
                          width: 34, height: 34, borderRadius: 8, border: 'none', cursor: b.sudahUpload || bisaEdit ? 'pointer' : 'default',
                          background: b.sudahUpload ? '#e6f7ee' : '#f4f6f5',
                          color: b.sudahUpload ? '#146c4f' : '#c3cac6',
                          fontSize: 16, fontWeight: 700,
                        }}
                      >
                        {b.sudahUpload ? '✓' : '·'}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && grid.length === 0 && (
                <tr><td colSpan={13} style={{ color: '#889', textAlign: 'center', padding: 24 }}>Belum ada jenis laporan terdaftar.</td></tr>
              )}
            </tbody>
          </table>
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: '#889' }}>
            ✓ hijau = sudah diunggah &nbsp;·&nbsp; titik abu = belum ada{bisaEdit ? ' (klik untuk upload langsung)' : ''}
          </div>
        </div>
      </div>

      {actionCell && (
        <div className="modal-overlay" onClick={() => setActionCell(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{actionCell.jenisNama} — {NAMA_BULAN[actionCell.bulan - 1]}</div>
            <div style={{ fontSize: 14, color: '#556', marginBottom: 20 }}>{actionCell.namaDokumen}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href={`/api/laporan/${actionCell.arsipId}?mode=view`} target="_blank" rel="noreferrer" className="btn-secondary">👁️ Lihat</a>
              <a href={`/api/laporan/${actionCell.arsipId}?mode=download`} className="btn-secondary">⬇️ Download</a>
              {bisaEdit && (
                <>
                  <button className="btn-secondary" onClick={handleEditFromAction}>✏️ Edit</button>
                  <button
                    className="btn-danger"
                    onClick={() => { setHapusTarget({ id: actionCell.arsipId, namaDokumen: actionCell.namaDokumen }); setActionCell(null); }}
                  >
                    🗑️ Hapus
                  </button>
                </>
              )}
            </div>
            <div style={{ marginTop: 16 }}>
              <button className="btn-secondary" onClick={() => setActionCell(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => !submitting && setShowForm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{editId ? 'Edit Laporan' : 'Upload Laporan'}</div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Nama Laporan *</label>
                <input
                  className="input-field"
                  value={form.namaDokumen}
                  onChange={(e) => setForm({ ...form, namaDokumen: e.target.value })}
                  required
                />
              </div>
              <div className="form-grid-2" style={{ marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Bulan *</label>
                  <select className="input-field" value={form.bulan} onChange={(e) => setForm({ ...form, bulan: e.target.value })} required>
                    <option value="">Pilih bulan</option>
                    {NAMA_BULAN.map((b, i) => (
                      <option key={i} value={i + 1}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Tahun *</label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.tahun}
                    onChange={(e) => setForm({ ...form, tahun: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Jenis Laporan *</label>
                <select className="input-field" value={form.jenisLaporanId} onChange={(e) => setForm({ ...form, jenisLaporanId: e.target.value })}>
                  {jenisOptions.map((j) => (
                    <option key={j.id} value={j.id}>{j.nama}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>File PDF {editId ? '' : '*'}</label>
                {currentFileInfo && (
                  <div style={{ fontSize: 13, marginBottom: 8 }}>
                    <a href={`/api/laporan/${currentFileInfo.id}?mode=view`} target="_blank" rel="noreferrer" style={{ color: 'var(--hijau-tua)', fontWeight: 600 }}>
                      👁️ Lihat file saat ini
                    </a>
                  </div>
                )}
                <input type="file" accept="application/pdf" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} />
                {editId && <div style={{ fontSize: 12, color: '#889', marginTop: 4 }}>Kosongkan kalau tidak ingin mengganti file.</div>}
              </div>
              {formError && <div className="error-text" style={{ marginBottom: 12 }}>{formError}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {hapusTarget && (
        <div className="modal-overlay" onClick={() => !deleting && setHapusTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Hapus Laporan?</div>
            <p style={{ fontSize: 14, color: '#556', marginBottom: 20 }}>
              Yakin ingin menghapus <strong>{hapusTarget.namaDokumen}</strong>? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setHapusTarget(null)} disabled={deleting}>Batal</button>
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
