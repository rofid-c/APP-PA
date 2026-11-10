'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DigitalSignaturePad from '../../../components/DigitalSignaturePad';

function formatUkuran(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatWaktu(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
  } catch {
    return isoString;
  }
}

export default function DetailRapat({ id, role, user }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit info rapat modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Catatan hasil rapat inline
  const [catatanHasil, setCatatanHasil] = useState('');
  const [savingCatatan, setSavingCatatan] = useState(false);
  const [catatanSaved, setCatatanSaved] = useState(false);

  // Upload PDF Rangkuman / Notulen (Mendukung Lebih Dari 1 File)
  const [pdfFiles, setPdfFiles] = useState([]);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const fileInputRef = useRef(null);

  // Upload PDF Undangan (Mendukung Lebih Dari 1 File)
  const [undanganFiles, setUndanganFiles] = useState([]);
  const [uploadingUndangan, setUploadingUndangan] = useState(false);
  const [undanganError, setUndanganError] = useState('');
  const fileUndanganInputRef = useRef(null);

  // Dokumentasi Rapat (Foto)
  const [fotoFiles, setFotoFiles] = useState([]);
  const [fotoCaption, setFotoCaption] = useState('');
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoError, setFotoError] = useState('');
  const fotoInputRef = useRef(null);
  const [previewFotoModal, setPreviewFotoModal] = useState(null);

  // Modal Tambah Presensi Manual (dengan TTD canvas)
  const [showManualAbsen, setShowManualAbsen] = useState(false);
  const [manualNama, setManualNama] = useState('');
  const [manualJabatan, setManualJabatan] = useState('');
  const [manualInstansi, setManualInstansi] = useState('PA Gunung Sugih');
  const [manualTtd, setManualTtd] = useState(null);
  const [manualError, setManualError] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  // Modal QR Code Presensi
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal Zoom TTD
  const [zoomTtd, setZoomTtd] = useState(null); // { nama, jabatan, ttdData, waktuHadir }

  // Hapus peserta target
  const [hapusPesertaTarget, setHapusPesertaTarget] = useState(null);
  const [deletingPeserta, setDeletingPeserta] = useState(false);

  const bisaKelola = role !== 'staf_umum';

  const loadData = useCallback(() => {
    setLoading(true);
    fetch(`/api/rapat/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setData(res.data);
          setCatatanHasil(res.data.catatanHasil || '');
          setEditForm({
            judul: res.data.judul || '',
            tanggal: res.data.tanggal || '',
            waktuMulai: res.data.waktuMulai || '',
            waktuSelesai: res.data.waktuSelesai || '',
            tempat: res.data.tempat || '',
            pimpinanRapat: res.data.pimpinanRapat || '',
            notulis: res.data.notulis || '',
            agenda: res.data.agenda || '',
          });
        } else {
          setError(res.error || 'Data rapat tidak ditemukan.');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError('Gagal menghubungkan ke server.');
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Edit Info Rapat
  async function handleSaveEdit(e) {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/rapat/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setShowEditModal(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menyimpan perubahan.');
      }
    } catch {
      alert('Gagal menghubungi server.');
    } finally {
      setSavingEdit(false);
    }
  }

  // Handle Save Catatan Hasil
  async function handleSaveCatatan() {
    setSavingCatatan(true);
    try {
      const res = await fetch(`/api/rapat/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catatanHasil }),
      });
      if (res.ok) {
        setCatatanSaved(true);
        setTimeout(() => setCatatanSaved(false), 2500);
      } else {
        alert('Gagal menyimpan catatan hasil.');
      }
    } catch {
      alert('Gagal menghubungi server.');
    } finally {
      setSavingCatatan(false);
    }
  }

  // Handle Upload PDF Rangkuman / Notulen (Mendukung Banyak File)
  async function handleUploadPdf(e) {
    e.preventDefault();
    setPdfError('');
    if (!pdfFiles || pdfFiles.length === 0) {
      setPdfError('Pilih minimal satu berkas PDF notulen.');
      return;
    }

    setUploadingPdf(true);
    const fd = new FormData();
    fd.append('kategori', 'notulen');
    for (let i = 0; i < pdfFiles.length; i++) {
      fd.append('files', pdfFiles[i]);
    }

    try {
      const res = await fetch(`/api/rapat/${id}/upload-berkas`, {
        method: 'POST',
        body: fd,
      });
      const resData = await res.json();
      if (!res.ok) {
        setPdfError(resData.error || 'Gagal mengunggah berkas.');
      } else {
        setPdfFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        loadData();
      }
    } catch (err) {
      setPdfError('Terjadi kesalahan jaringan.');
    } finally {
      setUploadingPdf(false);
    }
  }

  // Handle Upload PDF Undangan (Mendukung Banyak File)
  async function handleUploadUndangan(e) {
    e.preventDefault();
    setUndanganError('');
    if (!undanganFiles || undanganFiles.length === 0) {
      setUndanganError('Pilih minimal satu berkas PDF undangan.');
      return;
    }

    setUploadingUndangan(true);
    const fd = new FormData();
    fd.append('kategori', 'undangan');
    for (let i = 0; i < undanganFiles.length; i++) {
      fd.append('files', undanganFiles[i]);
    }

    try {
      const res = await fetch(`/api/rapat/${id}/upload-berkas`, {
        method: 'POST',
        body: fd,
      });
      const resData = await res.json();
      if (!res.ok) {
        setUndanganError(resData.error || 'Gagal mengunggah berkas undangan.');
      } else {
        setUndanganFiles([]);
        if (fileUndanganInputRef.current) fileUndanganInputRef.current.value = '';
        loadData();
      }
    } catch {
      setUndanganError('Terjadi kesalahan jaringan.');
    } finally {
      setUploadingUndangan(false);
    }
  }

  // Handle Hapus Berkas PDF (Bisa Hapus Satuan)
  async function handleDeleteBerkas(berkasId, fileName) {
    if (!confirm(`Hapus berkas "${fileName || 'ini'}"?`)) return;
    try {
      const res = await fetch(`/api/rapat/${id}/berkas/${berkasId}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        alert('Gagal menghapus berkas.');
      }
    } catch {
      alert('Gagal menghubungi server.');
    }
  }

  // Handle Upload Foto Dokumentasi
  async function handleUploadFoto(e) {
    e.preventDefault();
    setFotoError('');
    if (!fotoFiles || fotoFiles.length === 0) {
      setFotoError('Pilih minimal satu berkas foto dokumentasi.');
      return;
    }

    setUploadingFoto(true);
    const fd = new FormData();
    for (let i = 0; i < fotoFiles.length; i++) {
      fd.append('files', fotoFiles[i]);
    }
    if (fotoCaption.trim()) {
      fd.append('caption', fotoCaption.trim());
    }

    try {
      const res = await fetch(`/api/rapat/${id}/dokumentasi`, {
        method: 'POST',
        body: fd,
      });
      const resData = await res.json();
      if (!res.ok) {
        setFotoError(resData.error || 'Gagal mengunggah foto.');
      } else {
        setFotoFiles([]);
        setFotoCaption('');
        if (fotoInputRef.current) fotoInputRef.current.value = '';
        loadData();
      }
    } catch {
      setFotoError('Terjadi kesalahan jaringan saat mengunggah foto.');
    } finally {
      setUploadingFoto(false);
    }
  }

  // Handle Hapus Foto Dokumentasi
  async function handleDeleteFoto(fotoId, fileName) {
    if (!confirm(`Hapus foto dokumentasi "${fileName || 'ini'}"?`)) return;
    try {
      const res = await fetch(`/api/rapat/${id}/dokumentasi/${fotoId}`, { method: 'DELETE' });
      if (res.ok) {
        if (previewFotoModal && previewFotoModal.id === fotoId) {
          setPreviewFotoModal(null);
        }
        loadData();
      } else {
        alert('Gagal menghapus foto dokumentasi.');
      }
    } catch {
      alert('Gagal menghubungi server.');
    }
  }

  // Handle Submit Manual Absen
  async function handleSubmitManual(e) {
    e.preventDefault();
    setManualError('');
    if (!manualNama.trim()) {
      setManualError('Nama lengkap wajib diisi.');
      return;
    }
    if (!manualJabatan.trim()) {
      setManualError('Jabatan wajib diisi.');
      return;
    }
    if (!manualTtd) {
      setManualError('Tanda tangan digital wajib dibubuhkan.');
      return;
    }

    setSubmittingManual(true);
    try {
      const res = await fetch(`/api/presensi/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: manualNama.trim(),
          jabatan: manualJabatan.trim(),
          instansi: manualInstansi.trim(),
          ttdData: manualTtd,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setManualError(resData.error || 'Gagal menyimpan presensi.');
      } else {
        setShowManualAbsen(false);
        setManualNama('');
        setManualJabatan('');
        setManualTtd(null);
        loadData();
      }
    } catch {
      setManualError('Terjadi kesalahan jaringan.');
    } finally {
      setSubmittingManual(false);
    }
  }

  // Handle Hapus Kehadiran
  async function handleDeletePeserta() {
    if (!hapusPesertaTarget) return;
    setDeletingPeserta(true);
    try {
      const res = await fetch(`/api/rapat/${id}/presensi/${hapusPesertaTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setHapusPesertaTarget(null);
        loadData();
      } else {
        alert('Gagal menghapus data kehadiran.');
      }
    } catch {
      alert('Gagal menghubungi server.');
    } finally {
      setDeletingPeserta(false);
    }
  }

  function handleCopyPresensiUrl() {
    const url = data?.presensiUrl || (typeof window !== 'undefined' ? `${window.location.origin}/presensi/${id}` : '');
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  }

  if (loading) {
    return (
      <div className="page-body">
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px', color: '#707974' }}>
          Sedang memuat data agenda rapat...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-body">
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', borderLeft: '4px solid #c53030' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#c53030', marginBottom: 8 }}>{error || 'Data tidak ditemukan'}</div>
          <Link href="/rapat" className="btn-secondary">
            ← Kembali ke Daftar Rapat
          </Link>
        </div>
      </div>
    );
  }

  const listUndangan = (data.berkas || []).filter((b) => b.kategori === 'undangan');
  const listNotulen = (data.berkas || []).filter((b) => b.kategori === 'notulen');

  return (
    <div>
      {/* Topbar Header */}
      <div className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/rapat"
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            ← Kembali
          </Link>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16.5, color: '#0f4d3a', lineHeight: 1.2 }}>
              {data.judul}
            </div>
            <div style={{ fontSize: 12, color: '#5a6b62', marginTop: 2 }}>
              📅 {data.tanggal} {data.waktuMulai ? `• ⏰ ${data.waktuMulai} - ${data.waktuSelesai || ''} WIB` : ''} {data.tempat ? `• 📍 ${data.tempat}` : ''}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}
          >
            <span>📱</span> QR Presensi
          </button>

          <a
            href={`/rapat/${id}/cetak-daftar-hadir`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px', textDecoration: 'none' }}
          >
            <span>📥</span> Unduh Daftar Hadir
          </a>

          {bisaKelola && (
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}
            >
              <span>✏️</span> Edit Rapat
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* ROW 1: INFO RAPAT & RANGKUMAN PDF */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18, marginBottom: 20 }}>
          {/* KARTU 1: DETAIL RAPAT & HASIL */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#0f4d3a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📋</span> Informasi & Agenda Rapat
              </div>
              <span style={{ fontSize: 12, color: '#707974' }}>ID: #{data.id}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14, fontSize: 13 }}>
              <div>
                <span style={{ color: '#707974', display: 'block', fontSize: 11.5, fontWeight: 600 }}>PIMPINAN RAPAT</span>
                <span style={{ fontWeight: 700, color: '#131e18' }}>{data.pimpinanRapat || '-'}</span>
              </div>
              <div>
                <span style={{ color: '#707974', display: 'block', fontSize: 11.5, fontWeight: 600 }}>NOTULIS</span>
                <span style={{ fontWeight: 700, color: '#131e18' }}>{data.notulis || '-'}</span>
              </div>
              <div>
                <span style={{ color: '#707974', display: 'block', fontSize: 11.5, fontWeight: 600 }}>TEMPAT / RUANG</span>
                <span style={{ fontWeight: 600, color: '#1e8a63' }}>{data.tempat || '-'}</span>
              </div>
              <div>
                <span style={{ color: '#707974', display: 'block', fontSize: 11.5, fontWeight: 600 }}>DIAGENDAKAN OLEH</span>
                <span style={{ fontWeight: 600, color: '#131e18' }}>{data.pembuatNama || 'Sistem'}</span>
              </div>
            </div>

            {data.agenda && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ color: '#707974', display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>
                  AGENDA / POKOK BAHASAN
                </span>
                <div style={{ background: '#f8faf9', border: '1px solid #e2e6e4', borderRadius: 8, padding: '10px 12px', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {data.agenda}
                </div>
              </div>
            )}

            {/* Poin Catatan / Keputusan Rapat */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ color: '#707974', fontSize: 11.5, fontWeight: 700 }}>
                  POIN KEPUTUSAN / NOTULEN RINGKAS
                </span>
                {catatanSaved && (
                  <span style={{ fontSize: 11.5, color: '#136b4e', fontWeight: 700 }}>✓ Catatan Tersimpan</span>
                )}
              </div>
              <textarea
                className="input-field"
                rows={4}
                placeholder="Tuliskan pokok hasil kesepakatan / keputusan rapat di sini..."
                value={catatanHasil}
                onChange={(e) => setCatatanHasil(e.target.value)}
                disabled={!bisaKelola}
                style={{ fontSize: 13, marginBottom: 8 }}
              />
              {bisaKelola && (
                <button
                  type="button"
                  onClick={handleSaveCatatan}
                  disabled={savingCatatan}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 12.5 }}
                >
                  {savingCatatan ? 'Menyimpan...' : '💾 Simpan Catatan Hasil'}
                </button>
              )}
            </div>
          </div>

          {/* KARTU 2: BERKAS & DOKUMEN RAPAT (UNDANGAN & NOTULEN PDF - MULTI FILE) */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#0f4d3a', marginBottom: 14, borderBottom: '1px solid var(--border)', paddingBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📁</span> Berkas & Dokumen Rapat (PDF)
              </div>
              <span style={{ fontSize: 11.5, color: '#55655d', fontWeight: 600 }}>
                Bisa upload &gt; 1 berkas per kategori
              </span>
            </div>

            {/* SEKSI A: UNDANGAN RAPAT (PDF) */}
            <div style={{ marginBottom: 20, paddingBottom: 18, borderBottom: '1px dashed #d2ded8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#131e18', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📨</span> Undangan Rapat (PDF)
                </div>
                {listUndangan.length > 0 ? (
                  <span style={{ background: '#e6f7ee', color: '#136b4e', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    ✓ {listUndangan.length} Berkas
                  </span>
                ) : (
                  <span style={{ background: '#f4f6f5', color: '#8a978f', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                    Belum Ada
                  </span>
                )}
              </div>

              {/* Daftar Berkas Undangan Terunggah */}
              {listUndangan.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {listUndangan.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: '#f8faf9',
                        border: '1px solid #e2e6e4',
                        borderRadius: 8,
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 800, flexShrink: 0 }}>
                          PDF
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#131e18', wordBreak: 'break-all' }}>
                            {item.fileName}
                          </div>
                          <div style={{ fontSize: 11, color: '#707974', marginTop: 2 }}>
                            {formatUkuran(item.fileSize)} {item.createdAt ? `• ${new Date(item.createdAt).toLocaleDateString('id-ID')}` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <a
                          href={`/api/rapat/${id}/berkas/${item.id}?mode=view`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary"
                          style={{ padding: '5px 10px', fontSize: 11.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <span>👁️</span> Buka PDF
                        </a>
                        <a
                          href={`/api/rapat/${id}/berkas/${item.id}?mode=download`}
                          className="btn-secondary"
                          style={{ padding: '5px 10px', fontSize: 11.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <span>📥</span> Unduh
                        </a>
                        {bisaKelola && (
                          <button
                            type="button"
                            onClick={() => handleDeleteBerkas(item.id, item.fileName)}
                            className="btn-danger"
                            style={{ padding: '5px 8px', fontSize: 11.5 }}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px', background: '#fafbfa', border: '1px dashed #d2ded8', borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: '#707974' }}>
                    Belum ada berkas PDF undangan rapat.
                  </div>
                </div>
              )}

              {/* Form Upload Undangan (Multi-file) */}
              {bisaKelola && (
                <form onSubmit={handleUploadUndangan}>
                  {undanganError && (
                    <div style={{ background: '#fff0f0', color: '#c53030', fontSize: 11.5, padding: '6px 8px', borderRadius: 6, marginBottom: 6 }}>
                      ⚠️ {undanganError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      ref={fileUndanganInputRef}
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={(e) => setUndanganFiles(Array.from(e.target.files || []))}
                      className="input-field"
                      style={{ padding: '6px 8px', fontSize: 11.5, flex: 1, minWidth: 200 }}
                    />
                    <button
                      type="submit"
                      disabled={uploadingUndangan || undanganFiles.length === 0}
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: 12, whiteSpace: 'nowrap' }}
                    >
                      {uploadingUndangan
                        ? 'Mengunggah...'
                        : undanganFiles.length > 1
                        ? `Upload ${undanganFiles.length} Undangan`
                        : 'Upload Undangan'}
                    </button>
                  </div>
                  {undanganFiles.length > 0 && (
                    <div style={{ fontSize: 11, color: '#0f4d3a', fontWeight: 600, marginTop: 4 }}>
                      ✓ {undanganFiles.length} berkas dipilih: {undanganFiles.map((f) => f.name).join(', ')}
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* SEKSI B: NOTULEN / RANGKUMAN RAPAT (PDF) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#131e18', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📄</span> Notulen / Rangkuman Rapat (PDF)
                </div>
                {listNotulen.length > 0 ? (
                  <span style={{ background: '#e6f7ee', color: '#136b4e', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    ✓ {listNotulen.length} Berkas
                  </span>
                ) : (
                  <span style={{ background: '#f4f6f5', color: '#8a978f', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                    Belum Ada
                  </span>
                )}
              </div>

              {/* Daftar Berkas Notulen Terunggah */}
              {listNotulen.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {listNotulen.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: '#f8faf9',
                        border: '1px solid #e2e6e4',
                        borderRadius: 8,
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 800, flexShrink: 0 }}>
                          PDF
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#131e18', wordBreak: 'break-all' }}>
                            {item.fileName}
                          </div>
                          <div style={{ fontSize: 11, color: '#707974', marginTop: 2 }}>
                            {formatUkuran(item.fileSize)} {item.createdAt ? `• ${new Date(item.createdAt).toLocaleDateString('id-ID')}` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <a
                          href={`/api/rapat/${id}/berkas/${item.id}?mode=view`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary"
                          style={{ padding: '5px 10px', fontSize: 11.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <span>👁️</span> Buka PDF
                        </a>
                        <a
                          href={`/api/rapat/${id}/berkas/${item.id}?mode=download`}
                          className="btn-secondary"
                          style={{ padding: '5px 10px', fontSize: 11.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <span>📥</span> Unduh
                        </a>
                        {bisaKelola && (
                          <button
                            type="button"
                            onClick={() => handleDeleteBerkas(item.id, item.fileName)}
                            className="btn-danger"
                            style={{ padding: '5px 8px', fontSize: 11.5 }}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px', background: '#fafbfa', border: '1px dashed #d2ded8', borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: '#707974' }}>
                    Belum ada berkas PDF notulen / rangkuman hasil rapat.
                  </div>
                </div>
              )}

              {/* Form Upload Notulen (Multi-file) */}
              {bisaKelola && (
                <form onSubmit={handleUploadPdf}>
                  {pdfError && (
                    <div style={{ background: '#fff0f0', color: '#c53030', fontSize: 11.5, padding: '6px 8px', borderRadius: 6, marginBottom: 6 }}>
                      ⚠️ {pdfError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={(e) => setPdfFiles(Array.from(e.target.files || []))}
                      className="input-field"
                      style={{ padding: '6px 8px', fontSize: 11.5, flex: 1, minWidth: 200 }}
                    />
                    <button
                      type="submit"
                      disabled={uploadingPdf || pdfFiles.length === 0}
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: 12, whiteSpace: 'nowrap' }}
                    >
                      {uploadingPdf
                        ? 'Mengunggah...'
                        : pdfFiles.length > 1
                        ? `Upload ${pdfFiles.length} Notulen`
                        : 'Upload Notulen'}
                    </button>
                  </div>
                  {pdfFiles.length > 0 && (
                    <div style={{ fontSize: 11, color: '#0f4d3a', fontWeight: 600, marginTop: 4 }}>
                      ✓ {pdfFiles.length} berkas dipilih: {pdfFiles.map((f) => f.name).join(', ')}
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ROW 2: FOTO DOKUMENTASI KEGIATAN RAPAT */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          <div
            style={{
              padding: '16px 20px',
              background: '#f8faf9',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f4d3a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📸</span> FOTO DOKUMENTASI KEGIATAN RAPAT
              </div>
              <span
                style={{
                  background: '#e6f7ee',
                  color: '#136b4e',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 20,
                }}
              >
                {data.dokumentasi?.length || 0} Foto
              </span>
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            {/* Form Upload Foto */}
            {bisaKelola && (
              <form
                onSubmit={handleUploadFoto}
                style={{
                  background: '#fcfdfd',
                  border: '1px solid #dbe4e0',
                  borderRadius: 10,
                  padding: '16px',
                  marginBottom: 20,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f4d3a', marginBottom: 10 }}>
                  + Unggah Foto Dokumentasi Baru:
                </div>

                {fotoError && (
                  <div style={{ background: '#fff0f0', color: '#c53030', fontSize: 12, padding: '8px 10px', borderRadius: 6, marginBottom: 10 }}>
                    ⚠️ {fotoError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#445', marginBottom: 4 }}>
                      Pilih Foto (Bisa pilih beberapa sekaligus):
                    </label>
                    <input
                      ref={fotoInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setFotoFiles(Array.from(e.target.files || []))}
                      className="input-field"
                      style={{ padding: '7px 10px', fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#445', marginBottom: 4 }}>
                      Keterangan / Caption Foto (Opsional):
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Suasana pembukaan rapat..."
                      value={fotoCaption}
                      onChange={(e) => setFotoCaption(e.target.value)}
                      className="input-field"
                      style={{ padding: '7px 10px', fontSize: 12 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
                  {fotoFiles.length > 0 && (
                    <span style={{ fontSize: 12, color: '#136b4e', fontWeight: 600 }}>
                      ✓ {fotoFiles.length} foto siap diunggah
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={uploadingFoto || fotoFiles.length === 0}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >
                    {uploadingFoto ? 'Mengunggah Foto...' : 'Unggah Foto Dokumentasi'}
                  </button>
                </div>
              </form>
            )}

            {/* Gallery Foto */}
            {(!data.dokumentasi || data.dokumentasi.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', background: '#fafbfa', border: '1.5px dashed #d2ded8', borderRadius: 10 }}>
                <div style={{ fontSize: 36, marginBottom: 6 }}>🖼️</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f4d3a', marginBottom: 4 }}>
                  Belum Ada Foto Dokumentasi
                </div>
                <div style={{ fontSize: 12.5, color: '#707974' }}>
                  Unggah foto suasana atau jalannya kegiatan rapat untuk melengkapi arsip kedinasan.
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                  gap: 16,
                }}
              >
                {data.dokumentasi.map((foto) => (
                  <div
                    key={foto.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e6e4',
                      borderRadius: 10,
                      overflow: 'hidden',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      onClick={() => setPreviewFotoModal(foto)}
                      style={{
                        position: 'relative',
                        height: 160,
                        background: '#1a221f',
                        cursor: 'pointer',
                        overflow: 'hidden',
                      }}
                      title="Klik untuk memperbesar foto"
                    >
                      <img
                        src={`/api/rapat/${id}/dokumentasi/${foto.id}?mode=view`}
                        alt={foto.caption || foto.fileName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          transition: 'transform 0.2s',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: 'rgba(0,0,0,0.65)',
                          color: 'white',
                          borderRadius: 4,
                          padding: '2px 6px',
                          fontSize: 10.5,
                          fontWeight: 600,
                        }}
                      >
                        🔍 Perbesar
                      </div>
                    </div>

                    <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ marginBottom: 8 }}>
                        {foto.caption ? (
                          <div style={{ fontWeight: 700, fontSize: 12.5, color: '#131e18', marginBottom: 2 }}>
                            {foto.caption}
                          </div>
                        ) : null}
                        <div style={{ fontSize: 11, color: '#707974', wordBreak: 'break-all' }}>
                          {foto.fileName}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#8a978f', marginTop: 2 }}>
                          {formatUkuran(foto.fileSize)} • {foto.createdAt?.slice(0, 10)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #f0f2f1', paddingTop: 8 }}>
                        <a
                          href={`/api/rapat/${id}/dokumentasi/${foto.id}?mode=download`}
                          className="btn-secondary"
                          style={{
                            flex: 1,
                            padding: '5px 8px',
                            fontSize: 11.5,
                            textAlign: 'center',
                            textDecoration: 'none',
                            display: 'inline-block',
                          }}
                        >
                          📥 Unduh
                        </a>
                        {bisaKelola && (
                          <button
                            type="button"
                            onClick={() => handleDeleteFoto(foto.id, foto.fileName)}
                            className="btn-danger"
                            style={{ padding: '5px 10px', fontSize: 11.5 }}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ROW 3: ABSENSI & PRESENSI DIGITAL */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header Card Absensi */}
          <div
            style={{
              padding: '16px 20px',
              background: '#f8faf9',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f4d3a' }}>
                DAFTAR KEHADIRAN / ABSENSI PESERTA
              </div>
              <span
                style={{
                  background: '#e6f7ee',
                  color: '#136b4e',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 20,
                }}
              >
                {data.presensi?.length || 0} Hadir
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a
                href={`/rapat/${id}/cetak-daftar-hadir`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{ padding: '7px 14px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', background: '#0f4d3a' }}
              >
                <span>📥</span> Unduh Daftar Hadir
              </a>

              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="btn-secondary"
                style={{ padding: '7px 12px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <span>📱</span> Barcode / QR Presensi
              </button>

              <a
                href={`/rapat/${id}/cetak-qr-meja`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ padding: '7px 12px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
              >
                <span>🖨️</span> Lembar QR Meja
              </a>

              {bisaKelola && (
                <button
                  type="button"
                  onClick={() => {
                    setManualError('');
                    setShowManualAbsen(true);
                  }}
                  className="btn-primary"
                  style={{ padding: '7px 14px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <span>✍️</span> Tambah Presensi Manual
                </button>
              )}
            </div>
          </div>

          {/* Tabel Presensi */}
          {(!data.presensi || data.presensi.length === 0) ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#707974' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f4d3a', marginBottom: 4 }}>
                Belum Ada Peserta yang Mengisi Absensi
              </div>
              <div style={{ fontSize: 13, marginBottom: 14 }}>
                Tampilkan QR Code di atas agar peserta dapat melakukan presensi mandiri dan tanda tangan digital via smartphone, atau gunakan tombol "Tambah Presensi Manual".
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>📱</span> Buka QR Code Presensi Sekarang
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: '#f8faf9', borderBottom: '1px solid var(--border)', color: '#5a6b62', fontWeight: 700 }}>
                    <th style={{ padding: '12px 16px', width: 40 }}>No</th>
                    <th style={{ padding: '12px 16px', width: 130 }}>Waktu Hadir</th>
                    <th style={{ padding: '12px 16px' }}>Nama Peserta</th>
                    <th style={{ padding: '12px 16px', width: 200 }}>Jabatan / Unit</th>
                    <th style={{ padding: '12px 16px', width: 140, textAlign: 'center' }}>TTD Digital</th>
                    <th style={{ padding: '12px 16px', width: 170 }}>Barcode ID</th>
                    {bisaKelola && <th style={{ padding: '12px 16px', width: 70, textAlign: 'center' }}>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.presensi.map((p, idx) => (
                    <tr
                      key={p.id}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fcfdfc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                    >
                      <td style={{ padding: '12px 16px', color: '#707974', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '12px 16px', color: '#131e18', fontSize: 12.5, fontWeight: 500 }}>
                        {formatWaktu(p.waktuHadir)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f4d3a', fontSize: 14 }}>{p.nama}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#131e18' }}>{p.jabatan}</div>
                        {p.instansi && <div style={{ fontSize: 11.5, color: '#707974' }}>{p.instansi}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {p.ttdData ? (
                          <div
                            onClick={() => setZoomTtd(p)}
                            title="Klik untuk memperbesar tanda tangan"
                            style={{
                              display: 'inline-block',
                              border: '1px solid #d2ded8',
                              borderRadius: 6,
                              background: '#ffffff',
                              padding: '2px 6px',
                              cursor: 'pointer',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            }}
                          >
                            <img
                              src={p.ttdData}
                              alt="TTD"
                              style={{ width: 85, height: 40, objectFit: 'contain', display: 'block' }}
                            />
                          </div>
                        ) : (
                          <span style={{ fontSize: 11.5, color: '#889' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 11,
                            background: '#f0f4f2',
                            color: '#136b4e',
                            padding: '3px 7px',
                            borderRadius: 4,
                            fontWeight: 700,
                          }}
                        >
                          {p.barcodeData || '-'}
                        </span>
                      </td>
                      {bisaKelola && (
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setHapusPesertaTarget(p)}
                            className="btn-danger"
                            style={{ padding: '4px 8px', fontSize: 12 }}
                            title="Hapus Peserta"
                          >
                            🗑️
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL EDIT RAPAT */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#0f4d3a' }}>Edit Informasi Rapat</div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, color: '#707974', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 5 }}>Judul Rapat</label>
                <input
                  type="text"
                  className="input-field"
                  value={editForm.judul}
                  onChange={(e) => setEditForm({ ...editForm, judul: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Tanggal</label>
                  <input
                    type="date"
                    className="input-field"
                    value={editForm.tanggal}
                    onChange={(e) => setEditForm({ ...editForm, tanggal: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Jam Mulai</label>
                  <input
                    type="time"
                    className="input-field"
                    value={editForm.waktuMulai}
                    onChange={(e) => setEditForm({ ...editForm, waktuMulai: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Jam Selesai</label>
                  <input
                    type="time"
                    className="input-field"
                    value={editForm.waktuSelesai}
                    onChange={(e) => setEditForm({ ...editForm, waktuSelesai: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 5 }}>Tempat / Ruangan</label>
                <input
                  type="text"
                  className="input-field"
                  value={editForm.tempat}
                  onChange={(e) => setEditForm({ ...editForm, tempat: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Pimpinan Rapat</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.pimpinanRapat}
                    onChange={(e) => setEditForm({ ...editForm, pimpinanRapat: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Notulis</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.notulis}
                    onChange={(e) => setEditForm({ ...editForm, notulis: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 5 }}>Agenda Rapat</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={editForm.agenda}
                  onChange={(e) => setEditForm({ ...editForm, agenda: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={savingEdit} className="btn-primary">
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QR PRESENSI MEJA & PROYEKTOR */}
      {showQrModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f4d3a', textAlign: 'left' }}>
                QR Code Presensi Kehadiran
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, color: '#707974', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontWeight: 700, fontSize: 14.5, color: '#131e18', marginBottom: 4 }}>
              {data.judul}
            </div>
            <div style={{ fontSize: 12.5, color: '#5a6b62', marginBottom: 14 }}>
              📅 {data.tanggal} {data.tempat ? `• 📍 ${data.tempat}` : ''}
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
                src={`/api/rapat/${id}/qrcode`}
                alt="QR Presensi"
                style={{ width: 220, height: 220, display: 'block' }}
              />
            </div>

            <div style={{ fontSize: 12.5, color: '#5a6b62', marginBottom: 14 }}>
              Peserta cukup scan QR code di atas dengan kamera HP untuk mengisi presensi dan membubuhkan tanda tangan digital secara langsung.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  readOnly
                  className="input-field"
                  value={data.presensiUrl || (typeof window !== 'undefined' ? `${window.location.origin}/presensi/${id}` : '')}
                  style={{ fontSize: 12, background: '#f8faf9', fontWeight: 600, color: '#0f4d3a' }}
                />
                <button
                  type="button"
                  onClick={handleCopyPresensiUrl}
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: 12.5, whiteSpace: 'nowrap' }}
                >
                  {copiedLink ? '✓ Tersalin!' : 'Salin Link'}
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#146c4f', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>📶</span> Tautan otomatis menggunakan IP Wi-Fi/LAN kantor agar langsung bisa dibuka dari HP.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <a
                href={`/rapat/${id}/cetak-qr-meja`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{ flex: 1, padding: '9px 12px', fontSize: 13, textAlign: 'center', textDecoration: 'none' }}
              >
                🖨️ Cetak Lembar Meja (A4)
              </a>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="btn-secondary"
                style={{ padding: '9px 14px', fontSize: 13 }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PRESENSI MANUAL DENGAN TTD CANVAS */}
      {showManualAbsen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f4d3a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✍️</span> Tambah Presensi Peserta Manual
              </div>
              <button
                type="button"
                onClick={() => setShowManualAbsen(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, color: '#707974', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {manualError && (
              <div style={{ background: '#fff0f0', color: '#c53030', padding: '8px 12px', borderRadius: 6, fontSize: 12.5, marginBottom: 12 }}>
                ⚠️ {manualError}
              </div>
            )}

            <form onSubmit={handleSubmitManual}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>
                  Nama Lengkap Peserta <span style={{ color: '#c53030' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nama beserta gelar"
                  value={manualNama}
                  onChange={(e) => setManualNama(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>
                  Jabatan / Unit Kerja <span style={{ color: '#c53030' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: Hakim / Panitera / Kasubbag / Staf"
                  value={manualJabatan}
                  onChange={(e) => setManualJabatan(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <DigitalSignaturePad
                  height={150}
                  label="Tanda Tangan Digital Peserta"
                  onChange={(dataUrl) => setManualTtd(dataUrl)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowManualAbsen(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={submittingManual} className="btn-primary">
                  {submittingManual ? 'Menyimpan...' : 'Simpan Presensi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LIGHTBOX ZOOM FOTO DOKUMENTASI */}
      {previewFotoModal && (
        <div className="modal-backdrop" onClick={() => setPreviewFotoModal(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 780, padding: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f4d3a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📸</span> Dokumentasi: {previewFotoModal.caption || previewFotoModal.fileName}
              </div>
              <button
                type="button"
                onClick={() => setPreviewFotoModal(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#707974', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: '#0d1310',
                borderRadius: 8,
                padding: '8px',
                textAlign: 'center',
                maxHeight: '65vh',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <img
                src={`/api/rapat/${id}/dokumentasi/${previewFotoModal.id}?mode=view`}
                alt={previewFotoModal.caption || previewFotoModal.fileName}
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 4 }}
              />
            </div>

            {previewFotoModal.caption && (
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#131e18', marginBottom: 6 }}>
                "{previewFotoModal.caption}"
              </div>
            )}

            <div style={{ fontSize: 12, color: '#707974', marginBottom: 16 }}>
              Berkas: {previewFotoModal.fileName} • Ukuran: {formatUkuran(previewFotoModal.fileSize)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <a
                href={`/api/rapat/${id}/dokumentasi/${previewFotoModal.id}?mode=download`}
                className="btn-primary"
                style={{ textDecoration: 'none', padding: '8px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>📥</span> Unduh Foto Ukuran Penuh
              </a>
              <button
                type="button"
                onClick={() => setPreviewFotoModal(null)}
                className="btn-secondary"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ZOOM TTD */}
      {zoomTtd && (
        <div className="modal-backdrop" onClick={() => setZoomTtd(null)}>
          <div className="modal-card" style={{ maxWidth: 380, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#0f4d3a' }}>Verifikasi Tanda Tangan</div>
              <button
                type="button"
                onClick={() => setZoomTtd(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, color: '#707974', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontWeight: 700, fontSize: 14.5, color: '#131e18' }}>{zoomTtd.nama}</div>
            <div style={{ fontSize: 12, color: '#5a6b62', marginBottom: 14 }}>{zoomTtd.jabatan} • {formatWaktu(zoomTtd.waktuHadir)}</div>

            <div style={{ background: '#ffffff', border: '1.5px solid #d2ded8', borderRadius: 10, padding: '20px', marginBottom: 14 }}>
              <img src={zoomTtd.ttdData} alt="Tanda Tangan" style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }} />
            </div>

            <div style={{ fontSize: 11.5, color: '#707974', marginBottom: 14, fontFamily: 'monospace' }}>
              Barcode ID: {zoomTtd.barcodeData || '-'}
            </div>

            <button type="button" onClick={() => setZoomTtd(null)} className="btn-secondary" style={{ width: '100%' }}>
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL HAPUS PESERTA */}
      {hapusPesertaTarget && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 400 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#c53030', marginBottom: 10 }}>
              Hapus Presensi Peserta?
            </div>
            <p style={{ fontSize: 13.5, color: '#334', margin: '0 0 16px', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus data kehadiran dan tanda tangan digital atas nama <strong>"{hapusPesertaTarget.nama}"</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setHapusPesertaTarget(null)} className="btn-secondary" disabled={deletingPeserta}>
                Batal
              </button>
              <button type="button" onClick={handleDeletePeserta} className="btn-danger" disabled={deletingPeserta}>
                {deletingPeserta ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

