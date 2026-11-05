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

  // Upload PDF Rangkuman
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const fileInputRef = useRef(null);

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

  // Handle Upload PDF Rangkuman
  async function handleUploadPdf(e) {
    e.preventDefault();
    setPdfError('');
    if (!pdfFile) {
      setPdfError('Pilih berkas PDF rangkuman terlebih dahulu.');
      return;
    }
    if (pdfFile.type !== 'application/pdf') {
      setPdfError('Hanya berkas format PDF yang diperbolehkan.');
      return;
    }

    setUploadingPdf(true);
    const fd = new FormData();
    fd.append('file', pdfFile);

    try {
      const res = await fetch(`/api/rapat/${id}/upload-rangkuman`, {
        method: 'POST',
        body: fd,
      });
      const resData = await res.json();
      if (!res.ok) {
        setPdfError(resData.error || 'Gagal mengunggah berkas.');
      } else {
        setPdfFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        loadData();
      }
    } catch (err) {
      setPdfError('Terjadi kesalahan jaringan.');
    } finally {
      setUploadingPdf(false);
    }
  }

  // Handle Hapus PDF Rangkuman
  async function handleDeletePdf() {
    if (!confirm('Hapus berkas PDF rangkuman rapat ini?')) return;
    try {
      const res = await fetch(`/api/rapat/${id}/rangkuman`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        alert('Gagal menghapus berkas.');
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
            <span>🖨️</span> Cetak Daftar Hadir
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

          {/* KARTU 2: UPLOAD & ARSIP RANGKUMAN PDF */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#0f4d3a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📄</span> Berkas Rangkuman Rapat (PDF)
              </div>
              {data.fileRangkumanPath ? (
                <span style={{ background: '#e6f7ee', color: '#136b4e', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  ✓ Terunggah
                </span>
              ) : (
                <span style={{ background: '#f4f6f5', color: '#8a978f', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                  Belum Ada
                </span>
              )}
            </div>

            {data.fileRangkumanPath ? (
              /* DOKUMEN SUDAH TERUNGGAH */
              <div style={{ background: '#f8faf9', border: '1px solid #e2e6e4', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    PDF
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#131e18', wordBreak: 'break-all' }}>
                      {data.fileRangkumanName || 'Rangkuman Rapat.pdf'}
                    </div>
                    <div style={{ fontSize: 12, color: '#707974', marginTop: 2 }}>
                      Ukuran: {formatUkuran(data.fileRangkumanSize)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <a
                    href={`/api/rapat/${id}/rangkuman?mode=view`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                    style={{ padding: '8px 14px', fontSize: 12.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>👁️</span> Buka / Lihat PDF
                  </a>

                  <a
                    href={`/api/rapat/${id}/rangkuman?mode=download`}
                    className="btn-secondary"
                    style={{ padding: '8px 14px', fontSize: 12.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>📥</span> Unduh Berkas
                  </a>

                  {bisaKelola && (
                    <button
                      type="button"
                      onClick={handleDeletePdf}
                      className="btn-danger"
                      style={{ padding: '8px 12px', fontSize: 12.5 }}
                    >
                      Hapus PDF
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* BELUM ADA DOKUMEN */
              <div style={{ textAlign: 'center', padding: '24px 14px', background: '#fafbfa', border: '1.5px dashed #d2ded8', borderRadius: 10, marginBottom: 16 }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>📑</div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f4d3a', marginBottom: 4 }}>
                  Belum Ada Berkas Rangkuman Rapat
                </div>
                <div style={{ fontSize: 12, color: '#707974' }}>
                  Unggah berkas notulen / rangkuman hasil rapat dalam format PDF (maks. 30MB).
                </div>
              </div>
            )}

            {/* Form Unggah / Ganti PDF */}
            {bisaKelola && (
              <form onSubmit={handleUploadPdf} style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f4d3a', marginBottom: 6 }}>
                  {data.fileRangkumanPath ? 'Ganti dengan File PDF Baru:' : 'Unggah File PDF Notulen:'}
                </div>

                {pdfError && (
                  <div style={{ background: '#fff0f0', color: '#c53030', fontSize: 12, padding: '8px 10px', borderRadius: 6, marginBottom: 8 }}>
                    ⚠️ {pdfError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files[0] || null)}
                    className="input-field"
                    style={{ padding: '7px 10px', fontSize: 12 }}
                  />
                  <button
                    type="submit"
                    disabled={uploadingPdf || !pdfFile}
                    className="btn-primary"
                    style={{ padding: '8px 14px', fontSize: 12.5, whiteSpace: 'nowrap' }}
                  >
                    {uploadingPdf ? 'Mengunggah...' : 'Upload PDF'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ROW 2: ABSENSI & PRESENSI DIGITAL */}
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

