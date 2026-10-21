'use client';
import { useEffect, useState, useCallback } from 'react';

export default function JenisKesekretariatanList() {
  const [divisiList, setDivisiList] = useState([]);
  const [selectedDivisiId, setSelectedDivisiId] = useState('');
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [namaBaru, setNamaBaru] = useState('');
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [editNama, setEditNama] = useState('');
  const [hapusTarget, setHapusTarget] = useState(null);

  // Load divisions
  useEffect(() => {
    fetch('/api/divisi')
      .then((r) => r.json())
      .then((data) => {
        const list = data.data || [];
        setDivisiList(list);
        if (list.length > 0) {
          setSelectedDivisiId(String(list[0].id));
        }
      });
  }, []);

  // Load folders for selected division
  const loadFolders = useCallback(() => {
    if (!selectedDivisiId) return;
    setLoading(true);
    fetch(`/api/jenis-kesekretariatan?divisiId=${selectedDivisiId}`)
      .then((r) => r.json())
      .then((data) => {
        setFolders(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedDivisiId]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!namaBaru.trim()) return;
    setError('');

    const res = await fetch('/api/jenis-kesekretariatan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: namaBaru.trim(), divisiId: parseInt(selectedDivisiId, 10) }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Gagal menambahkan folder.');
      return;
    }
    setNamaBaru('');
    loadFolders();
  }

  async function handleRename(id) {
    if (!editNama.trim()) return;
    const res = await fetch(`/api/jenis-kesekretariatan/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: editNama.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Gagal mengubah nama folder.');
      return;
    }
    setEditId(null);
    loadFolders();
  }

  async function handleDelete(id) {
    const res = await fetch(`/api/jenis-kesekretariatan/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Gagal menghapus folder.');
      return;
    }
    setHapusTarget(null);
    loadFolders();
  }

  const activeDivisi = divisiList.find((d) => String(d.id) === String(selectedDivisiId));

  return (
    <div className="stitch-card" style={{ marginBottom: 28 }}>
      {/* Header Kesekretariatan */}
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
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>folder_special</span>
          </div>
          <div>
            <h2 className="stitch-card-title">Folder Arsip Kesekretariatan</h2>
            <p className="stitch-card-subtitle">Kelola struktur folder per divisi (Kepegawaian & Ortala, Umum & Keuangan, PTIP)</p>
          </div>
        </div>
        {activeDivisi && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: 999,
              background: '#eaf7ed',
              color: 'var(--hijau)',
            }}
          >
            {folders.length} Folder Aktif
          </span>
        )}
      </div>

      {/* Division Selector */}
      <div
        style={{
          marginBottom: 20,
          padding: '12px 14px',
          background: '#f4f6f5',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teks-muted)', textTransform: 'uppercase' }}>
          Pilih Divisi:
        </span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {divisiList.map((d) => {
            const isSelected = selectedDivisiId === String(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDivisiId(String(d.id))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  border: isSelected ? 'none' : '1px solid #dce8e1',
                  background: isSelected ? 'var(--hijau-tua)' : '#ffffff',
                  color: isSelected ? '#ffffff' : 'var(--teks)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>folder</span>
                <span>{d.nama}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeDivisi && (
        <>
          {/* Form Add Folder */}
          <form
            onSubmit={handleAdd}
            style={{
              display: 'flex',
              gap: 10,
              background: '#f4f6f5',
              padding: '10px 12px',
              borderRadius: 10,
              marginBottom: 18,
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
                create_new_folder
              </span>
              <input
                className="input-field"
                value={namaBaru}
                onChange={(e) => setNamaBaru(e.target.value)}
                placeholder={`Nama folder baru untuk ${activeDivisi.nama} (misal: SK, Surat Tugas, Cuti)...`}
                style={{
                  paddingLeft: 36,
                  background: '#ffffff',
                  border: '1px solid #e2e6e4',
                  borderRadius: 8,
                  fontSize: 13,
                }}
                required
              />
            </div>
            <button
              className="btn-primary"
              type="submit"
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
              <span>Tambah Folder</span>
            </button>
          </form>

          {error && <div className="error-text" style={{ marginBottom: 14 }}>{error}</div>}

          {/* Folders Table */}
          <div className="table-scroll" style={{ borderRadius: 8, border: '1px solid var(--border)' }}>
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Nama Folder / Sub-Kategori ({activeDivisi.nama})</th>
                  <th style={{ width: 140, textAlign: 'right' }}>Jumlah Berkas</th>
                  <th style={{ width: 120, textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {folders.map((f) => (
                  <tr key={f.id}>
                    <td>
                      {editId === f.id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            className="input-field"
                            value={editNama}
                            onChange={(e) => setEditNama(e.target.value)}
                            style={{ padding: '6px 8px', fontSize: 13 }}
                            autoFocus
                          />
                          <button
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: 12 }}
                            onClick={() => handleRename(f.id)}
                          >
                            Simpan
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: 12 }}
                            onClick={() => setEditId(null)}
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 20, color: 'var(--hijau-terang)' }}
                          >
                            folder
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--teks)' }}>{f.nama}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--hijau)',
                          background: '#eaf7ed',
                          padding: '3px 10px',
                          borderRadius: 999,
                        }}
                      >
                        {f.jumlahArsip || 0} Dokumen
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {editId !== f.id && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            className="pill-icon-btn primary"
                            title="Ubah Nama"
                            onClick={() => {
                              setEditId(f.id);
                              setEditNama(f.nama);
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                          </button>
                          <button
                            className="pill-icon-btn danger"
                            title="Hapus"
                            onClick={() => setHapusTarget(f)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && folders.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ color: '#889', textAlign: 'center', padding: 24 }}>
                      Belum ada folder di divisi ini. Silahkan tambahkan folder baru di atas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal Confirm Delete */}
      {hapusTarget && (
        <div className="modal-overlay" onClick={() => setHapusTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>Hapus Folder?</div>
            <p style={{ fontSize: 14, color: '#556', marginBottom: 20 }}>
              Yakin ingin menghapus folder <strong>"{hapusTarget.nama}"</strong>?
              {hapusTarget.jumlahArsip > 0 && (
                <span style={{ color: '#c53030', display: 'block', marginTop: 8 }}>
                  ⚠️ Folder ini masih memiliki {hapusTarget.jumlahArsip} dokumen!
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setHapusTarget(null)}>Batal</button>
              <button
                className="btn-danger"
                style={{ padding: '10px 18px' }}
                onClick={() => handleDelete(hapusTarget.id)}
                disabled={hapusTarget.jumlahArsip > 0}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
