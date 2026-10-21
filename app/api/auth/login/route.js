import { NextResponse } from 'next/server';
const { db } = require('../../../../lib/db');
const { verifyPassword, createSessionToken, COOKIE_NAME } = require('../../../../lib/auth');

export async function POST(request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 });
  }

  const user = db.prepare('SELECT * FROM User WHERE username = ?').get(username);
  if (!user) {
    return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
  }

  if (user.status === 'pending') {
    return NextResponse.json({ error: 'Akun belum diverifikasi. Silahkan hubungi admin.' }, { status: 403 });
  }

  const token = await createSessionToken(user);

  db.prepare(
    'INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)'
  ).run('login', `${user.namaLengkap} login ke sistem`, user.id);

  const isHttps = request.nextUrl?.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, username: user.username, namaLengkap: user.namaLengkap, role: user.role },
  });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return res;
}
