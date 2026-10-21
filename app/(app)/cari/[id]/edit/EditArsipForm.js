'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function formatUkuran(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EditArsipForm({ id }) {
  const router = useRouter();
  const [jenisOptions, setJenisOptions] = useState([]);
  const [nomorPerkara, setNomorPerkara] = useState('');
  const [jenisPerkaraId, setJenisPerkaraId] = useState('');
  const [namaPihak, setNamaPihak] = useState('');
  const [tanggalBht, setTanggalBht] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [nomorRuang, setNomorRuang] = useState('');
  const [nomorRakLemari, setNomorRakLemari] = useState('');
  const [nomorTingkatLaci, setNomorTingkatLaci] = useState('');
  const [nomorBoks, setNomorBoks] = useState('');
  const [file, setFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null); // { fileName, fileSize }
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/jenis-perkara').then((r) => r.json()),
      fetch(`/api/documents/${id}?mode=meta`).then((r) => r.json()),
    ]).then(([jenisData, arsipData]) => {
      setJenisOptions(jenisData.data || []);
      const a = arsipData.data;
      if (a) {
        setNomorPerkara(a.nomorPerkara);
        setJenisPerkaraId(String(a.jenisPerkaraId || ''));
        setNamaPihak(a.namaPihak || '');
        setTanggalBht(a.tanggalBht?.slice(0, 10) || '');
        setKeterangan(a.keterangan || '');
        setNomorRuang(a.nomorRuang || '');
        setNomorRakLemari(a.nomorRakLemari || '');
        setNomorTingkatLaci(a.nomorTingkatLaci || '');
        setNomorBoks(a.nomorBoks || '');
        setFileInfo({ fileName: a.fileName, fileSize: a.fileSize });
      }
      setLoadingData(false);
    });
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (file && file.type !== 'application/pdf') {
      setError('File pengganti harus berformat PDF.');
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('nomorPerkara', nomorPerkara);
    formData.append('jenisPerkaraId', jenisPerkaraId);
    formData.append('namaPihak', namaPihak);
    formData.append('tanggalBht', tanggalBht);
    formData.append('keterangan', keterangan);
    formData.append('nomorRuang', nomorRuang);
    formData.append('nomorRakLemari', nomorRakLemari);
    formData.append('nomorTingkatLaci', nomorTingkatLaci);
    formData.append('nomorBoks', nomorBoks);
    if (file) formData.append('file', file);

    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'PATCH', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal menyimpan perubahan.');
        setSaving(false);
        return;
      }
      setSuccess('Arsip berhasil diperbarui.');
      setTimeout(() => router.push('/cari'), 900);
    } catch {
      setError('Terjadi kesalahan jaringan.');
      setSaving(false);
    }
  }

  if (loadingData) {
    return (
      <div>
        <div className="topbar"><div style={{ fontWeight: 700 }}>EDIT ARSIP</div></div>
        <div className="page-body">Memuat data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="topbar">
        <div style={{ fontWeight: 700, letterSpacing: 0.3 }}>EDIT ARSIP</div>
      </div>
      <div className="page-body">
        <div className="card" style={{ maxWidth: 560 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Nomor Perkara *
              </label>
              <input
                className="input-field"
                value={nomorPerkara}
                onChange={(e) => setNomorPerkara(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Jenis Perkara *
              </label>
              <select
                className="input-field"
                value={jenisPerkaraId}
                onChange={(e) => setJenisPerkaraId(e.target.value)}
              >
                {jenisOptions.map((j) => (
                  <option key={j.id} value={j.id}>{j.nama}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Nama Pihak
              </label>
              <input
                className="input-field"
                value={namaPihak}
                onChange={(e) => setNamaPihak(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Tanggal BHT *
              </label>
              <input
                type="date"
                className="input-field"
                value={tanggalBht}
                onChange={(e) => setTanggalBht(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Keterangan
              </label>
              <textarea
                className="input-field"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                rows={3}
              />
            </div>

            <div style={{ marginBottom: 14, padding: 14, background: '#f7f9f8', borderRadius: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                📍 Lokasi Fisik Berkas *
              </div>
              <div className="form-grid-2">
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nomor Ruang</label>
                  <input className="input-field" value={nomorRuang} onChange={(e) => setNomorRuang(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nomor Rak/Lemari</label>
                  <input className="input-field" value={nomorRakLemari} onChange={(e) => setNomorRakLemari(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nomor Tingkat/Laci</label>
                  <input className="input-field" value={nomorTingkatLaci} onChange={(e) => setNomorTingkatLaci(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nomor Boks</label>
                  <input className="input-field" value={nomorBoks} onChange={(e) => setNomorBoks(e.target.value)} required />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 14, padding: 14, background: '#f7f9f8', borderRadius: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                File Dokumen
              </label>
              {fileInfo && (
                <div style={{ fontSize: 13, marginBottom: 10 }}>
                  <a href={`/api/documents/${id}?mode=view`} target="_blank" rel="noreferrer" style={{ color: 'var(--hijau-tua)', fontWeight: 600 }}>
                    👁️ Lihat file saat ini
                  </a>
                  <span style={{ color: '#889', marginLeft: 8 }}>
                    ({fileInfo.fileName}, {formatUkuran(fileInfo.fileSize)})
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div style={{ fontSize: 12, color: '#889', marginTop: 6 }}>
                Kosongkan kalau tidak ingin mengganti file. Kalau diisi, file lama akan digantikan yang baru.
              </div>
            </div>

            {error && <div className="error-text" style={{ marginBottom: 10 }}>{error}</div>}
            {success && (
              <div style={{ color: '#146c4f', fontSize: 13, marginBottom: 10, fontWeight: 600 }}>
                ✅ {success}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => router.push('/cari')}>
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
