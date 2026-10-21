import { NextResponse } from 'next/server';
import { readFile, unlink, writeFile, mkdir, rename } from 'fs/promises';
import path from 'path';
const { db, UPLOAD_DIR } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');
const { slugify } = require('../../../../lib/slugify');
const { uploadToGoogleDrive, deleteFromGoogleDrive } = require('../../../../lib/gdrive');

function canModify(session) {
  if (!session) return false;
  return session.role !== 'staf_umum';
}

// ID dari URL harus berupa bilangan bulat valid -- kalau tidak, kembalikan 404 rapi
// alih-alih biarkan NaN masuk ke query database (bisa bikin 500 error mentah).
function parseValidId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function getStatusDanPeminjamanAktif(arsipId) {
  const aktif = db
    .prepare('SELECT * FROM Peminjaman WHERE arsipId = ? AND tanggalKembali IS NULL')
    .get(arsipId);
  return { status: aktif ? 'dipinjam' : 'ada', peminjamanAktif: aktif || null };
}

// GET /api/documents/:id?mode=view|download|meta
export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID arsip tidak valid.' }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const modeParam = searchParams.get('mode');
  const mode = modeParam === 'view' ? 'view' : modeParam === 'meta' ? 'meta' : 'download';

  const arsip = db
    .prepare(
      `SELECT Arsip.*, JenisPerkara.nama as jenisPerkaraNama
       FROM Arsip LEFT JOIN JenisPerkara ON Arsip.jenisPerkaraId = JenisPerkara.id
       WHERE Arsip.id = ?`
    )
    .get(id);
  if (!arsip) return NextResponse.json({ error: 'Arsip tidak ditemukan.' }, { status: 404 });

  if (mode === 'meta') {
    const { status, peminjamanAktif } = getStatusDanPeminjamanAktif(id);
    const riwayat = db
      .prepare(
        `SELECT Peminjaman.*, User.namaLengkap as dicatatOlehNama FROM Peminjaman
         JOIN User ON Peminjaman.dicatatOleh = User.id
         WHERE arsipId = ? ORDER BY createdAt DESC`
      )
      .all(id);
    return NextResponse.json({ data: { ...arsip, status, peminjamanAktif, riwayatPeminjaman: riwayat } });
  }

  const absPath = path.join(UPLOAD_DIR, arsip.filePath);
  try {
    const bytes = await readFile(absPath);
    db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
      mode === 'view' ? 'lihat' : 'download',
      `${session.namaLengkap} ${mode === 'view' ? 'melihat' : 'mengunduh'} arsip ${arsip.nomorPerkara}`,
      session.id
    );
    const disposition = mode === 'view' ? 'inline' : 'attachment';
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${arsip.fileName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'File fisik tidak ditemukan di server.' }, { status: 404 });
  }
}

// PATCH /api/documents/:id (multipart/form-data)
export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!canModify(session)) {
    return NextResponse.json({ error: 'Role Anda tidak punya akses untuk mengubah arsip.' }, { status: 403 });
  }

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID arsip tidak valid.' }, { status: 400 });

  const arsip = db.prepare('SELECT * FROM Arsip WHERE id = ?').get(id);
  if (!arsip) return NextResponse.json({ error: 'Arsip tidak ditemukan.' }, { status: 404 });

  const form = await request.formData();
  const nomorPerkara = (form.get('nomorPerkara') || '').toString().trim();
  const jenisPerkaraId = parseInt((form.get('jenisPerkaraId') || '').toString(), 10);
  const namaPihak = (form.get('namaPihak') || '').toString().trim();
  const tanggalBht = (form.get('tanggalBht') || '').toString().trim();
  const keterangan = (form.get('keterangan') || '').toString().trim();
  const nomorRuang = (form.get('nomorRuang') || '').toString().trim();
  const nomorRakLemari = (form.get('nomorRakLemari') || '').toString().trim();
  const nomorTingkatLaci = (form.get('nomorTingkatLaci') || '').toString().trim();
  const nomorBoks = (form.get('nomorBoks') || '').toString().trim();
  const file = form.get('file');

  if (!nomorPerkara || !jenisPerkaraId || !tanggalBht) {
    return NextResponse.json({ error: 'Nomor perkara, jenis perkara, dan tanggal BHT wajib diisi.' }, { status: 400 });
  }
  if (!nomorRuang || !nomorRakLemari || !nomorTingkatLaci || !nomorBoks) {
    return NextResponse.json({ error: 'Lokasi fisik (ruang, rak/lemari, tingkat/laci, boks) wajib diisi.' }, { status: 400 });
  }
  const jenis = db.prepare('SELECT * FROM JenisPerkara WHERE id = ?').get(jenisPerkaraId);
  if (!jenis) return NextResponse.json({ error: 'Jenis perkara tidak valid.' }, { status: 400 });

  const nomorSudahAda = db.prepare('SELECT id FROM Arsip WHERE nomorPerkara = ? AND id != ?').get(nomorPerkara, id);
  if (nomorSudahAda) {
    return NextResponse.json({ error: 'Nomor perkara ini sudah dipakai arsip lain.' }, { status: 400 });
  }

  const tanggal = new Date(tanggalBht);
  if (isNaN(tanggal.getTime())) {
    return NextResponse.json({ error: 'Tanggal BHT tidak valid.' }, { status: 400 });
  }
  const tahun = tanggal.getFullYear();

  let fileName = arsip.fileName;
  let filePath = arsip.filePath;
  let fileSize = arsip.fileSize;
  let gdriveFileId = arsip.gdriveFileId || null;
  let gdriveWebViewLink = arsip.gdriveWebViewLink || null;
  let fileDiganti = false;

  const adaFileBaru = file && typeof file !== 'string' && file.size > 0;

  if (adaFileBaru) {
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Hanya file PDF yang diperbolehkan.' }, { status: 400 });
    }
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Ukuran file maksimal 20MB.' }, { status: 400 });
    }

    // Tulis file baru DULU sebelum hapus file lama — supaya kalau gagal di tengah,
    // file lama tetap aman dan tidak ada kondisi kedua file hilang.
    const relDir = path.join(String(tahun), slugify(jenis.nama));
    const absDir = path.join(UPLOAD_DIR, relDir);
    await mkdir(absDir, { recursive: true });

    const uniqueName = `${slugify(nomorPerkara)}-${Date.now()}.pdf`;
    const newRelPath = path.join(relDir, uniqueName);
    const newAbsPath = path.join(UPLOAD_DIR, newRelPath);

    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(newAbsPath, bytes);

    const oldAbsPath = path.join(UPLOAD_DIR, arsip.filePath);
    try {
      await unlink(oldAbsPath);
    } catch {
      // file lama mungkin sudah tidak ada, abaikan
    }

    fileName = file.name;
    filePath = newRelPath;
    fileSize = bytes.length;
    fileDiganti = true;

    try {
      const gdriveResult = await uploadToGoogleDrive({
        fileName: `${nomorPerkara} - ${jenis.nama}.pdf`,
        buffer: bytes,
      });
      if (gdriveResult) {
        if (arsip.gdriveFileId) {
          await deleteFromGoogleDrive(arsip.gdriveFileId);
        }
        gdriveFileId = gdriveResult.fileId;
        gdriveWebViewLink = gdriveResult.webViewLink;
      }
    } catch (err) {
      console.error('[GDrive] Update documents error:', err?.message || err);
    }
  } else {
    // BUGFIX: kalau tidak upload file baru, tapi jenis perkara atau tahun berubah,
    // file fisik yang lama tetap berada di folder LAMA (mis. masih di folder "cerai-gugat"
    // padahal sekarang jenisnya "Cerai Talak"). Supaya struktur folder tetap sinkron
    // dengan data, pindahkan (rename) file fisik ke folder yang sesuai jenis/tahun baru.
    const relDirBaru = path.join(String(tahun), slugify(jenis.nama));
    const relDirLama = path.dirname(arsip.filePath);

    if (relDirBaru !== relDirLama) {
      const absDirBaru = path.join(UPLOAD_DIR, relDirBaru);
      await mkdir(absDirBaru, { recursive: true });

      const namaFileLama = path.basename(arsip.filePath);
      const relPathBaru = path.join(relDirBaru, namaFileLama);
      const absPathLama = path.join(UPLOAD_DIR, arsip.filePath);
      const absPathBaru = path.join(UPLOAD_DIR, relPathBaru);

      try {
        await rename(absPathLama, absPathBaru);
        filePath = relPathBaru;
      } catch {
        // Kalau file fisik lama sudah tidak ada / gagal dipindah, biarkan filePath
        // seperti semula -- jangan sampai update DB menunjuk ke path yang belum tentu ada.
      }
    }
  }

  db.prepare(
    `UPDATE Arsip SET nomorPerkara = ?, jenisPerkaraId = ?, jenisPerkara = ?, namaPihak = ?, tanggalBht = ?, tahun = ?, keterangan = ?,
     nomorRuang = ?, nomorRakLemari = ?, nomorTingkatLaci = ?, nomorBoks = ?, fileName = ?, filePath = ?, fileSize = ?, gdriveFileId = ?, gdriveWebViewLink = ?
     WHERE id = ?`
  ).run(nomorPerkara, jenis.id, jenis.nama, namaPihak || null, tanggalBht, tahun, keterangan || null, nomorRuang, nomorRakLemari, nomorTingkatLaci, nomorBoks, fileName, filePath, fileSize, gdriveFileId, gdriveWebViewLink, id);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    fileDiganti ? 'ganti_file_arsip' : 'ubah_arsip',
    fileDiganti
      ? `${session.namaLengkap} mengganti file dokumen arsip ${nomorPerkara}`
      : `${session.namaLengkap} mengubah data arsip ${nomorPerkara}`,
    session.id
  );

  return NextResponse.json({ ok: true });
}

// DELETE /api/documents/:id
export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!canModify(session)) {
    return NextResponse.json({ error: 'Role Anda tidak punya akses untuk menghapus arsip.' }, { status: 403 });
  }

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID arsip tidak valid.' }, { status: 400 });

  const arsip = db.prepare('SELECT * FROM Arsip WHERE id = ?').get(id);
  if (!arsip) return NextResponse.json({ error: 'Arsip tidak ditemukan.' }, { status: 404 });

  const { status } = getStatusDanPeminjamanAktif(id);
  if (status === 'dipinjam') {
    return NextResponse.json({ error: 'Arsip ini sedang dipinjam dan tidak bisa dihapus. Tandai dikembalikan terlebih dahulu.' }, { status: 400 });
  }

  const absPath = path.join(UPLOAD_DIR, arsip.filePath);
  try {
    await unlink(absPath);
  } catch {
    // file fisik mungkin sudah tidak ada; tetap lanjut hapus record
  }

  if (arsip.gdriveFileId) {
    try {
      await deleteFromGoogleDrive(arsip.gdriveFileId);
    } catch (err) {
      console.error('[GDrive] Delete error:', err?.message || err);
    }
  }

  db.prepare('DELETE FROM Peminjaman WHERE arsipId = ?').run(id);
  db.prepare('DELETE FROM Arsip WHERE id = ?').run(id);
  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'hapus',
    `${session.namaLengkap} menghapus arsip ${arsip.nomorPerkara}`,
    session.id
  );

  return NextResponse.json({ ok: true });
}
