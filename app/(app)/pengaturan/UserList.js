'use client';
import { useEffect, useState } from 'react';
import { formatTanggalWaktu } from '../../lib/formatDate';

// User.createdAt disimpan UTC (bukan tanggal murni) -- pakai formatter yang timezone-aware,
// ambil bagian tanggalnya saja.
function formatTanggal(iso) {
  return formatTanggalWaktu(iso).split(' ').slice(0, -1).join(' ');
}

const emptyForm = { username: '', password: '', namaLengkap: '', role: 'petugas' };

export default function UserList({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  function load() {
    setLoading(true);
    fetch('/api/users?status=aktif')
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.data || []);
        setLoading(false);
      });
  }

  useEffect(load, []);

  function openAddForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowForm(true);
  }

  function openEditForm(user) {
    setForm({ username: user.username, password: '', namaLengkap: user.namaLengkap, role: user.role });
    setEditingId(user.id);
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const isEdit = editingId !== null;
    const url = isEdit ? `/api/users/${editingId}` : '/api/users';
    const method = isEdit ? 'PATCH' : 'POST';

    const body = isEdit
      ? { username: form.username, namaLengkap: form.namaLengkap, role: form.role, ...(form.password ? { password: form.password } : {}) }
      : form;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Gagal menyimpan akun.');
      return;
    }
    setShowForm(false);
    load();
  }

  async function handleDelete(id) {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Gagal menghapus akun.');
      setConfirmDeleteId(null);
      return;
    }
    setConfirmDeleteId(null);
    load();
  }

  return (
    <div className="stitch-card" style={{ marginBottom: 28 }}>
      {/* Header Pengguna */}
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
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>manage_accounts</span>
          </div>
          <div>
            <h2 className="stitch-card-title">Daftar Pengguna Aktif</h2>
            <p className="stitch-card-subtitle">
              Kelola aparatur terdaftar, hak akses kewenangan, dan reset password
            </p>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={openAddForm}
          style={{
            background: 'var(--hijau-terang)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 18px',
            fontSize: 13,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
          <span>+ Tambah Akun</span>
        </button>
      </div>

      {showForm && (
        <div
          style={{
            background: '#f4f6f5',
            border: '1px solid #e2e6e4',
            borderRadius: 10,
            padding: '18px 20px',
            maxWidth: 520,
            marginBottom: 20,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--hijau-tua)', marginBottom: 14 }}>
            {editingId ? 'Edit Data Pengguna' : 'Tambah Akun Pengguna Baru'}
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4, color: 'var(--teks-muted)' }}>
                Nama Lengkap & Gelar *
              </label>
              <input
                className="input-field"
                value={form.namaLengkap}
                onChange={(e) => setForm({ ...form, namaLengkap: e.target.value })}
                style={{ background: '#ffffff', border: '1px solid #e2e6e4', borderRadius: 8 }}
                required
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4, color: 'var(--teks-muted)' }}>
                NIP / Username *
              </label>
              <input
                className="input-field"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                style={{ background: '#ffffff', border: '1px solid #e2e6e4', borderRadius: 8 }}
                required
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4, color: 'var(--teks-muted)' }}>
                Password {editingId ? '(kosongkan jika tidak diubah)' : '*'}
              </label>
              <input
                type="password"
                className="input-field"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingId ? 'Kosongkan jika tidak ganti password' : 'Minimal 6 karakter'}
                style={{ background: '#ffffff', border: '1px solid #e2e6e4', borderRadius: 8 }}
                required={!editingId}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4, color: 'var(--teks-muted)' }}>
                Hak Akses (Role) *
              </label>
              <select
                className="dashboard-select"
                style={{ width: '100%', padding: '8px 32px 8px 12px' }}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="petugas">Petugas Arsip (Input, Edit, Upload Berkas)</option>
                <option value="staf_umum">Peninjau / Staf (Akses Baca & Unduh Saja)</option>
                <option value="admin">Administrator (Akses Penuh Seluruh Sistem)</option>
              </select>
            </div>

            {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-primary"
                type="submit"
                style={{
                  background: 'var(--hijau-terang)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  fontSize: 13,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>
                <span>{editingId ? 'Simpan Perubahan' : 'Buat Akun'}</span>
              </button>
              <button className="btn-secondary" type="button" onClick={() => setShowForm(false)}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabel Pengguna */}
      <div className="table-scroll" style={{ borderRadius: 8, border: '1px solid var(--border)' }}>
        <table className="stitch-table">
          <thead>
            <tr>
              <th>Aparatur / Pengguna</th>
              <th>Username</th>
              <th>Hak Akses (Role)</th>
              <th>Terdaftar Sejak</th>
              <th style={{ width: 120, textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const roleBadge =
                u.role === 'admin'
                  ? { bg: '#fff3e0', text: '#b5680a', label: 'Administrator' }
                  : u.role === 'staf_umum'
                  ? { bg: '#f3e8ff', text: '#7c3aed', label: 'Peninjau / Staf' }
                  : { bg: '#e6f7ee', text: '#136b4e', label: 'Petugas Arsip' };

              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: 'var(--hijau-container)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        {u.namaLengkap ? u.namaLengkap.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--teks)' }}>
                          {u.namaLengkap} {u.id === currentUserId && <span style={{ color: 'var(--hijau-terang)', fontSize: 11 }}>(Anda)</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code style={{ background: '#f4f6f5', padding: '2px 6px', borderRadius: 4, fontSize: 12, border: '1px solid #e2e6e4' }}>
                      {u.username}
                    </code>
                  </td>
                  <td>
                    <span
                      style={{
                        background: roleBadge.bg,
                        color: roleBadge.text,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 999,
                      }}
                    >
                      {roleBadge.label}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: 'var(--teks-muted)' }}>
                      {formatTanggal(u.createdAt)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <button
                        className="pill-icon-btn primary"
                        title="Edit Akun"
                        onClick={() => openEditForm(u)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </button>
                      {u.id !== currentUserId && (
                        confirmDeleteId === u.id ? (
                          <div style={{ display: 'inline-flex', gap: 4 }}>
                            <button
                              className="btn-danger"
                              style={{ padding: '3px 8px', fontSize: 11 }}
                              onClick={() => handleDelete(u.id)}
                            >
                              Yakin?
                            </button>
                            <button
                              className="btn-secondary"
                              style={{ padding: '3px 8px', fontSize: 11 }}
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            className="pill-icon-btn danger"
                            title="Hapus Akun"
                            onClick={() => setConfirmDeleteId(u.id)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: '#889', textAlign: 'center', padding: 24 }}>
                  Belum ada akun.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
