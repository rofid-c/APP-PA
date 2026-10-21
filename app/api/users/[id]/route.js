import { NextResponse } from 'next/server';
const { db } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');
const { hashPassword } = require('../../../../lib/auth');

function requireAdmin(session) {
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (session.role !== 'admin') return { error: 'Hanya admin yang boleh mengelola akun.', status: 403 };
  return null;
}

function countAdmins() {
  return db.prepare("SELECT COUNT(*) as c FROM User WHERE role = 'admin'").get().c;
}

// PATCH /api/users/:id - ubah nama, username, role, dan/atau password (password opsional)
export async function PATCH(request, { params }) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const id = Number(params.id);
  const target = db.prepare('SELECT * FROM User WHERE id = ?').get(id);
  if (!target) return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });

  const { username, namaLengkap, role, password, status } = await request.json();

  if (username && username !== target.username) {
    const existing = db.prepare('SELECT id FROM User WHERE username = ? AND id != ?').get(username, id);
    if (existing) return NextResponse.json({ error: 'Username sudah dipakai.' }, { status: 400 });
  }

  if (role && role !== target.role) {
    if (!['admin', 'petugas', 'staf_umum'].includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
    }
    if (target.role === 'admin' && role !== 'admin' && countAdmins() <= 1) {
      return NextResponse.json({ error: 'Tidak bisa mengubah role — ini admin terakhir.' }, { status: 400 });
    }
  }

  if (password && password.length > 0 && password.length < 6) {
    return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });
  }

  const newUsername = username || target.username;
  const newNama = namaLengkap || target.namaLengkap;
  const newRole = role || target.role;
  const newStatus = status || target.status;
  const newPasswordHash = password && password.length > 0 ? await hashPassword(password) : target.password;

  db.prepare(
    'UPDATE User SET username = ?, namaLengkap = ?, role = ?, status = ?, password = ? WHERE id = ?'
  ).run(newUsername, newNama, newRole, newStatus, newPasswordHash, id);

  const aksiLog = target.status === 'pending' && newStatus === 'aktif' ? 'verifikasi_akun' : 'ubah_akun';
  const deskripsiLog = target.status === 'pending' && newStatus === 'aktif'
    ? `${session.namaLengkap} memverifikasi akun ${newNama} (${newUsername}) sebagai ${newRole}`
    : `${session.namaLengkap} mengubah data akun ${newNama} (${newUsername})`;

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    aksiLog,
    deskripsiLog,
    session.id
  );

  return NextResponse.json({ ok: true });
}

// DELETE /api/users/:id
export async function DELETE(request, { params }) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const id = Number(params.id);
  if (id === session.id) {
    return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri saat sedang login.' }, { status: 400 });
  }

  const target = db.prepare('SELECT * FROM User WHERE id = ?').get(id);
  if (!target) return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });

  if (target.role === 'admin' && countAdmins() <= 1) {
    return NextResponse.json({ error: 'Tidak bisa menghapus admin terakhir.' }, { status: 400 });
  }

  const arsipCount = db.prepare('SELECT COUNT(*) as c FROM Arsip WHERE uploadedBy = ?').get(id).c;
  const kesekCount = db.prepare('SELECT COUNT(*) as c FROM ArsipKesekretariatan WHERE uploadedBy = ?').get(id).c;
  const lapCount = db.prepare('SELECT COUNT(*) as c FROM ArsipLaporan WHERE uploadedBy = ?').get(id).c;
  const pinjamCount = db.prepare('SELECT COUNT(*) as c FROM Peminjaman WHERE dicatatOleh = ?').get(id).c;

  const totalTerkait = arsipCount + kesekCount + lapCount + pinjamCount;
  if (totalTerkait > 0) {
    return NextResponse.json(
      { error: `Akun ini masih memiliki ${totalTerkait} riwayat dokumen/transaksi di sistem. Tidak bisa dihapus untuk menjaga integritas data arsip.` },
      { status: 400 }
    );
  }

  try {
    const deleteTx = db.transaction(() => {
      // Hapus log aktivitas yang dimiliki user ini (misal log pendaftaran mandiri)
      db.prepare('DELETE FROM LogAktivitas WHERE userId = ?').run(id);

      // Hapus user dari database
      db.prepare('DELETE FROM User WHERE id = ?').run(id);

      // Catat log oleh admin yang menghapus / menolak pendaftaran
      const aksi = target.status === 'pending' ? 'tolak_pendaftaran' : 'hapus_akun';
      const deskripsi = target.status === 'pending'
        ? `${session.namaLengkap} menolak pendaftaran akun ${target.namaLengkap} (${target.username})`
        : `${session.namaLengkap} menghapus akun ${target.namaLengkap} (${target.username})`;

      db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
        aksi,
        deskripsi,
        session.id
      );
    });

    deleteTx();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error saat menghapus user:', err);
    return NextResponse.json({ error: 'Gagal menghapus akun: ' + err.message }, { status: 500 });
  }
}
