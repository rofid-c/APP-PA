import { NextResponse } from 'next/server';
const { db } = require('../../../lib/db');
const { getSession } = require('../../../lib/session');
const { hashPassword } = require('../../../lib/auth');

const ROLE_VALID = ['admin', 'petugas', 'staf_umum'];

function requireAdmin(session) {
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (session.role !== 'admin') return { error: 'Hanya admin yang boleh mengelola akun.', status: 403 };
  return null;
}

// GET /api/users?status=aktif|pending - daftar user (tanpa password)
export async function GET(request) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const users = status
    ? db.prepare('SELECT id, username, namaLengkap, role, status, createdAt FROM User WHERE status = ? ORDER BY createdAt ASC').all(status)
    : db.prepare('SELECT id, username, namaLengkap, role, status, createdAt FROM User ORDER BY createdAt ASC').all();

  return NextResponse.json({ data: users });
}

// POST /api/users - admin buat akun baru langsung aktif
export async function POST(request) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const { username, password, namaLengkap, role } = await request.json();

  if (!username || !password || !namaLengkap) {
    return NextResponse.json({ error: 'Username, password, dan nama lengkap wajib diisi.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });
  }
  if (!ROLE_VALID.includes(role)) {
    return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
  }

  const existing = db.prepare('SELECT id FROM User WHERE username = ?').get(username);
  if (existing) {
    return NextResponse.json({ error: 'Username sudah dipakai.' }, { status: 400 });
  }

  const hash = await hashPassword(password);
  const info = db
    .prepare(`INSERT INTO User (username, password, namaLengkap, role, status) VALUES (?, ?, ?, ?, 'aktif')`)
    .run(username, hash, namaLengkap, role);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'buat_akun',
    `${session.namaLengkap} membuat akun baru untuk ${namaLengkap} (${username})`,
    session.id
  );

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
