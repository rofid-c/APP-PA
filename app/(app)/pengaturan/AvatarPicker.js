'use client';
import { useState, useRef } from 'react';
import Avatar from '../../components/Avatar';
import { AVATAR_ICONS, AVATAR_COLORS } from '../../lib/avatarOptions';

export default function AvatarPicker({ user, onUpdated }) {
  const [mode, setMode] = useState('icon'); // 'icon' | 'upload'
  const [icon, setIcon] = useState(user.avatarIcon || AVATAR_ICONS[0]);
  const [color, setColor] = useState(user.avatarColor || AVATAR_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadInfo, setUploadInfo] = useState('');
  const fileInputRef = useRef(null);

  const previewUser = { ...user, avatarType: 'icon', avatarIcon: icon, avatarColor: color };

  function randomize() {
    const newIcon = AVATAR_ICONS[Math.floor(Math.random() * AVATAR_ICONS.length)];
    const newColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    setIcon(newIcon);
    setColor(newColor);
  }

  async function handleSaveIconAvatar() {
    setSaving(true);
    setError('');
    const res = await fetch('/api/profile/avatar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ icon, color }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Gagal menyimpan avatar.');
      return;
    }
    if (onUpdated) onUpdated();
  }

  async function handleUploadPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploadInfo('');
    setSaving(true);

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/profile/avatar-photo', { method: 'POST', body: formData });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Gagal mengunggah foto.');
      return;
    }
    setUploadInfo(`Foto berhasil diunggah dan dikompres menjadi ~${data.sizeKb} KB.`);
    if (onUpdated) onUpdated();
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="stitch-card" style={{ maxWidth: 520, marginBottom: 28 }}>
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
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>photo_camera</span>
          </div>
          <div>
            <h2 className="stitch-card-title">Foto Profil & Avatar</h2>
            <p className="stitch-card-subtitle">Pilih ikon visual atau unggah foto resmi kedinasan</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 12, background: '#f4f6f5', borderRadius: 10 }}>
        <Avatar user={mode === 'icon' ? previewUser : user} size={64} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={mode === 'icon' ? 'btn-primary' : 'btn-secondary'}
            style={{
              fontSize: 12,
              padding: '7px 14px',
              borderRadius: 8,
              background: mode === 'icon' ? 'var(--hijau-tua)' : '#ffffff',
            }}
            onClick={() => setMode('icon')}
          >
            Ikon Avatar
          </button>
          <button
            className={mode === 'upload' ? 'btn-primary' : 'btn-secondary'}
            style={{
              fontSize: 12,
              padding: '7px 14px',
              borderRadius: 8,
              background: mode === 'upload' ? 'var(--hijau-tua)' : '#ffffff',
            }}
            onClick={() => setMode('upload')}
          >
            Unggah Foto
          </button>
        </div>
      </div>

      {mode === 'icon' && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--teks-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
            Pilih Ikon Karakter
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {AVATAR_ICONS.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  fontSize: 18,
                  border: icon === ic ? '2px solid var(--hijau-terang)' : '1px solid var(--border)',
                  background: icon === ic ? '#eaf7ed' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {ic}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--teks-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
            Pilih Warna Latar Belakang
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: c,
                  cursor: 'pointer',
                  border: color === c ? '3px solid var(--hijau-tua)' : '1px solid var(--border)',
                  boxShadow: color === c ? '0 0 0 2px #ffffff' : 'none',
                }}
              />
            ))}
          </div>

          {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-primary"
              onClick={handleSaveIconAvatar}
              disabled={saving}
              style={{
                background: 'var(--hijau-terang)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                fontSize: 13,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
              <span>{saving ? 'Menyimpan...' : 'Simpan Avatar'}</span>
            </button>
            <button
              className="btn-secondary"
              onClick={randomize}
              type="button"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            >
              <span>🎲</span>
              <span>Acak</span>
            </button>
          </div>
        </div>
      )}

      {mode === 'upload' && (
        <div style={{ padding: 16, background: '#f4f6f5', borderRadius: 10, border: '1px dashed #dce8e1' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUploadPhoto}
            disabled={saving}
            style={{ fontSize: 13 }}
          />
          <div style={{ fontSize: 12, color: 'var(--teks-muted)', marginTop: 8, lineHeight: 1.5 }}>
            Format didukung: JPG, PNG, atau WebP (maksimal 10MB). Foto akan dipotong dan dioptimasi secara otomatis.
          </div>
          {saving && <div style={{ fontSize: 13, color: 'var(--hijau)', marginTop: 10 }}>Mengunggah & memproses foto...</div>}
          {error && <div className="error-text" style={{ marginTop: 10 }}>{error}</div>}
          {uploadInfo && (
            <div
              style={{
                color: '#135c36',
                background: '#eafaf1',
                border: '1px solid #a3e6be',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 13,
                marginTop: 10,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
              <span>{uploadInfo}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
