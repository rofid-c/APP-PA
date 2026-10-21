'use client';
import { useEffect, useState, useCallback } from 'react';
const { NAMA_BULAN } = require('../../lib/bulan');

const CURRENT_YEAR = new Date().getFullYear();

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

export default function KinerjaPage() {
  const [tahun, setTahun] = useState(CURRENT_YEAR);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const [modalIndikator, setModalIndikator] = useState(null); // indikator lagi diedit
  const [modalRows, setModalRows] = useState({}); // { [bulan]: {nilai1, nilai2} }, bulan 0 untuk tipe-1
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/kinerja?tahun=${tahun}`)
      .then((r) => r.json())
      .then((res) => {
        setData(res.data || []);
        setLoading(false);
      });
  }, [tahun]);

  useEffect(() => { load(); }, [load]);

  function openModal(indikator) {
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

  async function handleSaveModal() {
    if (!modalIndikator) return;
    setSaving(true);
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
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setModalIndikator(null);
    load();
  }

  async function handleExport() {
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

  return (
    <div>
      <div className="topbar">
        <div style={{ fontWeight: 700, letterSpacing: 0.3 }}>CAPAIAN KINERJA TAHUNAN</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, color: '#667', fontWeight: 600 }}>Tahun</label>
          <select className="input-field" style={{ width: 110 }} value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
            {Array.from({ length: 8 }, (_, i) => CURRENT_YEAR - i + 1).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button className="btn-primary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Mengekspor...' : '⬇️ Export Excel'}
          </button>
        </div>
      </div>

      <div className="page-body">
        {exportError && <div className="error-text" style={{ marginBottom: 12 }}>{exportError}</div>}

        {!loading && data.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: '#889', padding: 30 }}>
            Belum ada Sasaran & Indikator Kinerja.<br />
            <a href="/pengaturan?tab=kinerja" style={{ color: 'var(--hijau-tua)', fontWeight: 600 }}>+ Kelola Sasaran & Indikator</a>
          </div>
        )}

        {data.map((sasaran) => (
          <div key={sasaran.id} className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>{sasaran.nama}</div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Indikator Kinerja</th>
                    <th style={{ textAlign: 'center' }}>Target</th>
                    <th style={{ textAlign: 'center' }}>Realisasi (%)</th>
                    <th style={{ textAlign: 'center' }}>Capaian (%)</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sasaran.indikator.map((indikator) => {
                    const hasil = hitungLokal(indikator, indikator.capaianRows);
                    return (
                      <tr key={indikator.id}>
                        <td>
                          {indikator.nama}
                          {!indikator.aktif && (
                            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#b5680a', background: '#fff3e0', padding: '2px 8px', borderRadius: 999 }}>
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>{indikator.target ?? '-'}</td>
                        <td style={{ textAlign: 'center' }}>{indikator.tipeInput === 1 ? '-' : fmtAngka(hasil.realisasi)}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: hasil.capaian != null && hasil.capaian >= 100 ? '#146c4f' : '#b5680a' }}>
                          {fmtAngka(hasil.capaian)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => openModal(indikator)}>
                            {indikator.tipeInput === 1 ? '✏️ Isi Nilai' : '📅 Isi Bulanan'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {sasaran.indikator.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#889', padding: 16 }}>Belum ada indikator di sasaran ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {modalIndikator && (
        <div className="modal-overlay" onClick={() => !saving && setModalIndikator(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: modalIndikator.tipeInput === 1 ? 420 : 620 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{modalIndikator.nama}</div>
            <div style={{ fontSize: 13, color: '#889', marginBottom: 16 }}>Tahun {tahun} · Target {modalIndikator.target ?? '-'}</div>

            {modalIndikator.tipeInput === 1 ? (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>{modalIndikator.labelInput1}</label>
                <input
                  type="number"
                  step="any"
                  className="input-field"
                  value={modalRows[0]?.nilai1 ?? ''}
                  onChange={(e) => updateModalRow(0, 'nilai1', e.target.value)}
                />
              </div>
            ) : (
              <div className="table-scroll" style={{ marginBottom: 16 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Bulan</th>
                      <th>{modalIndikator.labelInput1}</th>
                      <th>{modalIndikator.labelInput2}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((b) => (
                      <tr key={b}>
                        <td style={{ whiteSpace: 'nowrap' }}>{NAMA_BULAN[b - 1]}</td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            className="input-field"
                            style={{ width: 90 }}
                            value={modalRows[b]?.nilai1 ?? ''}
                            onChange={(e) => updateModalRow(b, 'nilai1', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            className="input-field"
                            style={{ width: 90 }}
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

            {modalError && <div className="error-text" style={{ marginBottom: 12 }}>{modalError}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" onClick={handleSaveModal} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setModalIndikator(null)} disabled={saving}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
