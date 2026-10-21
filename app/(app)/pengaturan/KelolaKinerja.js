'use client';
import { useEffect, useState, useCallback } from 'react';

const CURRENT_YEAR = new Date().getFullYear();
const emptyIndikatorForm = { sasaranId: null, nama: '', tipeInput: 2, labelInput1: '', labelInput2: '' };
const ICON_BTN = { fontSize: 13, padding: '6px 10px', lineHeight: 1 };

export default function KelolaKinerja() {
  const [sasaranList, setSasaranList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [namaSasaranBaru, setNamaSasaranBaru] = useState('');
  const [editSasaranId, setEditSasaranId] = useState(null);
  const [editSasaranNama, setEditSasaranNama] = useState('');

  const [indikatorForm, setIndikatorForm] = useState(null); // { ...emptyIndikatorForm, id? }
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hapusTarget, setHapusTarget] = useState(null); // { tipe: 'sasaran'|'indikator', id, nama }
  const [deleteError, setDeleteError] = useState('');

  const [tahunTarget, setTahunTarget] = useState(CURRENT_YEAR);
  const [targetMap, setTargetMap] = useState({});
  const [savingTargetId, setSavingTargetId] = useState(null);
  const [savedTargetId, setSavedTargetId] = useState(null);

  const [penandatangan, setPenandatangan] = useState({ namaPenandatangan: '', nipPenandatangan: '' });
  const [savingTtd, setSavingTtd] = useState(false);
  const [ttdSaved, setTtdSaved] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/kinerja/sasaran')
      .then((r) => r.json())
      .then(async (res) => {
        const list = res.data || [];
        const detail = await fetch(`/api/kinerja?tahun=${tahunTarget}&semua=1`).then((r) => r.json());
        const merged = list.map((s) => {
          const found = (detail.data || []).find((d) => d.id === s.id);
          return { ...s, indikator: found ? found.indikator : [] };
        });
        setSasaranList(merged);
        const tMap = {};
        (detail.data || []).forEach((s) => s.indikator.forEach((i) => { tMap[i.id] = i.target ?? ''; }));
        setTargetMap(tMap);
        setLoading(false);
      });
  }, [tahunTarget]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch('/api/kinerja/penandatangan')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setPenandatangan({ namaPenandatangan: res.data.namaPenandatangan || '', nipPenandatangan: res.data.nipPenandatangan || '' });
      });
  }, []);

  async function handleTambahSasaran(e) {
    e.preventDefault();
    if (!namaSasaranBaru.trim()) return;
    const res = await fetch('/api/kinerja/sasaran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: namaSasaranBaru.trim() }),
    });
    if (res.ok) {
      setNamaSasaranBaru('');
      load();
    } else {
      const data = await res.json();
      alert(data.error || 'Gagal menambahkan sasaran.');
    }
  }

  async function handleMoveSasaran(id, arah) {
    await fetch(`/api/kinerja/sasaran/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ arah }),
    });
    load();
  }

  async function handleToggleAktifSasaran(sasaran) {
    await fetch(`/api/kinerja/sasaran/${sasaran.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aktif: !sasaran.aktif }),
    });
    load();
  }

  async function handleToggleAktifIndikator(indikator) {
    await fetch(`/api/kinerja/indikator/${indikator.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aktif: !indikator.aktif }),
    });
    load();
  }

  async function handleSaveRenameSasaran(id) {
    const res = await fetch(`/api/kinerja/sasaran/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: editSasaranNama }),
    });
    if (res.ok) {
      setEditSasaranId(null);
      load();
    } else {
      const data = await res.json();
      alert(data.error || 'Gagal mengubah nama sasaran.');
    }
  }

  async function handleMoveIndikator(id, arah) {
    await fetch(`/api/kinerja/indikator/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ arah }),
    });
    load();
  }

  function openTambahIndikator(sasaranId) {
    setIndikatorForm({ ...emptyIndikatorForm, sasaranId });
    setFormError('');
  }

  function openEditIndikator(indikator) {
    setIndikatorForm({
      id: indikator.id,
      sasaranId: indikator.sasaranId,
      nama: indikator.nama,
      tipeInput: indikator.tipeInput,
      labelInput1: indikator.labelInput1,
      labelInput2: indikator.labelInput2 || '',
    });
    setFormError('');
  }

  async function handleSubmitIndikator(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const url = indikatorForm.id ? `/api/kinerja/indikator/${indikatorForm.id}` : '/api/kinerja/indikator';
    const method = indikatorForm.id ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(indikatorForm),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setFormError(data.error || 'Gagal menyimpan indikator.');
      return;
    }
    setIndikatorForm(null);
    load();
  }

  async function handleDelete() {
    if (!hapusTarget) return;
    setDeleteError('');
    const url = hapusTarget.tipe === 'sasaran' ? `/api/kinerja/sasaran/${hapusTarget.id}` : `/api/kinerja/indikator/${hapusTarget.id}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (res.ok) {
      setHapusTarget(null);
      load();
    } else {
      const data = await res.json();
      setDeleteError(data.error || 'Gagal menghapus.');
    }
  }

  async function handleSaveTarget(indikatorId) {
    const target = targetMap[indikatorId];
    if (target === '' || target === undefined) return; // belum diisi, jangan simpan/alert
    if (isNaN(Number(target))) {
      alert('Target harus berupa angka.');
      return;
    }
    setSavingTargetId(indikatorId);
    setSavedTargetId(null);
    await fetch('/api/kinerja/target', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ indikatorId, tahun: tahunTarget, target: Number(target) }),
    });
    setSavingTargetId(null);
    setSavedTargetId(indikatorId);
    setTimeout(() => setSavedTargetId((cur) => (cur === indikatorId ? null : cur)), 2000);
  }

  async function handleSaveTtd(e) {
    e.preventDefault();
    setSavingTtd(true);
    setTtdSaved(false);
    const res = await fetch('/api/kinerja/penandatangan', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(penandatangan),
    });
    setSavingTtd(false);
    if (res.ok) {
      setTtdSaved(true);
      setTimeout(() => setTtdSaved(false), 2500);
    } else {
      const data = await res.json();
      alert(data.error || 'Gagal menyimpan.');
    }
  }

  if (loading) return <div style={{ padding: 20, color: '#889' }}>Memuat...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Card 1: Sasaran & Indikator Kinerja */}
      <div className="stitch-card">
        <div className="stitch-card-header" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#eaf7ed',
                color: 'var(--hijau)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>tune</span>
            </div>
            <div>
              <h2 className="stitch-card-title">Sasaran & Indikator Kinerja (IKU)</h2>
              <p className="stitch-card-subtitle">
                Konfigurasi sasaran strategis, rumus indikator, dan target tahunan instansi
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teks-muted)' }}>Target Tahun:</span>
            <select
              className="dashboard-select"
              style={{ padding: '6px 28px 6px 12px', fontSize: 12 }}
              value={tahunTarget}
              onChange={(e) => setTahunTarget(Number(e.target.value))}
            >
              {Array.from({ length: 8 }, (_, i) => CURRENT_YEAR - i + 1).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Form Tambah Sasaran */}
        <form
          onSubmit={handleTambahSasaran}
          style={{
            display: 'flex',
            gap: 10,
            background: '#f4f6f5',
            padding: '10px 12px',
            borderRadius: 10,
            marginBottom: 20,
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#889',
                fontSize: 18,
              }}
            >
              flag
            </span>
            <input
              className="input-field"
              placeholder="Nama sasaran kinerja baru (contoh: Terwujudnya Peradilan yang Pasti, Transparan dan Akuntabel)..."
              value={namaSasaranBaru}
              onChange={(e) => setNamaSasaranBaru(e.target.value)}
              style={{
                paddingLeft: 36,
                background: '#ffffff',
                border: '1px solid #e2e6e4',
                borderRadius: 8,
                fontSize: 13,
              }}
            />
          </div>
          <button
            className="btn-primary"
            style={{
              background: 'var(--hijau-terang)',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 18px',
              fontSize: 13,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            <span>Tambah Sasaran</span>
          </button>
        </form>

        {sasaranList.map((sasaran, idx) => (
          <div
            key={sasaran.id}
            style={{
              marginBottom: 16,
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '16px 18px',
              background: '#ffffff',
            }}
          >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {editSasaranId === sasaran.id ? (
              <>
                <input className="input-field" value={editSasaranNama} onChange={(e) => setEditSasaranNama(e.target.value)} style={{ flex: 1 }} />
                <button className="btn-primary" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => handleSaveRenameSasaran(sasaran.id)}>Simpan</button>
                <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => setEditSasaranId(null)}>Batal</button>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, flex: 1, color: sasaran.aktif ? 'inherit' : '#aab', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {sasaran.nama}
                  {!sasaran.aktif && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#b5680a', background: '#fff3e0', padding: '2px 8px', borderRadius: 999 }}>
                      Nonaktif
                    </span>
                  )}
                </div>
                <button
                  className="btn-secondary"
                  style={{ ...ICON_BTN, whiteSpace: 'nowrap' }}
                  onClick={() => handleToggleAktifSasaran(sasaran)}
                  title={sasaran.aktif ? 'Nonaktifkan sasaran ini' : 'Aktifkan kembali sasaran ini'}
                >
                  {sasaran.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button className="btn-secondary" style={ICON_BTN} disabled={idx === 0} onClick={() => handleMoveSasaran(sasaran.id, 'naik')}>▲</button>
                <button className="btn-secondary" style={ICON_BTN} disabled={idx === sasaranList.length - 1} onClick={() => handleMoveSasaran(sasaran.id, 'turun')}>▼</button>
                <button className="btn-secondary" style={ICON_BTN} onClick={() => { setEditSasaranId(sasaran.id); setEditSasaranNama(sasaran.nama); }}>✏️</button>
                <button className="btn-danger" style={ICON_BTN} onClick={() => { setDeleteError(''); setHapusTarget({ tipe: 'sasaran', id: sasaran.id, nama: sasaran.nama }); }}>🗑️</button>
              </>
            )}
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Indikator</th>
                  <th style={{ textAlign: 'center' }}>Tipe</th>
                  <th style={{ textAlign: 'center', width: 110 }}>Target {tahunTarget}</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Urutan</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sasaran.indikator.map((indikator, iIdx) => (
                  <tr key={indikator.id} style={{ opacity: indikator.aktif ? 1 : 0.6 }}>
                    <td>
                      {indikator.nama}
                      {!indikator.aktif && (
                        <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#b5680a', background: '#fff3e0', padding: '2px 8px', borderRadius: 999 }}>
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>{indikator.tipeInput === 2 ? '2 input' : '1 input'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                        <input
                          type="number"
                          step="any"
                          className="input-field"
                          style={{ width: 70 }}
                          value={targetMap[indikator.id] ?? ''}
                          onChange={(e) => { setTargetMap((prev) => ({ ...prev, [indikator.id]: e.target.value })); setSavedTargetId(null); }}
                          onBlur={() => handleSaveTarget(indikator.id)}
                        />
                        {savingTargetId === indikator.id && <span style={{ fontSize: 11, color: '#889' }}>...</span>}
                        {savedTargetId === indikator.id && <span style={{ fontSize: 13, color: '#146c4f' }}>✓</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: 12, padding: '5px 10px', whiteSpace: 'nowrap' }}
                        onClick={() => handleToggleAktifIndikator(indikator)}
                        title={indikator.aktif ? 'Nonaktifkan indikator ini' : 'Aktifkan kembali indikator ini'}
                      >
                        {indikator.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-secondary" style={ICON_BTN} disabled={iIdx === 0} onClick={() => handleMoveIndikator(indikator.id, 'naik')}>▲</button>
                      <button className="btn-secondary" style={{ ...ICON_BTN, marginLeft: 4 }} disabled={iIdx === sasaran.indikator.length - 1} onClick={() => handleMoveIndikator(indikator.id, 'turun')}>▼</button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-secondary" style={ICON_BTN} onClick={() => openEditIndikator(indikator)}>✏️</button>
                      <button
                        className="btn-danger"
                        style={{ ...ICON_BTN, marginLeft: 4 }}
                        onClick={() => { setDeleteError(''); setHapusTarget({ tipe: 'indikator', id: indikator.id, nama: indikator.nama }); }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                {sasaran.indikator.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#889', padding: 12 }}>Belum ada indikator.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <button className="btn-secondary" style={{ marginTop: 10, fontSize: 12 }} onClick={() => openTambahIndikator(sasaran.id)}>+ Tambah Indikator</button>
        </div>
      ))}

      {sasaranList.length === 0 && (
        <div style={{ textAlign: 'center', color: '#889', padding: 24 }}>Belum ada sasaran kinerja.</div>
      )}
      </div>

      {/* Card 2: Pejabat Penandatangan Laporan (Stitch Card 2) */}
      <div className="stitch-card">
        <div className="stitch-card-header" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#eaf7ed',
                color: 'var(--hijau)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>draw</span>
            </div>
            <div>
              <h2 className="stitch-card-title">Pejabat Penandatangan Laporan</h2>
              <p className="stitch-card-subtitle">
                Otoritas pengesahan dokumen capaian kinerja & arsip digital
              </p>
            </div>
          </div>
          {ttdSaved && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--hijau)',
                background: '#e6f7ee',
                padding: '4px 12px',
                borderRadius: 999,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
              <span>Perubahan Disimpan</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSaveTtd} style={{ maxWidth: 520 }}>
          <div
            style={{
              padding: '16px',
              borderRadius: 10,
              background: '#f4f6f5',
              marginBottom: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--hijau-tua)' }}>
                Ketua Pengadilan Agama
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: '#eaf7ed',
                  color: 'var(--hijau)',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                Penanggung Jawab Utama
              </span>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4, color: 'var(--teks-muted)' }}>
                Nama Lengkap & Gelar *
              </label>
              <input
                className="input-field"
                value={penandatangan.namaPenandatangan}
                onChange={(e) => setPenandatangan((p) => ({ ...p, namaPenandatangan: e.target.value }))}
                style={{ background: '#ffffff', border: '1px solid #e2e6e4', borderRadius: 8 }}
                placeholder="Dr. H. Ahmad Fauzi, S.Ag., M.H."
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4, color: 'var(--teks-muted)' }}>
                Nomor Induk Pegawai (NIP)
              </label>
              <input
                className="input-field"
                value={penandatangan.nipPenandatangan}
                onChange={(e) => setPenandatangan((p) => ({ ...p, nipPenandatangan: e.target.value }))}
                style={{ background: '#ffffff', border: '1px solid #e2e6e4', borderRadius: 8 }}
                placeholder="19730514 199903 1 002"
              />
            </div>
          </div>

          <button
            className="btn-primary"
            disabled={savingTtd}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 18px',
              fontSize: 13,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
            <span>{savingTtd ? 'Menyimpan...' : 'Perbarui Pejabat'}</span>
          </button>
        </form>
      </div>

      {indikatorForm && (
        <div className="modal-overlay" onClick={() => !submitting && setIndikatorForm(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{indikatorForm.id ? 'Edit Indikator Kinerja' : 'Tambah Indikator Kinerja'}</div>
            <form onSubmit={handleSubmitIndikator}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Nama Indikator *</label>
                <input
                  className="input-field"
                  value={indikatorForm.nama}
                  onChange={(e) => setIndikatorForm({ ...indikatorForm, nama: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Tipe Input *</label>
                <select
                  className="input-field"
                  value={indikatorForm.tipeInput}
                  onChange={(e) => setIndikatorForm({ ...indikatorForm, tipeInput: Number(e.target.value) })}
                >
                  <option value={2}>2 input (pembanding, dihitung Realisasi% & Capaian%)</option>
                  <option value={1}>1 input (langsung dibandingkan ke Target)</option>
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  {Number(indikatorForm.tipeInput) === 2 ? 'Label Input Pertama (Pembilang) *' : 'Label Input *'}
                </label>
                <input
                  className="input-field"
                  value={indikatorForm.labelInput1}
                  onChange={(e) => setIndikatorForm({ ...indikatorForm, labelInput1: e.target.value })}
                  placeholder="mis. Jumlah perkara yang diselesaikan tepat waktu"
                  required
                />
              </div>
              {Number(indikatorForm.tipeInput) === 2 && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Label Input Kedua (Penyebut) *</label>
                  <input
                    className="input-field"
                    value={indikatorForm.labelInput2}
                    onChange={(e) => setIndikatorForm({ ...indikatorForm, labelInput2: e.target.value })}
                    placeholder="mis. Jumlah perkara yang diselesaikan"
                    required
                  />
                </div>
              )}
              {formError && <div className="error-text" style={{ marginBottom: 12 }}>{formError}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>
                <button type="button" className="btn-secondary" onClick={() => setIndikatorForm(null)}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {hapusTarget && (
        <div className="modal-overlay" onClick={() => setHapusTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>
              Hapus {hapusTarget.tipe === 'sasaran' ? 'Sasaran' : 'Indikator'} Kinerja?
            </div>
            <p style={{ fontSize: 14, color: '#556', marginBottom: 16 }}>
              Yakin ingin menghapus <strong>{hapusTarget.nama}</strong>?
            </p>
            {deleteError && <div className="error-text" style={{ marginBottom: 12 }}>{deleteError}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setHapusTarget(null)}>Batal</button>
              <button className="btn-danger" style={{ padding: '10px 18px' }} onClick={handleDelete}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
