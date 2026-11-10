import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
const { db, UPLOAD_DIR } = require('../../../../../lib/db');
const { getSession } = require('../../../../../lib/session');
const { slugify } = require('../../../../../lib/slugify');

function parseValidId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const MAX_PDF_SIZE = 30 * 1024 * 1024; // 30MB

// POST /api/rapat/:id/upload-berkas
// Form data: files (bisa 1 atau banyak), kategori ('undangan' | 'notulen'), keterangan (opsional)
export async function POST(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role === 'staf_umum') {
    return NextResponse.json({ error: 'Role Anda tidak memiliki izin upload berkas.' }, { status: 403 });
  }

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID rapat tidak valid.' }, { status: 400 });

  const rapat = db.prepare('SELECT id, judul FROM Rapat WHERE id = ?').get(id);
  if (!rapat) return NextResponse.json({ error: 'Data rapat tidak ditemukan.' }, { status: 404 });

  try {
    const form = await request.formData();
    const rawFiles = form.getAll('files').concat(form.getAll('file')).filter((f) => f && typeof f !== 'string' && f.size > 0);
    const kategori = (form.get('kategori') || 'notulen').toString().toLowerCase() === 'undangan' ? 'undangan' : 'notulen';
    const keterangan = (form.get('keterangan') || '').toString().trim();

    if (rawFiles.length === 0) {
      return NextResponse.json({ error: 'Pilih minimal satu berkas PDF.' }, { status: 400 });
    }

    const relDir = path.join('rapat', 'berkas', String(id));
    const absDir = path.join(UPLOAD_DIR, relDir);
    await mkdir(absDir, { recursive: true });

    const inserted = [];
    const insertStmt = db.prepare(
      `INSERT INTO BerkasRapat (rapatId, kategori, fileName, filePath, fileSize, keterangan)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    let lastPath = null;
    let lastName = null;
    let lastSize = 0;

    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];

      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        continue; // Hanya format PDF
      }

      if (file.size > MAX_PDF_SIZE) {
        continue; // Maks 30MB
      }

      const cleanBase = slugify(path.basename(file.name, '.pdf')) || 'dokumen';
      const uniqueName = `${kategori}-${id}-${Date.now()}-${i}-${cleanBase}.pdf`;
      const relPath = path.join(relDir, uniqueName);
      const absPath = path.join(UPLOAD_DIR, relPath);

      const bytes = Buffer.from(await file.arrayBuffer());
      await writeFile(absPath, bytes);

      const result = insertStmt.run(id, kategori, file.name, relPath, bytes.length, keterangan || null);
      inserted.push({
        id: result.lastInsertRowid,
        rapatId: id,
        kategori,
        fileName: file.name,
        filePath: relPath,
        fileSize: bytes.length,
        keterangan: keterangan || null,
      });

      lastPath = relPath;
      lastName = file.name;
      lastSize = bytes.length;
    }

    if (inserted.length === 0) {
      return NextResponse.json({ error: 'Tidak ada berkas PDF yang valid (maks. 30MB per berkas).' }, { status: 400 });
    }

    // Perbarui juga pointer di Rapat untuk kompatibilitas
    if (kategori === 'undangan' && lastPath) {
      db.prepare(`UPDATE Rapat SET fileUndanganPath = ?, fileUndanganName = ?, fileUndanganSize = ? WHERE id = ?`)
        .run(lastPath, lastName, lastSize, id);
    } else if (kategori === 'notulen' && lastPath) {
      db.prepare(`UPDATE Rapat SET fileRangkumanPath = ?, fileRangkumanName = ?, fileRangkumanSize = ? WHERE id = ?`)
        .run(lastPath, lastName, lastSize, id);
    }

    db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
      'upload_berkas_rapat',
      `${session.namaLengkap} mengunggah ${inserted.length} berkas ${kategori} untuk rapat "${rapat.judul}"`,
      session.id
    );

    return NextResponse.json({
      ok: true,
      data: inserted,
      totalInserted: inserted.length,
    });
  } catch (err) {
    console.error('Error uploading berkas rapat:', err);
    return NextResponse.json({ error: 'Gagal memproses unggahan berkas PDF.' }, { status: 500 });
  }
}

