import { NextResponse } from 'next/server';
const { db } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');
const { createSessionToken, COOKIE_NAME } = require('../../../../lib/auth');
const { AVATAR_ICONS, AVATAR_COLORS } = require('../../../lib/avatarOptions');

// PATCH /api/profile/avatar - set avatar jadi icon+warna pilihan (atau acak)
export async function PATCH(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { icon, color } = await request.json();

  if (!AVATAR_ICONS.includes(icon)) {
    return NextResponse.json({ error: 'Icon tidak valid.' }, { status: 400 });
  }
  if (!AVATAR_COLORS.includes(color)) {
    return NextResponse.json({ error: 'Warna tidak valid.' }, { status: 400 });
  }

  db.prepare(
    "UPDATE User SET avatarType = 'icon', avatarIcon = ?, avatarColor = ?, avatarPhotoPath = NULL WHERE id = ?"
  ).run(icon, color, session.id);

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
