'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadForm() {
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/jenis-perkara')
      .then((r) => r.json())
      .then((data) => {
        setJenisOptions(data.data || []);
        if (data.data && data.data.length > 0) setJenisPerkaraId(String(data.data[0].id));
      });
  }, []);

  function resetForm() {
    setNomorPerkara('');
    setNamaPihak('');
    setTanggalBht('');
    setKeterangan('');
    setNomorRuang('');
    setNomorRakLemari('');
    setNomorTingkatLaci('');
    setNomorBoks('');
    setFile(null);
    const el = document.getElementById('file-input');
    if (el) el.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      setError('Pilih file PDF terlebih dahulu.');
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('File harus berformat PDF.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('nomorPerkara', nomorPerkara);
    formData.append('jenisPerkaraId', jenisPerkaraId);
    formData.append('namaPihak', namaPihak);
    formData.append('tanggalBht', tanggalBht);
    formData.append('keterangan', keterangan);
    formData.append('nomorRuang', nomorRuang);
    formData.append('nomorRakLemari', nomorRakLemari);
    formData.append('nomorTingkatLaci', nomorTingkatLaci);
    formData.append('nomorBoks', nomorBoks);

    try {
      const res = await fetch('/api/documents', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        // Form TIDAK di-reset kalau gagal (misal nomor perkara duplikat) -- user tinggal
        // perbaiki kolom yang salah tanpa perlu isi ulang semuanya dari awal.
        setError(data.error || 'Gagal mengunggah arsip.');
        setLoading(false);
        return;
      }
      setSuccess('Arsip berhasil diunggah.');
      resetForm();
    } catch {
      setError('Terjadi kesalahan jaringan.');
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="topbar">
        <div style={{ fontWeight: 700, letterSpacing: 0.3 }}>UPLOAD ARSIP PERKARA</div>
        <button className="btn-secondary" onClick={() => router.push('/cari')}>← Kembali ke Daftar</button>
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
                placeholder="Contoh: 123/Pdt.G/2024/PA.GS"
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
                placeholder="Contoh: Siti & Budi"
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

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                File PDF *
              </label>
              <input
                id="file-input"
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
              <div style={{ fontSize: 12, color: '#889', marginTop: 4 }}>
                Format PDF, maksimal 20MB.
              </div>
            </div>

            {error && <div className="error-text" style={{ marginBottom: 10 }}>{error}</div>}
            {success && (
              <div style={{ color: '#146c4f', fontSize: 13, marginBottom: 10, fontWeight: 600 }}>
                ✅ {success}
              </div>
            )}

            <button className="btn-primary" disabled={loading}>
              {loading ? 'Mengunggah...' : '📎 Upload Arsip'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
