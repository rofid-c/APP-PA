import { NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
const sharp = require('sharp');
const { db, UPLOAD_DIR } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');
const { createSessionToken, COOKIE_NAME } = require('../../../../lib/auth');

const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars');
const TARGET_SIZE = 800; // px
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB batas upload awal

// Kompres bertahap: coba kualitas makin rendah sampai realistis kecil,
// tapi berhenti di titik yang masih layak (tidak dipaksa sampai pecah).
async function compressToTargetSize(buffer) {
  const qualitySteps = [80, 65, 50, 40, 30];
  let result = null;

  for (const quality of qualitySteps) {
    result = await sharp(buffer)
      .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'cover', position: 'centre' })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    // Target realistis: di bawah ~150KB kalau memungkinkan, tanpa turun kualitas berlebihan
    if (result.length <= 150 * 1024) break;
  }

  return result;
}

// POST /api/profile/avatar-photo - upload foto profil sendiri
export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await request.formData();
  const file = form.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'File foto wajib diunggah.' }, { status: 400 });
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ error: 'Format harus JPG, PNG, atau WebP.' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: 'Ukuran file maksimal 10MB.' }, { status: 400 });
  }

  await mkdir(AVATAR_DIR, { recursive: true });

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  let compressed;
  try {
    compressed = await compressToTargetSize(inputBuffer);
  } catch {
    return NextResponse.json({ error: 'Gagal memproses gambar. Pastikan file gambar valid.' }, { status: 400 });
  }

  const fileName = `user-${session.id}-${Date.now()}.jpg`;
  const relPath = path.join('avatars', fileName);
  const absPath = path.join(UPLOAD_DIR, relPath);

  // Hapus foto lama kalau ada, sebelum tulis yang baru
  const current = db.prepare('SELECT avatarPhotoPath FROM User WHERE id = ?').get(session.id);
  await writeFile(absPath, compressed);

  if (current?.avatarPhotoPath) {
    try {
      await unlink(path.join(UPLOAD_DIR, current.avatarPhotoPath));
    } catch {
      // file lama mungkin sudah tidak ada, abaikan
    }
  }

  db.prepare(
    "UPDATE User SET avatarType = 'photo', avatarPhotoPath = ? WHERE id = ?"
  ).run(relPath, session.id);

  const updatedUser = db.prepare('SELECT * FROM User WHERE id = ?').get(session.id);
  const token = await createSessionToken(updatedUser);

  const isHttps = request.nextUrl?.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';

  const res = NextResponse.json({ ok: true, sizeKb: Math.round(compressed.length / 1024) });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return res;
}
