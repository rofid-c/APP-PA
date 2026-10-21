import { NextResponse } from 'next/server';
const { db } = require('../../../../lib/db');
const { hashPassword } = require('../../../../lib/auth');

// POST /api/auth/register - pendaftaran mandiri, akun langsung berstatus 'pending'
export async function POST(request) {
  const { username, password, namaLengkap } = await request.json();

  if (!username || !password || !namaLengkap) {
    return NextResponse.json({ error: 'Nama lengkap, username, dan password wajib diisi.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });
  }

  const existing = db.prepare('SELECT id FROM User WHERE username = ?').get(username);
  if (existing) {
    return NextResponse.json({ error: 'Username sudah dipakai.' }, { status: 400 });
  }

  const hash = await hashPassword(password);
  // role diisi placeholder 'petugas' sementara — akan ditentukan ulang oleh admin saat verifikasi
  const info = db
    .prepare(
      `INSERT INTO User (username, password, namaLengkap, role, status) VALUES (?, ?, ?, 'petugas', 'pending')`
    )
    .run(username, hash, namaLengkap);

  // Tidak ada session admin di sini (publik), jadi log dicatat atas nama akun itu sendiri
  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'daftar_akun',
    `${namaLengkap} (${username}) mendaftar akun baru, menunggu verifikasi admin`,
    info.lastInsertRowid
  );

  return NextResponse.json({ ok: true });
}
