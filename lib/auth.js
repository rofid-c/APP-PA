// lib/auth.js
// Autentikasi sederhana: password di-hash dengan bcrypt, sesi disimpan sebagai
// JWT di cookie httpOnly (jadi tidak bisa dibaca lewat JavaScript di browser).

const bcrypt = require('bcryptjs');
const { SignJWT, jwtVerify } = require('jose');

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-me'
);
const COOKIE_NAME = 'arsip_session';

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

async function createSessionToken(user) {
  return new SignJWT({
    id: user.id,
    username: user.username,
    namaLengkap: user.namaLengkap,
    role: user.role,
    avatarType: user.avatarType,
    avatarIcon: user.avatarIcon,
    avatarColor: user.avatarColor,
    avatarPhotoPath: user.avatarPhotoPath,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET);
}

async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  COOKIE_NAME,
};
