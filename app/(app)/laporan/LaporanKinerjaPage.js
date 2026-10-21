'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
const { NAMA_BULAN } = require('../../lib/bulan');

const CURRENT_YEAR = new Date().getFullYear();
const emptyForm = { namaDokumen: '', bulan: '', tahun: CURRENT_YEAR, jenisLaporanId: '', file: null };

function fmtAngka(n) {
  if (n === null || n === undefined || isNaN(n)) return '-';
  return (Math.round(n * 100) / 100).toLocaleString('id-ID');
}

function hitungLokal(indikator, rows) {
  if (indikator.tipeInput === 1) {
    const row = rows.find((r) => r.bulan === 0);
    const nilai = row && row.nilai1 !== null && row.nilai1 !== undefined ? row.nilai1 : null;
    const capaian = nilai != null && indikator.target ? (nilai / indikator.target) * 100 : null;
    return { nilai, jumlah1: null, jumlah2: null, realisasi: null, capaian };
  }
  let jumlah1 = 0, jumlah2 = 0, ada = false;
  for (let b = 1; b <= 12; b++) {
    const row = rows.find((r) => r.bulan === b);
    if (row) {
      if (row.nilai1 !== null && row.nilai1 !== undefined) { jumlah1 += Number(row.nilai1); ada = true; }
      if (row.nilai2 !== null && row.nilai2 !== undefined) { jumlah2 += Number(row.nilai2); ada = true; }
    }
  }
  const realisasi = ada && jumlah2 > 0 ? (jumlah1 / jumlah2) * 100 : null;
  const capaian = realisasi != null && indikator.target ? (realisasi / indikator.target) * 100 : null;
  return { nilai: null, jumlah1: ada ? jumlah1 : null, jumlah2: ada ? jumlah2 : null, realisasi, capaian };
}

export default function LaporanKinerjaPage({ role }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'kinerja' ? 'kinerja' : 'laporan';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [tahun, setTahun] = useState(CURRENT_YEAR);
  const bisaEdit = role !== 'staf_umum';
  const isAdmin = role === 'admin';

  // ================= TAB 1: ARSIP LAPORAN STATE =================
  const [grid, setGrid] = useState([]);
  const [loadingGrid, setLoadingGrid] = useState(true);
  const [jenisOptions, setJenisOptions] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [currentFileInfo, setCurrentFileInfo] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [actionCell, setActionCell] = useState(null);
  const [hapusTarget, setHapusTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ================= TAB 2: CAPAIAN KINERJA STATE =================
  const [kinerjaData, setKinerjaData] = useState([]);
  const [loadingKinerja, setLoadingKinerja] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const [modalIndikator, setModalIndikator] = useState(null);
  const [modalRows, setModalRows] = useState({});
  const [savingKinerja, setSavingKinerja] = useState(false);
  const [modalError, setModalError] = useState('');

  // Tambah Sasaran Langsung
  const [showTambahSasaran, setShowTambahSasaran] = useState(false);
  const [namaSasaranBaru, setNamaSasaranBaru] = useState('');
  const [submittingSasaran, setSubmittingSasaran] = useState(false);
  const [sasaranError, setSasaranError] = useState('');

  // Tambah Indikator Langsung
  const [showTambahIndikator, setShowTambahIndikator] = useState(null); // { sasaranId, sasaranNama }
  const [indikatorForm, setIndikatorForm] = useState({
    nama: '',
    tipeInput: 2,
    labelInput1: '',
    labelInput2: '',
    target: '',
  });
  const [submittingIndikator, setSubmittingIndikator] = useState(false);
  const [indikatorError, setIndikatorError] = useState('');

  // Hapus Sasaran / Indikator
  const [hapusKinerjaTarget, setHapusKinerjaTarget] = useState(null); // { tipe: 'sasaran'|'indikator', id, nama, jumlahIndikator? }
  const [deletingKinerja, setDeletingKinerja] = useState(false);
  const [deleteKinerjaError, setDeleteKinerjaError] = useState('');

  // Sinkronisasi Tab dengan URL
  function handleSelectTab(tab) {
    setActiveTab(tab);
    router.replace(`/laporan?tab=${tab}`, { scroll: false });
  }

  // Load Jenis Laporan
  useEffect(() => {
    fetch('/api/jenis-laporan')
      .then((r) => r.json())
      .then((data) => setJenisOptions(data.data || []))
      .catch(() => {});
  }, []);

  // Load Grid Laporan
  const loadGrid = useCallback(() => {
    setLoadingGrid(true);
    fetch(`/api/laporan/grid?tahun=${tahun}`)
      .then((r) => r.json())
      .then((data) => {
        setGrid(data.grid || []);
        setLoadingGrid(false);
      })
      .catch(() => setLoadingGrid(false));
  }, [tahun]);

  // Load Kinerja Data
  const loadKinerja = useCallback(() => {
    setLoadingKinerja(true);
    fetch(`/api/kinerja?tahun=${tahun}`)
      .then((r) => r.json())
      .then((res) => {
        setKinerjaData(res.data || []);
        setLoadingKinerja(false);
      })
      .catch(() => setLoadingKinerja(false));
  }, [tahun]);

  useEffect(() => {
    loadGrid();
    loadKinerja();
  }, [loadGrid, loadKinerja]);

  // Handler Laporan Modals
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

  function openCellAction(jenis, bulanData) {
    setActionCell({
      arsipId: bulanData.arsipId,
      namaDokumen: bulanData.namaDokumen,
      jenisLaporanId: jenis.jenisLaporanId,
      jenisNama: jenis.nama,
      bulan: bulanData.bulan,
    });
  }

  async function handleEditFromAction() {
    const res = await fetch(`/api/laporan/${actionCell.arsipId}?mode=meta`);
    const data = await res.json();
    const a = data.data;
    setForm({
      namaDokumen: a.namaDokumen,
      bulan: String(a.bulan),
      tahun: a.tahun,
      jenisLaporanId: String(a.jenisLaporanId),
      file: null,
    });
    setCurrentFileInfo({ fileName: a.fileName, fileSize: a.fileSize, id: a.id });
    setEditId(a.id);
    setFormError('');
    setActionCell(null);
    setShowForm(true);
  }

  async function handleSubmitLaporan(e) {
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

  async function handleDeleteLaporan() {
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

  // Handler Kinerja Modal & Export
  function openModalKinerja(indikator) {
    const rows = {};
    if (indikator.tipeInput === 1) {
      const r = indikator.capaianRows.find((x) => x.bulan === 0);
      rows[0] = { nilai1: r?.nilai1 ?? '' };
    } else {
      for (let b = 1; b <= 12; b++) {
        const r = indikator.capaianRows.find((x) => x.bulan === b);
        rows[b] = { nilai1: r?.nilai1 ?? '', nilai2: r?.nilai2 ?? '' };
      }
    }
    setModalRows(rows);
    setModalError('');
    setModalIndikator(indikator);
  }

  function updateModalRow(bulan, field, value) {
    setModalRows((prev) => ({ ...prev, [bulan]: { ...prev[bulan], [field]: value } }));
  }

  async function handleSaveModalKinerja() {
    if (!modalIndikator) return;
    setSavingKinerja(true);
    setModalError('');

    const bulanList = modalIndikator.tipeInput === 1 ? [0] : Array.from({ length: 12 }, (_, i) => i + 1);

    for (const b of bulanList) {
      const row = modalRows[b] || {};
      const res = await fetch('/api/kinerja/capaian', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indikatorId: modalIndikator.id,
          tahun,
          bulan: b,
          nilai1: row.nilai1 === '' ? null : row.nilai1,
          nilai2: row.nilai2 === '' || row.nilai2 === undefined ? null : row.nilai2,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        setModalError(errData.error || 'Gagal menyimpan salah satu bulan.');
        setSavingKinerja(false);
        return;
      }
    }

    setSavingKinerja(false);
    setModalIndikator(null);
    loadKinerja();
  }

  // Handler Tambah Sasaran Langsung
  async function handleTambahSasaran(e) {
    e.preventDefault();
    if (!namaSasaranBaru.trim()) return;
    setSubmittingSasaran(true);
    setSasaranError('');
    try {
      const res = await fetch('/api/kinerja/sasaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: namaSasaranBaru.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSasaranError(data.error || 'Gagal menambahkan sasaran.');
        setSubmittingSasaran(false);
        return;
      }
      setNamaSasaranBaru('');
      setShowTambahSasaran(false);
      setSubmittingSasaran(false);
      loadKinerja();
    } catch {
      setSasaranError('Terjadi kesalahan jaringan.');
      setSubmittingSasaran(false);
    }
  }

  // Handler Tambah Indikator Langsung
  async function handleTambahIndikator(e) {
    e.preventDefault();
    if (!showTambahIndikator?.sasaranId) return;
    setSubmittingIndikator(true);
    setIndikatorError('');
    try {
      const res = await fetch('/api/kinerja/indikator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sasaranId: showTambahIndikator.sasaranId,
          nama: indikatorForm.nama.trim(),
          tipeInput: Number(indikatorForm.tipeInput),
          labelInput1: indikatorForm.labelInput1.trim(),
          labelInput2: Number(indikatorForm.tipeInput) === 2 ? indikatorForm.labelInput2.trim() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIndikatorError(data.error || 'Gagal menambahkan indikator.');
        setSubmittingIndikator(false);
        return;
      }

      // Jika target diisi, langsung simpan untuk tahun yang aktif
      if (indikatorForm.target !== '' && indikatorForm.target !== null && !isNaN(Number(indikatorForm.target))) {
        await fetch('/api/kinerja/target', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            indikatorId: data.id,
            tahun,
            target: Number(indikatorForm.target),
          }),
        });
      }

      setShowTambahIndikator(null);
      setIndikatorForm({ nama: '', tipeInput: 2, labelInput1: '', labelInput2: '', target: '' });
      setSubmittingIndikator(false);
      loadKinerja();
    } catch {
      setIndikatorError('Terjadi kesalahan saat menyimpan.');
      setSubmittingIndikator(false);
    }
  }

  // Handler Hapus Sasaran / Indikator Langsung
  async function handleDeleteKinerja() {
    if (!hapusKinerjaTarget) return;
    setDeletingKinerja(true);
    setDeleteKinerjaError('');
    try {
      const url =
        hapusKinerjaTarget.tipe === 'sasaran'
          ? `/api/kinerja/sasaran/${hapusKinerjaTarget.id}`
          : `/api/kinerja/indikator/${hapusKinerjaTarget.id}`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteKinerjaError(data.error || 'Gagal menghapus.');
        setDeletingKinerja(false);
        return;
      }
      setDeletingKinerja(false);
      setHapusKinerjaTarget(null);
      loadKinerja();
    } catch {
      setDeleteKinerjaError('Terjadi kesalahan jaringan.');
      setDeletingKinerja(false);
    }
  }

  async function handleExportKinerja() {
    setExporting(true);
    setExportError('');
    const res = await fetch(`/api/kinerja/export?tahun=${tahun}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      setExportError(errData.error || 'Gagal mengekspor.');
      setExporting(false);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Capaian-Kinerja-${tahun}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  // Ringkasan Metrik Laporan
  const statsLaporan = useMemo(() => {
    let totalCell = 0;
    let terisi = 0;
    grid.forEach((j) => {
      j.bulan.forEach((b) => {
        totalCell++;
        if (b.sudahUpload) terisi++;
      });
    });
    const pct = totalCell > 0 ? ((terisi / totalCell) * 100).toFixed(1) : 0;
    return { totalCell, terisi, pct, jenisCount: grid.length };
  }, [grid]);

  // Ringkasan Metrik Kinerja
  const statsKinerja = useMemo(() => {
    let countIndikator = 0;
    let totalCapaian = 0;
    let validCapaianCount = 0;
    kinerjaData.forEach((sasaran) => {
      sasaran.indikator.forEach((ind) => {
        countIndikator++;
        const res = hitungLokal(ind, ind.capaianRows);
        if (res.capaian != null) {
          totalCapaian += res.capaian;
          validCapaianCount++;
        }
      });
    });
    const avgCapaian = validCapaianCount > 0 ? (totalCapaian / validCapaianCount).toFixed(1) : '-';
    return { sasaranCount: kinerjaData.length, indikatorCount: countIndikator, avgCapaian };
  }, [kinerjaData]);

  return (
    <div className="page-body" style={{ background: '#f8faf9', minHeight: '100vh', paddingTop: 24 }}>
      <div className="dashboard-container">
        {/* Top Header */}
        <div className="dashboard-header">
          <div>
            <div className="dashboard-badge-tag">
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>analytics</span>
              ADMINISTRASI & AKUNTABILITAS • PA GUNUNG SUGIH
            </div>
            <h1 className="dashboard-title">Laporan & Kinerja</h1>
            <p className="dashboard-subtitle">
              Matriks pemantauan berkas laporan bulanan dan evaluasi target kinerja instansi
            </p>
          </div>

          <div className="dashboard-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teks-muted)', textTransform: 'uppercase' }}>
                Tahun
              </span>
              <select
                className="dashboard-select"
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
              >
                {Array.from({ length: 8 }, (_, i) => CURRENT_YEAR - i + 1).map((y) => (
                  <option key={y} value={y}>Tahun {y}</option>
                ))}
              </select>
            </div>

            {activeTab === 'laporan' && bisaEdit && (
              <button onClick={openUploadFree} className="dashboard-btn-primary">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upload_file</span>
                <span>Upload Laporan</span>
              </button>
            )}

            {activeTab === 'kinerja' && (
              <>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setNamaSasaranBaru('');
                      setSasaranError('');
                      setShowTambahSasaran(true);
                    }}
                    className="dashboard-btn-primary"
                    style={{
                      background: '#ffffff',
                      color: 'var(--hijau-tua)',
                      border: '1px solid var(--border)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--hijau)' }}>
                      add_circle
                    </span>
                    <span>Tambah Sasaran</span>
                  </button>
                )}
                <button onClick={handleExportKinerja} disabled={exporting} className="dashboard-btn-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>file_download</span>
                  <span>{exporting ? 'Mengekspor...' : 'Export Excel'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Selector Nav */}
        <div className="stitch-tab-nav">
          <button
            onClick={() => handleSelectTab('laporan')}
            className={`stitch-tab-button ${activeTab === 'laporan' ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>table_chart</span>
            <span>Arsip Laporan (Matriks Bulanan)</span>
          </button>
          <button
            onClick={() => handleSelectTab('kinerja')}
            className={`stitch-tab-button ${activeTab === 'kinerja' ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>trending_up</span>
            <span>Capaian Kinerja (Target & Realisasi)</span>
          </button>
        </div>

        {/* ======================= TAB 1: ARSIP LAPORAN ======================= */}
        {activeTab === 'laporan' && (
          <div>
            {/* 3 Metric Cards Ringkas */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
              <div className="kpi-card">
                <div className="kpi-top-row">
                  <span className="kpi-label">KELENGKAPAN {tahun}</span>
                  <div className="kpi-icon-chip" style={{ background: '#e6f7ee', color: 'var(--hijau)' }}>
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                </div>
                <div className="kpi-metric-row">
                  <span className="kpi-metric-number">{statsLaporan.pct}%</span>
                  <span className="kpi-pill-badge" style={{ background: '#e6f7ee', color: 'var(--hijau)' }}>
                    {statsLaporan.terisi} / {statsLaporan.totalCell} Berkas
                  </span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-top-row">
                  <span className="kpi-label">BERKAS TERUNGGAH</span>
                  <div className="kpi-icon-chip" style={{ background: '#eaf7ed', color: '#1e8a63' }}>
                    <span className="material-symbols-outlined">folder_special</span>
                  </div>
                </div>
                <div className="kpi-metric-row">
                  <span className="kpi-metric-number">{statsLaporan.terisi}</span>
                  <span className="kpi-pill-badge" style={{ background: '#eaf7ed', color: '#1e8a63' }}>
                    Dokumen PDF
                  </span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-top-row">
                  <span className="kpi-label">JENIS LAPORAN</span>
                  <div className="kpi-icon-chip" style={{ background: '#e6f0ff', color: '#1a56db' }}>
                    <span className="material-symbols-outlined">category</span>
                  </div>
                </div>
                <div className="kpi-metric-row">
                  <span className="kpi-metric-number">{statsLaporan.jenisCount}</span>
                  <span className="kpi-pill-badge" style={{ background: '#e6f0ff', color: '#1a56db' }}>
                    Kategori Aktif
                  </span>
                </div>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="stitch-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px 14px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 className="stitch-card-title">Matriks Pengunggahan Laporan Bulanan</h2>
                  <p className="stitch-card-subtitle">
                    Tahun Anggaran {tahun} • Klik ikon centang untuk melihat berkas atau titik untuk upload langsung
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="matrix-cell-done" style={{ width: 22, height: 22, fontSize: 12 }}>✓</span>
                    <span style={{ color: 'var(--teks)' }}>Sudah Terunggah</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="matrix-cell-empty" style={{ width: 22, height: 22, fontSize: 14 }}>·</span>
                    <span style={{ color: 'var(--teks-muted)' }}>Belum Diunggah</span>
                  </div>
                </div>
              </div>

              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table className="stitch-table">
                  <thead>
                    <tr>
                      <th style={{ position: 'sticky', left: 0, background: '#f8faf9', zIndex: 10, width: 260 }}>
                        Jenis Laporan
                      </th>
                      {NAMA_BULAN.map((b, i) => (
                        <th key={i} style={{ textAlign: 'center', minWidth: 50, padding: '10px 4px' }}>
                          {b.slice(0, 3)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grid.map((jenis) => (
                      <tr key={jenis.jenisLaporanId}>
                        <td
                          style={{
                            fontWeight: 700,
                            color: 'var(--hijau-tua)',
                            position: 'sticky',
                            left: 0,
                            background: '#ffffff',
                            zIndex: 9,
                            whiteSpace: 'nowrap',
                            borderRight: '1px solid #f0f4f2',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--hijau)' }}>
                              description
                            </span>
                            <span>{jenis.nama}</span>
                          </div>
                        </td>
                        {jenis.bulan.map((b) => (
                          <td key={b.bulan} style={{ textAlign: 'center', padding: '6px 4px' }}>
                            <button
                              onClick={() =>
                                b.sudahUpload
                                  ? openCellAction(jenis, b)
                                  : bisaEdit && openUploadFor(jenis.jenisLaporanId, b.bulan)
                              }
                              title={b.sudahUpload ? `${b.namaDokumen} (Klik untuk opsi)` : (bisaEdit ? 'Klik untuk upload' : 'Belum ada')}
                              className={b.sudahUpload ? 'matrix-cell-done' : `matrix-cell-empty ${bisaEdit ? 'clickable' : ''}`}
                            >
                              {b.sudahUpload ? '✓' : '·'}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                    {!loadingGrid && grid.length === 0 && (
                      <tr>
                        <td colSpan={13} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--teks-muted)' }}>
                          Belum ada kategori jenis laporan terdaftar. Silakan atur di menu Pengaturan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: CAPAIAN KINERJA ======================= */}
        {activeTab === 'kinerja' && (
          <div>
            {exportError && (
              <div style={{ background: '#fff0f0', border: '1px solid #f5c6c6', color: '#c53030', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                {exportError}
              </div>
            )}

            {/* 3 Metric Cards Kinerja */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
              <div className="kpi-card">
                <div className="kpi-top-row">
                  <span className="kpi-label">TOTAL SASARAN STRATEGIS</span>
                  <div className="kpi-icon-chip" style={{ background: '#eaf7ed', color: 'var(--hijau)' }}>
                    <span className="material-symbols-outlined">flag</span>
                  </div>
                </div>
                <div className="kpi-metric-row">
                  <span className="kpi-metric-number">{statsKinerja.sasaranCount}</span>
                  <span className="kpi-pill-badge" style={{ background: '#eaf7ed', color: 'var(--hijau)' }}>
                    Sasaran Utama
                  </span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-top-row">
                  <span className="kpi-label">INDIKATOR KINERJA (IKU)</span>
                  <div className="kpi-icon-chip" style={{ background: '#e6f0ff', color: '#1a56db' }}>
                    <span className="material-symbols-outlined">checklist</span>
                  </div>
                </div>
                <div className="kpi-metric-row">
                  <span className="kpi-metric-number">{statsKinerja.indikatorCount}</span>
                  <span className="kpi-pill-badge" style={{ background: '#e6f0ff', color: '#1a56db' }}>
                    Indikator Terukur
                  </span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-top-row">
                  <span className="kpi-label">RATA-RATA CAPAIAN ({tahun})</span>
                  <div className="kpi-icon-chip" style={{ background: '#fff3e0', color: '#b5680a' }}>
                    <span className="material-symbols-outlined">speed</span>
                  </div>
                </div>
                <div className="kpi-metric-row">
                  <span className="kpi-metric-number" style={{ color: statsKinerja.avgCapaian >= 100 ? 'var(--hijau)' : '#b5680a' }}>
                    {statsKinerja.avgCapaian}%
                  </span>
                  <span className="kpi-pill-badge" style={{ background: statsKinerja.avgCapaian >= 100 ? '#e6f7ee' : '#fff3e0', color: statsKinerja.avgCapaian >= 100 ? 'var(--hijau)' : '#b5680a' }}>
                    {statsKinerja.avgCapaian >= 100 ? 'Tercapai' : 'Proses'}
                  </span>
                </div>
              </div>
            </div>

            {/* Sasaran Cards */}
            {!loadingKinerja && kinerjaData.length === 0 && (
              <div className="stitch-card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--teks-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--teks-muted)', marginBottom: 8 }}>
                  assignment_late
                </span>
                <p style={{ margin: '0 0 14px 0', fontSize: 14 }}>Belum ada Sasaran & Indikator Kinerja untuk tahun {tahun}.</p>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setNamaSasaranBaru('');
                        setSasaranError('');
                        setShowTambahSasaran(true);
                      }}
                      className="dashboard-btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
                      <span>Tambah Sasaran Pertama</span>
                    </button>
                    <a href="/pengaturan?tab=kinerja" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '9px 16px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>settings</span>
                      <span>Buka Pengaturan</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {kinerjaData.map((sasaran) => (
              <div key={sasaran.id} className="stitch-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: '#fafcfb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--hijau)' }}>
                      target
                    </span>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--hijau-tua)' }}>
                      {sasaran.nama}
                    </h3>
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: 12, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => {
                          setIndikatorForm({ nama: '', tipeInput: 2, labelInput1: '', labelInput2: '', target: '' });
                          setIndikatorError('');
                          setShowTambahIndikator({ sasaranId: sasaran.id, sasaranNama: sasaran.nama });
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--hijau)' }}>add</span>
                        <span>Tambah Indikator</span>
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        title="Hapus Sasaran"
                        style={{
                          fontSize: 12,
                          padding: '5px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#dc2626',
                          borderColor: '#fca5a5',
                          background: '#fff5f5',
                        }}
                        onClick={() => {
                          setDeleteKinerjaError('');
                          setHapusKinerjaTarget({
                            tipe: 'sasaran',
                            id: sasaran.id,
                            nama: sasaran.nama,
                            jumlahIndikator: sasaran.indikator.length,
                          });
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="stitch-table">
                    <thead>
                      <tr>
                        <th>Indikator Kinerja Utama (IKU)</th>
                        <th style={{ textAlign: 'center', width: 100 }}>Target</th>
                        <th style={{ textAlign: 'center', width: 130 }}>Realisasi (%)</th>
                        <th style={{ textAlign: 'center', width: 130 }}>Capaian (%)</th>
                        <th style={{ textAlign: 'center', width: 110 }}>Status</th>
                        <th style={{ textAlign: 'right', width: 180 }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sasaran.indikator.map((ind) => {
                        const hasil = hitungLokal(ind, ind.capaianRows);
                        const isTercapai = hasil.capaian != null && hasil.capaian >= 100;
                        return (
                          <tr key={ind.id}>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--teks)' }}>{ind.nama}</div>
                              {!ind.aktif && (
                                <span className="kpi-pill-badge" style={{ background: '#fff3e0', color: '#b5680a', marginTop: 4 }}>
                                  Nonaktif
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--teks)' }}>
                              {ind.target ?? '-'}
                            </td>
                            <td style={{ textAlign: 'center', color: 'var(--teks-muted)' }}>
                              {ind.tipeInput === 1 ? '-' : fmtAngka(hasil.realisasi)}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: isTercapai ? 'var(--hijau)' : '#b5680a' }}>
                              {fmtAngka(hasil.capaian)}%
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {hasil.capaian != null ? (
                                <span
                                  className="kpi-pill-badge"
                                  style={{
                                    background: isTercapai ? '#e6f7ee' : '#fff3e0',
                                    color: isTercapai ? 'var(--hijau)' : '#b5680a',
                                  }}
                                >
                                  {isTercapai ? 'Tercapai' : 'Belum'}
                                </span>
                              ) : (
                                <span className="kpi-pill-badge" style={{ background: '#f4f6f5', color: '#707974' }}>
                                  Kosong
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {isAdmin ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                                  <button
                                    className="btn-secondary"
                                    style={{ fontSize: 12, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    onClick={() => openModalKinerja(ind)}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                                    <span>{ind.tipeInput === 1 ? 'Isi Nilai' : 'Isi Bulanan'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    title="Hapus Indikator"
                                    style={{
                                      fontSize: 12,
                                      padding: '5px 8px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#dc2626',
                                      borderColor: '#fca5a5',
                                      background: '#fff5f5',
                                    }}
                                    onClick={() => {
                                      setDeleteKinerjaError('');
                                      setHapusKinerjaTarget({
                                        tipe: 'indikator',
                                        id: ind.id,
                                        nama: ind.nama,
                                      });
                                    }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: 12, color: 'var(--teks-muted)' }}>Hanya Admin</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {sasaran.indikator.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '26px 16px', color: 'var(--teks-muted)' }}>
                            <div style={{ marginBottom: 8, fontSize: 13 }}>Belum ada indikator pada sasaran ini.</div>
                            {isAdmin && (
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ fontSize: 12, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                onClick={() => {
                                  setIndikatorForm({ nama: '', tipeInput: 2, labelInput1: '', labelInput2: '', target: '' });
                                  setIndikatorError('');
                                  setShowTambahIndikator({ sasaranId: sasaran.id, sasaranNama: sasaran.nama });
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--hijau)' }}>add_circle</span>
                                <span>Tambah Indikator Sekarang</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ======================= MODAL: DETAIL / AKSI CELL ======================= */}
        {actionCell && (
          <div className="modal-overlay" onClick={() => setActionCell(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#e6f7ee', color: 'var(--hijau)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined">task_alt</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--hijau-tua)' }}>
                    {actionCell.jenisNama}
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--teks-muted)' }}>
                    Periode {NAMA_BULAN[actionCell.bulan - 1]} {tahun}
                  </p>
                </div>
              </div>

              <div style={{ background: '#f8faf9', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teks-muted)', textTransform: 'uppercase' }}>Nama Dokumen</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--teks)', marginTop: 2 }}>{actionCell.namaDokumen}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                <a
                  href={`/api/laporan/${actionCell.arsipId}?mode=view`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                  <span>Buka PDF</span>
                </a>
                <a
                  href={`/api/laporan/${actionCell.arsipId}?mode=download`}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                  <span>Download</span>
                </a>
              </div>

              {bisaEdit && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  <button
                    className="btn-secondary"
                    onClick={handleEditFromAction}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    <span>Ubah Metadata</span>
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => {
                      setHapusTarget({ id: actionCell.arsipId, namaDokumen: actionCell.namaDokumen });
                      setActionCell(null);
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    <span>Hapus File</span>
                  </button>
                </div>
              )}

              <button
                className="btn-secondary"
                style={{ width: '100%' }}
                onClick={() => setActionCell(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* ======================= MODAL: UPLOAD / EDIT LAPORAN ======================= */}
        {showForm && (
          <div className="modal-overlay" onClick={() => !submitting && setShowForm(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--hijau-tua)' }}>
                  {editId ? 'Edit Metadata Laporan' : 'Upload Berkas Laporan'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  style={{ background: 'none', border: 'none', fontSize: 18, color: '#889', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div style={{ background: '#fff0f0', border: '1px solid #f5c6c6', color: '#c53030', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmitLaporan}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Kategori Laporan *
                  </label>
                  <select
                    className="input-field"
                    value={form.jenisLaporanId}
                    onChange={(e) => setForm({ ...form, jenisLaporanId: e.target.value })}
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {jenisOptions.map((j) => (
                      <option key={j.id} value={j.id}>{j.nama}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Nama Dokumen Laporan *
                  </label>
                  <input
                    className="input-field"
                    value={form.namaDokumen}
                    onChange={(e) => setForm({ ...form, namaDokumen: e.target.value })}
                    placeholder="Contoh: Laporan Perkara Bulan Januari 2026"
                    required
                  />
                </div>

                <div className="form-grid-2" style={{ marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Bulan *</label>
                    <select
                      className="input-field"
                      value={form.bulan}
                      onChange={(e) => setForm({ ...form, bulan: e.target.value })}
                      required
                    >
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

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Berkas PDF {editId ? '(Opsional, jika ingin mengganti)' : '*'}
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="input-field"
                    onChange={(e) => setForm({ ...form, file: e.target.files[0] || null })}
                  />
                  {currentFileInfo && (
                    <div style={{ fontSize: 12, color: 'var(--teks-muted)', marginTop: 4 }}>
                      File saat ini: {currentFileInfo.fileName}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowForm(false)}
                    disabled={submitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="dashboard-btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : 'Upload File')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================= MODAL: HAPUS LAPORAN ======================= */}
        {hapusTarget && (
          <div className="modal-overlay" onClick={() => !deleting && setHapusTarget(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: 17, fontWeight: 700, color: '#c53030' }}>
                Hapus Berkas Laporan?
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: 13, color: '#556', lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus berkas <strong>{hapusTarget.namaDokumen}</strong>? File fisik dan riwayat pengunggahan akan dihapus permanen.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  className="btn-secondary"
                  onClick={() => setHapusTarget(null)}
                  disabled={deleting}
                >
                  Batal
                </button>
                <button
                  className="btn-danger"
                  onClick={handleDeleteLaporan}
                  disabled={deleting}
                >
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= MODAL: INPUT NILAI KINERJA ======================= */}
        {modalIndikator && (
          <div className="modal-overlay" onClick={() => !savingKinerja && setModalIndikator(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: modalIndikator.tipeInput === 1 ? 440 : 640 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--hijau-tua)' }}>
                    {modalIndikator.nama}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--teks-muted)' }}>
                    Tahun {tahun} • Target: <strong>{modalIndikator.target ?? '-'}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setModalIndikator(null)}
                  style={{ background: 'none', border: 'none', fontSize: 18, color: '#889', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {modalError && (
                <div style={{ background: '#fff0f0', border: '1px solid #f5c6c6', color: '#c53030', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
                  {modalError}
                </div>
              )}

              {modalIndikator.tipeInput === 1 ? (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    {modalIndikator.labelInput1 || 'Nilai Capaian Tahunan'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    value={modalRows[0]?.nilai1 ?? ''}
                    onChange={(e) => updateModalRow(0, 'nilai1', e.target.value)}
                    placeholder="Masukkan angka..."
                  />
                </div>
              ) : (
                <div style={{ maxHeight: 380, overflowY: 'auto', marginBottom: 20 }}>
                  <table className="stitch-table">
                    <thead>
                      <tr>
                        <th style={{ width: 110 }}>Bulan</th>
                        <th>{modalIndikator.labelInput1 || 'Jumlah 1'}</th>
                        <th>{modalIndikator.labelInput2 || 'Jumlah 2'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((b) => (
                        <tr key={b}>
                          <td style={{ fontWeight: 600, color: 'var(--teks)' }}>{NAMA_BULAN[b - 1]}</td>
                          <td>
                            <input
                              type="number"
                              step="any"
                              className="input-field"
                              style={{ width: '100%', padding: '6px 10px' }}
                              value={modalRows[b]?.nilai1 ?? ''}
                              onChange={(e) => updateModalRow(b, 'nilai1', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="any"
                              className="input-field"
                              style={{ width: '100%', padding: '6px 10px' }}
                              value={modalRows[b]?.nilai2 ?? ''}
                              onChange={(e) => updateModalRow(b, 'nilai2', e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalIndikator(null)}
                  disabled={savingKinerja}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="dashboard-btn-primary"
                  onClick={handleSaveModalKinerja}
                  disabled={savingKinerja}
                >
                  {savingKinerja ? 'Menyimpan...' : 'Simpan Nilai'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= MODAL: TAMBAH SASARAN ======================= */}
        {showTambahSasaran && (
          <div className="modal-overlay" onClick={() => !submittingSasaran && setShowTambahSasaran(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#eaf7ed',
                    color: 'var(--hijau)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                    flag
                  </span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--hijau-tua)' }}>
                    Tambah Sasaran Kinerja Baru
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--teks-muted)' }}>
                    Sasaran strategis utama Pengadilan Agama Gunung Sugih
                  </p>
                </div>
              </div>

              <form onSubmit={handleTambahSasaran}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--teks)' }}>
                    Nama Sasaran Kinerja *
                  </label>
                  <textarea
                    className="input-field"
                    rows={3}
                    value={namaSasaranBaru}
                    onChange={(e) => setNamaSasaranBaru(e.target.value)}
                    placeholder="Contoh: Terwujudnya Pelayanan Peradilan yang Pasti, Transparan dan Akuntabel"
                    style={{ width: '100%', resize: 'vertical' }}
                    required
                    autoFocus
                  />
                </div>

                {sasaranError && (
                  <div className="error-text" style={{ marginBottom: 14 }}>
                    {sasaranError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowTambahSasaran(false)}
                    disabled={submittingSasaran}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="dashboard-btn-primary"
                    disabled={submittingSasaran}
                  >
                    {submittingSasaran ? 'Menyimpan...' : 'Simpan Sasaran'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================= MODAL: TAMBAH INDIKATOR ======================= */}
        {showTambahIndikator && (
          <div className="modal-overlay" onClick={() => !submittingIndikator && setShowTambahIndikator(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                    playlist_add
                  </span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--hijau-tua)' }}>
                    Tambah Indikator Kinerja (IKU)
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--teks-muted)' }}>
                    Sasaran: <strong>{showTambahIndikator.sasaranNama}</strong>
                  </p>
                </div>
              </div>

              <form onSubmit={handleTambahIndikator}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--teks)' }}>
                    Nama Indikator Kinerja *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={indikatorForm.nama}
                    onChange={(e) => setIndikatorForm({ ...indikatorForm, nama: e.target.value })}
                    placeholder="misal: Persentase perkara yang diselesaikan tepat waktu"
                    required
                    autoFocus
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--teks)' }}>
                    Tipe Perhitungan *
                  </label>
                  <select
                    className="input-field"
                    value={indikatorForm.tipeInput}
                    onChange={(e) => setIndikatorForm({ ...indikatorForm, tipeInput: Number(e.target.value) })}
                  >
                    <option value={2}>2 Input Bulanan (Pembilang & Penyebut → Realisasi %)</option>
                    <option value={1}>1 Input Tahunan (Langsung dibandingkan ke Target)</option>
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--teks)' }}>
                    {Number(indikatorForm.tipeInput) === 2 ? 'Label Input Pertama (Pembilang) *' : 'Label Input Nilai *'}
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={indikatorForm.labelInput1}
                    onChange={(e) => setIndikatorForm({ ...indikatorForm, labelInput1: e.target.value })}
                    placeholder={
                      Number(indikatorForm.tipeInput) === 2
                        ? 'misal: Jumlah perkara diputus tepat waktu'
                        : 'misal: Nilai SAKIP instansi'
                    }
                    required
                  />
                </div>

                {Number(indikatorForm.tipeInput) === 2 && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--teks)' }}>
                      Label Input Kedua (Penyebut) *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={indikatorForm.labelInput2}
                      onChange={(e) => setIndikatorForm({ ...indikatorForm, labelInput2: e.target.value })}
                      placeholder="misal: Total perkara yang diputus"
                      required
                    />
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4, color: 'var(--teks)' }}>
                    Target Tahun {tahun} (%)
                  </label>
                  <p style={{ margin: '0 0 6px 0', fontSize: 11, color: 'var(--teks-muted)' }}>
                    Target capaian untuk tahun {tahun} (bisa disesuaikan nanti di Pengaturan atau diedit kapan saja)
                  </p>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    value={indikatorForm.target}
                    onChange={(e) => setIndikatorForm({ ...indikatorForm, target: e.target.value })}
                    placeholder="misal: 100 atau 85"
                  />
                </div>

                {indikatorError && (
                  <div className="error-text" style={{ marginBottom: 14 }}>
                    {indikatorError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowTambahIndikator(null)}
                    disabled={submittingIndikator}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="dashboard-btn-primary"
                    disabled={submittingIndikator}
                  >
                    {submittingIndikator ? 'Menyimpan...' : 'Simpan Indikator'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================= MODAL: HAPUS SASARAN / INDIKATOR ======================= */}
        {hapusKinerjaTarget && (
          <div className="modal-overlay" onClick={() => !deletingKinerja && setHapusKinerjaTarget(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#fef2f2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                    delete_forever
                  </span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--hijau-tua)' }}>
                    Hapus {hapusKinerjaTarget.tipe === 'sasaran' ? 'Sasaran' : 'Indikator'} Kinerja?
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--teks-muted)' }}>
                    Tindakan ini tidak dapat dibatalkan
                  </p>
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--teks)', marginBottom: 14, lineHeight: 1.5 }}>
                Yakin ingin menghapus {hapusKinerjaTarget.tipe === 'sasaran' ? 'sasaran strategis' : 'indikator kinerja'}:
                <br />
                <strong style={{ color: 'var(--hijau-tua)' }}>"{hapusKinerjaTarget.nama}"</strong>?
              </p>

              {hapusKinerjaTarget.tipe === 'sasaran' && hapusKinerjaTarget.jumlahIndikator > 0 && (
                <div style={{ background: '#fff3e0', border: '1px solid #ffd699', color: '#9a5b1e', padding: '10px 12px', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
                  ⚠️ Sasaran ini memiliki {hapusKinerjaTarget.jumlahIndikator} indikator. Menghapus sasaran ini juga akan menghapus seluruh indikator di dalamnya.
                </div>
              )}

              {deleteKinerjaError && (
                <div className="error-text" style={{ marginBottom: 14 }}>
                  {deleteKinerjaError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setHapusKinerjaTarget(null)}
                  disabled={deletingKinerja}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  style={{ padding: '8px 18px', fontSize: 13 }}
                  onClick={handleDeleteKinerja}
                  disabled={deletingKinerja}
                >
                  {deletingKinerja ? 'Menghapus...' : 'Hapus Sekarang'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
