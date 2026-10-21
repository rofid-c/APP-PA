'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { formatTanggal } from '../../../lib/formatDate';

function formatUkuran(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const emptyDocForm = { namaDokumen: '', jenisArsipId: '', file: null };

export default function KesekretariatanPage({ divisi, role }) {
  const [q, setQ] = useState('');
  const [jenisId, setJenisId] = useState(''); // active folder ID
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], total: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);

  // Modals
  const [showDocModal, setShowDocModal] = useState(false);
  const [editDocId, setEditDocId] = useState(null);
  const [docForm, setDocForm] = useState(emptyDocForm);
  const [currentFileInfo, setCurrentFileInfo] = useState(null);
  const [docFormError, setDocFormError] = useState('');
  const [submittingDoc, setSubmittingDoc] = useState(false);

  // Folder modal (add/rename)
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editFolderId, setEditFolderId] = useState(null);
  const [folderNama, setFolderNama] = useState('');
  const [folderError, setFolderError] = useState('');
  const [submittingFolder, setSubmittingFolder] = useState(false);

  // Delete modals
  const [hapusDocTarget, setHapusDocTarget] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(false);
  const [hapusFolderTarget, setHapusFolderTarget] = useState(null);
  const [deletingFolder, setDeletingFolder] = useState(false);
  const [syncingGdriveId, setSyncingGdriveId] = useState(null);

  const bisaEdit = role !== 'staf_umum';

  const loadFolders = useCallback(() => {
    fetch(`/api/jenis-kesekretariatan?divisiId=${divisi.id}`)
      .then((r) => r.json())
      .then((data) => {
        setFolders(data.data || []);
      })
      .catch(() => {});
  }, [divisi.id]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const loadDocuments = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('divisiId', String(divisi.id));
    if (q) params.set('q', q);
    if (jenisId) params.set('jenisId', jenisId);
    params.set('page', String(page));

    fetch(`/api/kesekretariatan?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [divisi.id, q, jenisId, page]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    loadDocuments();
  }

  // Folder selection
  function handleSelectFolder(id) {
    setJenisId(id === jenisId ? '' : String(id));
    setPage(1);
  }

  // Open add document modal
  function openAddDoc(prefillJenisId = null) {
    const defaultFolderId = prefillJenisId || jenisId || (folders[0] ? String(folders[0].id) : '');
    setDocForm({ ...emptyDocForm, jenisArsipId: defaultFolderId });
    setEditDocId(null);
    setCurrentFileInfo(null);
    setDocFormError('');
    setShowDocModal(true);
  }

  // Open edit document modal
  function openEditDoc(item) {
    setDocForm({ namaDokumen: item.namaDokumen, jenisArsipId: String(item.jenisArsipId), file: null });
    setEditDocId(item.id);
    setCurrentFileInfo({ fileName: item.fileName, fileSize: item.fileSize, id: item.id });
    setDocFormError('');
    setShowDocModal(true);
  }

  // Save document
  async function handleSubmitDoc(e) {
    e.preventDefault();
    setDocFormError('');

    if (!editDocId && !docForm.file) {
      setDocFormError('Pilih file PDF terlebih dahulu.');
      return;
    }
    if (docForm.file && docForm.file.type !== 'application/pdf') {
      setDocFormError('File harus berformat PDF.');
      return;
    }

    setSubmittingDoc(true);
    const formData = new FormData();
    formData.append('namaDokumen', docForm.namaDokumen);
    formData.append('jenisArsipId', docForm.jenisArsipId);
    formData.append('divisiId', String(divisi.id));
    if (docForm.file) formData.append('file', docForm.file);

    const url = editDocId ? `/api/kesekretariatan/${editDocId}` : '/api/kesekretariatan';
    const method = editDocId ? 'PATCH' : 'POST';

    const res = await fetch(url, { method, body: formData });
    const data = await res.json();
    setSubmittingDoc(false);

    if (!res.ok) {
      setDocFormError(data.error || 'Gagal menyimpan dokumen.');
      return;
    }
    setShowDocModal(false);
    loadFolders();
    loadDocuments();
  }

  // Delete document
  async function handleDeleteDoc() {
    if (!hapusDocTarget) return;
    setDeletingDoc(true);
    const res = await fetch(`/api/kesekretariatan/${hapusDocTarget.id}`, { method: 'DELETE' });
    setDeletingDoc(false);
    if (res.ok) {
      setHapusDocTarget(null);
      loadFolders();
      loadDocuments();
    } else {
      const data = await res.json();
      alert(data.error || 'Gagal menghapus arsip.');
    }
  }

  // Upload manual dokumen ke Google Drive via tombol
  async function handleSyncGdrive(item) {
    setSyncingGdriveId(item.id);
    try {
      const res = await fetch(`/api/kesekretariatan/${item.id}/sync-gdrive`, { method: 'POST' });
      const data = await res.json();
      setSyncingGdriveId(null);
      if (res.ok) {
        alert('✅ Dokumen berhasil diunggah ke Google Drive!');
        loadDocuments();
      } else {
        if (data.needManualUpload) {
          const buka = confirm(
            `Pemberitahuan:\nAkun Google Drive pribadi memerlukan izin langsung untuk upload otomatis (Service Account Google dibatasi kuota oleh Google).\n\nApakah Anda ingin membuka folder Google Drive tujuan sekarang?`
          );
          if (buka) {
            window.open(data.folderUrl, '_blank');
          }
        } else {
          alert(data.error || 'Gagal mengunggah ke Google Drive.');
        }
      }
    } catch (e) {
      setSyncingGdriveId(null);
      alert('Terjadi kesalahan saat mengunggah ke Google Drive.');
    }
  }

  // Open Folder Modal (Add)
  function openAddFolderModal() {
    setEditFolderId(null);
    setFolderNama('');
    setFolderError('');
    setShowFolderModal(true);
  }

  // Open Folder Modal (Edit)
  function openEditFolderModal(f) {
    setEditFolderId(f.id);
    setFolderNama(f.nama);
    setFolderError('');
    setShowFolderModal(true);
  }

  // Save Folder (Add / Rename)
  async function handleSaveFolder(e) {
    e.preventDefault();
    setFolderError('');
    if (!folderNama.trim()) {
      setFolderError('Nama folder wajib diisi.');
      return;
    }

    setSubmittingFolder(true);
    const url = editFolderId ? `/api/jenis-kesekretariatan/${editFolderId}` : '/api/jenis-kesekretariatan';
    const method = editFolderId ? 'PATCH' : 'POST';
    const body = editFolderId ? { nama: folderNama.trim() } : { nama: folderNama.trim(), divisiId: divisi.id };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSubmittingFolder(false);

    if (!res.ok) {
      setFolderError(data.error || 'Gagal menyimpan folder.');
      return;
    }

    setShowFolderModal(false);
    loadFolders();
    loadDocuments();
  }

  // Delete Folder
  async function handleDeleteFolder() {
    if (!hapusFolderTarget) return;
    setDeletingFolder(true);
    const res = await fetch(`/api/jenis-kesekretariatan/${hapusFolderTarget.id}`, { method: 'DELETE' });
    const data = await res.json();
    setDeletingFolder(false);

    if (!res.ok) {
      alert(data.error || 'Gagal menghapus folder.');
      return;
    }

    if (jenisId === String(hapusFolderTarget.id)) {
      setJenisId('');
    }
    setHapusFolderTarget(null);
    loadFolders();
    loadDocuments();
  }

  const folderScrollRef = useRef(null);

  const scrollFolders = (direction) => {
    if (folderScrollRef.current) {
      const container = folderScrollRef.current;
      const card = container.querySelector('.folder-card');
      const cardWidth = card ? card.offsetWidth + 14 : 240;
      const scrollAmount = cardWidth * 2;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const activeFolder = folders.find((f) => String(f.id) === String(jenisId));
  const totalPages = Math.max(1, Math.ceil(result.total / (result.pageSize || 20)));

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontSize: 12, color: '#6a7972', marginBottom: 2 }}>ARSIP KESEKRETARIATAN</div>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 0.3, color: 'var(--hijau-tua)' }}>
            DIVISI {divisi.nama.toUpperCase()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {bisaEdit && (
            <>
              <button className="btn-secondary" onClick={openAddFolderModal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                📁 + Tambah Folder
              </button>
              <button className="btn-primary" onClick={() => openAddDoc()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                📎 + Upload Dokumen
              </button>
            </>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Header Breadcrumb & Carousel Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 13, color: '#556' }}>
            <span>📂 <strong>{divisi.nama}</strong></span>
            {activeFolder ? (
              <span> &gt; <span style={{ color: 'var(--hijau-tua)', fontWeight: 700 }}>📁 {activeFolder.nama}</span></span>
            ) : (
              <span> &gt; <span style={{ color: '#889' }}>Semua Folder & Dokumen</span></span>
            )}
            <span style={{ marginLeft: 8, fontSize: 11, color: '#889' }}>({folders.length} folder)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeFolder && (
              <button
                onClick={() => setJenisId('')}
                className="btn-secondary"
                style={{ fontSize: 12, padding: '4px 10px' }}
              >
                ← Tampilkan Semua Folder
              </button>
            )}

            {/* Slider navigation buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f4f7f5', padding: '3px 8px', borderRadius: 8, border: '1px solid #e2e8e5' }}>
              <span style={{ fontSize: 11, color: '#688075', fontWeight: 600, userSelect: 'none' }}>Geser:</span>
              <button
                type="button"
                className="carousel-nav-btn"
                onClick={() => scrollFolders('left')}
                title="Geser ke kiri"
                aria-label="Geser ke kiri"
              >
                ◀
              </button>
              <button
                type="button"
                className="carousel-nav-btn"
                onClick={() => scrollFolders('right')}
                title="Geser ke kanan"
                aria-label="Geser ke kanan"
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        {/* Visual Folder Cards Slider / Carousel */}
        <div className="folder-carousel-wrapper">
          <div className="folder-carousel-track" ref={folderScrollRef}>
            {folders.map((f) => {
              const isSelected = String(f.id) === String(jenisId);
              return (
                <div
                  key={f.id}
                  className={`folder-card ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelectFolder(f.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="folder-icon-wrapper">
                      <span>{isSelected ? '📂' : '📁'}</span>
                    </div>
                    {bisaEdit && (
                      <div
                        style={{ display: 'flex', gap: 4 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          title="Ubah nama folder"
                          onClick={() => openEditFolderModal(f)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, fontSize: 13, opacity: 0.6 }}
                        >
                          ✏️
                        </button>
                        <button
                          title="Hapus folder"
                          onClick={() => setHapusFolderTarget(f)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, fontSize: 13, opacity: 0.6 }}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="folder-title">{f.nama}</div>
                  <div className="folder-count">{f.jumlahArsip || 0} Dokumen</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="card" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end', padding: '16px 20px' }}>
          <div style={{ flex: '2 1 240px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Cari nama dokumen di divisi ini</label>
            <input className="input-field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ketik kata kunci nama dokumen..." />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Pilih Folder / Kategori</label>
            <select className="input-field" value={jenisId} onChange={(e) => { setJenisId(e.target.value); setPage(1); }}>
              <option value="">Semua Folder</option>
              {folders.map((j) => (
                <option key={j.id} value={j.id}>{j.nama} ({j.jumlahArsip || 0})</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" type="submit">🔍 Cari</button>
          {(q || jenisId) && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setQ(''); setJenisId(''); setPage(1); }}
            >
              Reset
            </button>
          )}
        </form>

        {/* Documents Table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {activeFolder ? `📁 Daftar Dokumen — ${activeFolder.nama}` : `Daftar Semua Dokumen (${result.total})`}
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nama Dokumen</th>
                  <th>Folder / Kategori</th>
                  <th>Diunggah oleh</th>
                  <th>Tanggal Upload</th>
                  <th>Ukuran</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.namaDokumen}</td>
                    <td>
                      <span className="badge badge-lainnya" style={{ background: '#eef6f2', color: 'var(--hijau-tua)' }}>
                        📁 {item.jenisArsipNama || '-'}
                      </span>
                    </td>
                    <td>{item.uploaderNama}</td>
                    <td>{formatTanggal(item.createdAt)}</td>
                    <td style={{ color: '#889', fontSize: 12 }}>{formatUkuran(item.fileSize)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <a href={`/api/kesekretariatan/${item.id}?mode=view`} target="_blank" rel="noreferrer" title="Lihat PDF" className="pill-icon-btn">👁️</a>
                      <a href={`/api/kesekretariatan/${item.id}?mode=download`} title="Download PDF" className="pill-icon-btn">⬇️</a>
                      {item.gdriveWebViewLink ? (
                        <a
                          href={item.gdriveWebViewLink}
                          target="_blank"
                          rel="noreferrer"
                          title="Sudah di Google Drive (Klik untuk membuka)"
                          className="pill-icon-btn"
                          style={{ color: '#1a73e8', background: '#e8f0fe' }}
                        >
                          ☁️
                        </a>
                      ) : (
                        <button
                          type="button"
                          title="Upload dokumen ini ke Google Drive"
                          onClick={() => handleSyncGdrive(item)}
                          disabled={syncingGdriveId === item.id}
                          className="pill-icon-btn"
                          style={{ color: '#1a73e8' }}
                        >
                          {syncingGdriveId === item.id ? '⏳' : '☁️'}
                        </button>
                      )}
                      {bisaEdit && (
                        <>
                          <button title="Edit" className="pill-icon-btn primary" onClick={() => openEditDoc(item)}>✏️</button>
                          <button title="Hapus" className="pill-icon-btn danger" onClick={() => setHapusDocTarget({ id: item.id, namaDokumen: item.namaDokumen })}>🗑️</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && result.data.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ color: '#889', textAlign: 'center', padding: '36px 20px' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>
                        {activeFolder ? `Belum ada dokumen di dalam folder "${activeFolder.nama}".` : 'Belum ada arsip di divisi ini.'}
                      </div>
                      {bisaEdit && (
                        <button
                          className="btn-primary"
                          style={{ marginTop: 8 }}
                          onClick={() => openAddDoc(activeFolder?.id)}
                        >
                          + Upload Dokumen Sekarang
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {result.total > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 13, color: '#667' }}>
              <div>Total {result.total} arsip dokumen</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹ Sebelumnya</button>
                <span style={{ padding: '8px 4px' }}>Halaman {page} / {totalPages}</span>
                <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Berikutnya ›</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Upload / Edit Document */}
      {showDocModal && (
        <div className="modal-overlay" onClick={() => !submittingDoc && setShowDocModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 16 }}>
              {editDocId ? 'Edit Dokumen' : 'Upload Dokumen Baru'} — {divisi.nama}
            </div>
            <form onSubmit={handleSubmitDoc}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Nama Dokumen *</label>
                <input
                  className="input-field"
                  value={docForm.namaDokumen}
                  onChange={(e) => setDocForm({ ...docForm, namaDokumen: e.target.value })}
                  placeholder="Contoh: SK Pengangkatan CPNS 2024"
                  required
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Pilih Folder / Sub-Kategori *</label>
                <select
                  className="input-field"
                  value={docForm.jenisArsipId}
                  onChange={(e) => setDocForm({ ...docForm, jenisArsipId: e.target.value })}
                  required
                >
                  <option value="">-- Pilih Folder --</option>
                  {folders.map((j) => (
                    <option key={j.id} value={j.id}>📁 {j.nama}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>File PDF {editDocId ? '' : '*'}</label>
                {currentFileInfo && (
                  <div style={{ fontSize: 13, marginBottom: 8 }}>
                    <a href={`/api/kesekretariatan/${currentFileInfo.id}?mode=view`} target="_blank" rel="noreferrer" style={{ color: 'var(--hijau-tua)', fontWeight: 600 }}>
                      👁️ Lihat file saat ini
                    </a>
                    <span style={{ color: '#889', marginLeft: 8 }}>({formatUkuran(currentFileInfo.fileSize)})</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setDocForm({ ...docForm, file: e.target.files?.[0] || null })}
                />
                {editDocId && <div style={{ fontSize: 12, color: '#889', marginTop: 4 }}>Kosongkan kalau tidak ingin mengganti file.</div>}
              </div>

              {docFormError && <div className="error-text" style={{ marginBottom: 12 }}>{docFormError}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowDocModal(false)}>Batal</button>
                <button className="btn-primary" disabled={submittingDoc}>{submittingDoc ? 'Menyimpan...' : 'Simpan Dokumen'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Rename Folder */}
      {showFolderModal && (
        <div className="modal-overlay" onClick={() => !submittingFolder && setShowFolderModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14 }}>
              {editFolderId ? 'Ubah Nama Folder' : `Tambah Folder Baru di ${divisi.nama}`}
            </div>
            <form onSubmit={handleSaveFolder}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Nama Folder / Sub-Kategori *</label>
                <input
                  className="input-field"
                  value={folderNama}
                  onChange={(e) => setFolderNama(e.target.value)}
                  placeholder="Contoh: SK Kepegawaian, Cuti, KGB"
                  autoFocus
                  required
                />
              </div>
              {folderError && <div className="error-text" style={{ marginBottom: 12 }}>{folderError}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowFolderModal(false)}>Batal</button>
                <button className="btn-primary" disabled={submittingFolder}>{submittingFolder ? 'Menyimpan...' : 'Simpan Folder'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Document */}
      {hapusDocTarget && (
        <div className="modal-overlay" onClick={() => !deletingDoc && setHapusDocTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>Hapus Dokumen?</div>
            <p style={{ fontSize: 14, color: '#556', marginBottom: 20 }}>
              Yakin ingin menghapus <strong>{hapusDocTarget.namaDokumen}</strong>? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setHapusDocTarget(null)} disabled={deletingDoc}>Batal</button>
              <button className="btn-danger" style={{ padding: '10px 18px' }} onClick={handleDeleteDoc} disabled={deletingDoc}>
                {deletingDoc ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Folder */}
      {hapusFolderTarget && (
        <div className="modal-overlay" onClick={() => !deletingFolder && setHapusFolderTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>Hapus Folder?</div>
            <p style={{ fontSize: 14, color: '#556', marginBottom: 20 }}>
              Yakin ingin menghapus folder <strong>"{hapusFolderTarget.nama}"</strong>?
              {hapusFolderTarget.jumlahArsip > 0 && (
                <span style={{ color: '#c53030', display: 'block', marginTop: 8 }}>
                  ⚠️ Folder ini masih memiliki {hapusFolderTarget.jumlahArsip} dokumen! Hapus atau pindahkan dokumen terlebih dahulu.
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setHapusFolderTarget(null)} disabled={deletingFolder}>Batal</button>
              <button
                className="btn-danger"
                style={{ padding: '10px 18px' }}
                onClick={handleDeleteFolder}
                disabled={deletingFolder || hapusFolderTarget.jumlahArsip > 0}
              >
                {deletingFolder ? 'Menghapus...' : 'Hapus Folder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
