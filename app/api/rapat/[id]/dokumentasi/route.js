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

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB per foto

// GET /api/rapat/:id/dokumentasi
export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID rapat tidak valid.' }, { status: 400 });

  const list = db
    .prepare('SELECT * FROM DokumentasiRapat WHERE rapatId = ? ORDER BY id ASC')
    .all(id);

  return NextResponse.json({ data: list });
}

// POST /api/rapat/:id/dokumentasi (upload 1 atau beberapa foto dokumentasi)
export async function POST(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role === 'staf_umum') {
    return NextResponse.json({ error: 'Role Anda tidak memiliki izin upload foto dokumentasi.' }, { status: 403 });
  }

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID rapat tidak valid.' }, { status: 400 });

  const rapat = db.prepare('SELECT id, judul FROM Rapat WHERE id = ?').get(id);
  if (!rapat) return NextResponse.json({ error: 'Data rapat tidak ditemukan.' }, { status: 404 });

  try {
    const form = await request.formData();
    // Bisa 'files' (banyak) atau 'file' (tunggal)
    const rawFiles = form.getAll('files').concat(form.getAll('file')).filter((f) => f && typeof f !== 'string' && f.size > 0);
    const caption = (form.get('caption') || '').toString().trim();

    if (rawFiles.length === 0) {
      return NextResponse.json({ error: 'Pilih minimal satu berkas foto dokumentasi.' }, { status: 400 });
    }

    const relDir = path.join('rapat', 'dokumentasi', String(id));
    const absDir = path.join(UPLOAD_DIR, relDir);
    await mkdir(absDir, { recursive: true });

    const inserted = [];
    const insertStmt = db.prepare(
      `INSERT INTO DokumentasiRapat (rapatId, fileName, filePath, fileSize, caption)
       VALUES (?, ?, ?, ?, ?)`
    );

    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];

      if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
        continue; // Lewati berkas yang bukan gambar
      }

      if (file.size > MAX_IMAGE_SIZE) {
        continue; // Lewati gambar yang melebihi batas 15MB
      }

      const ext = path.extname(file.name) || '.jpg';
      const cleanBase = slugify(path.basename(file.name, ext)) || 'foto';
      const uniqueName = `dok-${Date.now()}-${i}-${cleanBase}${ext}`;
      const relPath = path.join(relDir, uniqueName);
      const absPath = path.join(UPLOAD_DIR, relPath);

      const bytes = Buffer.from(await file.arrayBuffer());
      await writeFile(absPath, bytes);

      const result = insertStmt.run(id, file.name, relPath, bytes.length, caption || null);
      inserted.push({
        id: result.lastInsertRowid,
        rapatId: id,
        fileName: file.name,
        filePath: relPath,
        fileSize: bytes.length,
        caption: caption || null,
      });
    }

    if (inserted.length === 0) {
      return NextResponse.json({ error: 'Tidak ada foto yang valid (format JPG/PNG/WEBP maks 15MB).' }, { status: 400 });
    }

    db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
      'upload_dokumentasi_rapat',
      `${session.namaLengkap} mengunggah ${inserted.length} foto dokumentasi untuk rapat "${rapat.judul}"`,
      session.id
    );

    return NextResponse.json({
      ok: true,
      data: inserted,
      totalInserted: inserted.length,
    });
  } catch (err) {
    console.error('Error uploading dokumentasi rapat:', err);
    return NextResponse.json({ error: 'Gagal memproses unggahan foto dokumentasi.' }, { status: 500 });
  }
}

