import { NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
const { db, UPLOAD_DIR } = require('../../../../../lib/db');
const { getSession } = require('../../../../../lib/session');
const { slugify } = require('../../../../../lib/slugify');

function parseValidId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// POST /api/rapat/:id/upload-rangkuman (multipart/form-data: file)
export async function POST(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role === 'staf_umum') {
    return NextResponse.json({ error: 'Role Anda tidak memiliki izin upload rangkuman.' }, { status: 403 });
  }

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID rapat tidak valid.' }, { status: 400 });

  const rapat = db.prepare('SELECT * FROM Rapat WHERE id = ?').get(id);
  if (!rapat) return NextResponse.json({ error: 'Data rapat tidak ditemukan.' }, { status: 404 });

  try {
    const form = await request.formData();
    const file = form.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Berkas PDF rangkuman wajib dipilih.' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Hanya berkas format PDF yang diperbolehkan.' }, { status: 400 });
    }

    const MAX_SIZE = 30 * 1024 * 1024; // 30MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Ukuran berkas PDF maksimal 30MB.' }, { status: 400 });
    }

    // Hapus file lama jika ada
    if (rapat.fileRangkumanPath) {
      const oldPath = path.join(UPLOAD_DIR, rapat.fileRangkumanPath);
      try {
        await unlink(oldPath);
      } catch (e) {
        console.warn('Gagal menghapus file lama rangkuman:', e.message);
      }
    }

    const relDir = 'rapat';
    const absDir = path.join(UPLOAD_DIR, relDir);
    await mkdir(absDir, { recursive: true });

    const safeTitle = slugify(rapat.judul || 'notulen-rapat');
    const uniqueName = `rangkuman-${id}-${safeTitle}-${Date.now()}.pdf`;
    const relPath = path.join(relDir, uniqueName);
    const absPath = path.join(UPLOAD_DIR, relPath);

    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(absPath, bytes);

    db.prepare(
      `UPDATE Rapat SET
        fileRangkumanPath = ?,
        fileRangkumanName = ?,
        fileRangkumanSize = ?
       WHERE id = ?`
    ).run(relPath, file.name, bytes.length, id);

    db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
      'upload_rangkuman_rapat',
      `${session.namaLengkap} mengunggah berkas rangkuman PDF untuk rapat "${rapat.judul}"`,
      session.id
    );

    return NextResponse.json({
      ok: true,
      fileRangkumanName: file.name,
      fileRangkumanSize: bytes.length,
      fileRangkumanPath: relPath,
    });
  } catch (err) {
    console.error('Error uploading rangkuman rapat:', err);
    return NextResponse.json({ error: 'Gagal mengunggah berkas: ' + err.message }, { status: 500 });
  }
}

