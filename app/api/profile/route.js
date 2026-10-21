import { NextResponse } from 'next/server';
const { db } = require('../../../lib/db');
const { getSession } = require('../../../lib/session');
const { hashPassword, createSessionToken, COOKIE_NAME } = require('../../../lib/auth');

// GET /api/profile - data akun sendiri
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = db
    .prepare('SELECT id, username, namaLengkap, role, createdAt, avatarType, avatarIcon, avatarColor, avatarPhotoPath FROM User WHERE id = ?')
    .get(session.id);

  return NextResponse.json({ data: user });
}

// PATCH /api/profile - ubah nama, username, dan/atau password akun sendiri
export async function PATCH(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { username, namaLengkap, password } = await request.json();

  if (!username || !namaLengkap) {
    return NextResponse.json({ error: 'Nama lengkap dan username wajib diisi.' }, { status: 400 });
  }

  if (username !== session.username) {
    const existing = db.prepare('SELECT id FROM User WHERE username = ? AND id != ?').get(username, session.id);
    if (existing) return NextResponse.json({ error: 'Username sudah dipakai.' }, { status: 400 });
  }

  if (password && password.length > 0 && password.length < 6) {
    return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });
  }

  const target = db.prepare('SELECT * FROM User WHERE id = ?').get(session.id);
  const newPasswordHash = password && password.length > 0 ? await hashPassword(password) : target.password;

  db.prepare('UPDATE User SET username = ?, namaLengkap = ?, password = ? WHERE id = ?').run(
    username,
    namaLengkap,
    newPasswordHash,
    session.id
  );

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'ubah_profil',
    `${namaLengkap} memperbarui profil akunnya sendiri`,
    session.id
  );

  // Username/nama berubah -> re-issue session token supaya cookie ikut update datanya
  const updatedUser = db.prepare('SELECT * FROM User WHERE id = ?').get(session.id);
  const token = await createSessionToken(updatedUser);

  const isHttps = request.nextUrl?.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return res;
}
