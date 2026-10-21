'use client';
import { useEffect, useState } from 'react';
import SortableTableBody, { SortableRow } from '../../components/SortableTable';
import { getBadgeStyle } from '../../lib/badgeColors';

// apiBase misal '/api/jenis-perkara' -> list/create di situ, item di `${apiBase}/${id}`, reorder di `${apiBase}/reorder`
export default function KelolaLookupList({ title, apiBase, itemLabel, showBadge = false, addPlaceholder }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [namaBaru, setNamaBaru] = useState('');
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [editNama, setEditNama] = useState('');
  const [hapusTarget, setHapusTarget] = useState(null);
  const [penggantiId, setPenggantiId] = useState('');

  function load() {
    setLoading(true);
    fetch(apiBase)
      .then((r) => r.json())
      .then((data) => {
        setList(data.data || []);
        setLoading(false);
      });
  }

  useEffect(load, [apiBase]);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    const res = await fetch(apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: namaBaru }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Gagal menambahkan.');
      return;
    }
    setNamaBaru('');
    load();
  }

  async function handleRename(id) {
    const res = await fetch(`${apiBase}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: editNama }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Gagal mengubah nama.');
      return;
    }
    setEditId(null);
    load();
  }

  function startDelete(item) {
    setHapusTarget(item);
    setPenggantiId('');
    setError('');
  }

  async function confirmDelete() {
    const url = penggantiId ? `${apiBase}/${hapusTarget.id}?penggantiId=${penggantiId}` : `${apiBase}/${hapusTarget.id}`;
    const res = await fetch(url, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      if (data.butuhPengganti) {
        setError(data.error);
        return;
      }
      alert(data.error || 'Gagal menghapus.');
      return;
    }
    setHapusTarget(null);
    load();
  }

  async function handleReorder(orderedIds) {
    // Optimistic update -- langsung update tampilan, baru simpan ke server di belakang
    const reordered = orderedIds.map((id, i) => ({ ...list.find((l) => l.id === id), urutan: i }));
    setList(reordered);
    await fetch(`${apiBase}/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    });
  }

  return (
    <div className="stitch-card" style={{ marginBottom: 28 }}>
      {/* Header Klasifikasi */}
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
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>folder_managed</span>
          </div>
          <div>
            <h2 className="stitch-card-title">{title}</h2>
            <p className="stitch-card-subtitle">Kelola urutan dan nama {itemLabel} untuk arsip digital</p>
          </div>
        </div>
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
          Total: {list.length} Kategori Aktif
        </span>
      </div>

      {/* Baris Input Cepat */}
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
            drive_file_rename_outline
          </span>
          <input
            className="input-field"
            placeholder={addPlaceholder || `Nama ${itemLabel} baru...`}
            value={namaBaru}
            onChange={(e) => setNamaBaru(e.target.value)}
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
          <span>Tambah</span>
        </button>
      </form>

      {error && !hapusTarget && (
        <div className="error-text" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Tabel Klasifikasi Data Master */}
      <div className="table-scroll" style={{ borderRadius: 8, border: '1px solid var(--border)' }}>
        <table className="stitch-table">
          <thead>
            <tr>
              <th style={{ width: 44, textAlign: 'center' }}>Urut</th>
              <th>Nama {itemLabel}</th>
              <th style={{ width: 140, textAlign: 'right' }}>Volume Berkas</th>
              <th style={{ width: 120, textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <SortableTableBody items={list} onReorder={handleReorder}>
            {list.map((item) => {
              const badge = showBadge ? getBadgeStyle(item.urutan) : null;
              return (
                <SortableRow key={item.id} id={item.id}>
                  <td>
                    {editId === item.id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          className="input-field"
                          style={{ padding: '6px 8px', fontSize: 13 }}
                          value={editNama}
                          onChange={(e) => setEditNama(e.target.value)}
                          autoFocus
                        />
                        <button
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                          onClick={() => handleRename(item.id)}
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
                    ) : showBadge ? (
                      <span className="badge" style={{ background: badge.bg, color: badge.text, fontWeight: 700 }}>
                        {item.nama}
                      </span>
                    ) : (
                      <span style={{ fontWeight: 600, color: 'var(--teks)' }}>{item.nama}</span>
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
                      {item.jumlahArsip || 0} Berkas
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {editId !== item.id && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <button
                          className="pill-icon-btn primary"
                          title="Ubah Nama"
                          onClick={() => {
                            setEditId(item.id);
                            setEditNama(item.nama);
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        <button
                          className="pill-icon-btn danger"
                          title="Hapus"
                          onClick={() => startDelete(item)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </div>
                    )}
                  </td>
                </SortableRow>
              );
            })}
          </SortableTableBody>
        </table>
        {!loading && list.length === 0 && (
          <div style={{ color: '#889', textAlign: 'center', padding: 24 }}>Belum ada {itemLabel}.</div>
        )}
      </div>

      {hapusTarget && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: 10,
          }}
        >
          <div style={{ fontWeight: 700, color: '#9a5b1e', marginBottom: 8 }}>
            Hapus {itemLabel} "{hapusTarget.nama}"?
          </div>
          {hapusTarget.jumlahArsip > 0 && (
            <>
              <div style={{ fontSize: 13, color: '#9a5b1e', marginBottom: 10 }}>
                Dipakai oleh {hapusTarget.jumlahArsip} berkas arsip. Pilih {itemLabel} pengganti untuk memindahkan berkas-berkas ini sebelum dihapus.
              </div>
              <select
                className="input-field"
                style={{ marginBottom: 10 }}
                value={penggantiId}
                onChange={(e) => setPenggantiId(e.target.value)}
              >
                <option value="">— Pilih pengganti —</option>
                {list.filter((j) => j.id !== hapusTarget.id).map((j) => (
                  <option key={j.id} value={j.id}>{j.nama}</option>
                ))}
              </select>
            </>
          )}
          {error && <div className="error-text" style={{ marginBottom: 10 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-danger"
              disabled={hapusTarget.jumlahArsip > 0 && !penggantiId}
              onClick={confirmDelete}
            >
              {hapusTarget.jumlahArsip > 0 ? 'Pindahkan & Hapus' : 'Hapus'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setHapusTarget(null);
                setError('');
              }}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
