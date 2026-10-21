import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
const { db, UPLOAD_DIR } = require('../../../../../lib/db');
const { getSession } = require('../../../../../lib/session');

// GET /api/profile/avatar-photo/:id - tampilkan foto profil user tertentu
export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = db.prepare('SELECT avatarPhotoPath FROM User WHERE id = ?').get(Number(params.id));
  if (!user || !user.avatarPhotoPath) {
    return NextResponse.json({ error: 'Foto tidak ditemukan.' }, { status: 404 });
  }

  try {
    const bytes = await readFile(path.join(UPLOAD_DIR, user.avatarPhotoPath));
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File foto tidak ditemukan di server.' }, { status: 404 });
  }
}
