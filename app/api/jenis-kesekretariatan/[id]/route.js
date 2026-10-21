import { NextResponse } from 'next/server';
const { db } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');

function canManage(session) {
  if (!session) return false;
  return session.role !== 'staf_umum';
}

// PATCH /api/jenis-kesekretariatan/:id - rename
export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!canManage(session)) {
    return NextResponse.json({ error: 'Tidak punya akses untuk mengelola jenis arsip.' }, { status: 403 });
  }

  const id = Number(params.id);
  const { nama } = await request.json();
  if (!nama || !nama.trim()) {
    return NextResponse.json({ error: 'Nama jenis arsip wajib diisi.' }, { status: 400 });
  }

  const target = db.prepare('SELECT * FROM JenisArsipKesekretariatan WHERE id = ?').get(id);
  if (!target) return NextResponse.json({ error: 'Jenis arsip tidak ditemukan.' }, { status: 404 });

  const existing = target.divisiId
    ? db.prepare('SELECT id FROM JenisArsipKesekretariatan WHERE LOWER(nama) = LOWER(?) AND divisiId = ? AND id != ?').get(nama.trim(), target.divisiId, id)
    : db.prepare('SELECT id FROM JenisArsipKesekretariatan WHERE LOWER(nama) = LOWER(?) AND id != ?').get(nama.trim(), id);
  if (existing) return NextResponse.json({ error: 'Nama ini sudah dipakai di divisi ini.' }, { status: 400 });

  db.prepare('UPDATE JenisArsipKesekretariatan SET nama = ? WHERE id = ?').run(nama.trim(), id);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'ubah_jenis_kesekretariatan',
    `${session.namaLengkap} mengubah nama jenis arsip "${target.nama}" menjadi "${nama.trim()}"`,
    session.id
  );

  return NextResponse.json({ ok: true });
}

// DELETE /api/jenis-kesekretariatan/:id?penggantiId=X
export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!canManage(session)) {
    return NextResponse.json({ error: 'Tidak punya akses untuk mengelola jenis arsip.' }, { status: 403 });
  }

  const id = Number(params.id);
  const { searchParams } = new URL(request.url);
  const penggantiId = searchParams.get('penggantiId') ? Number(searchParams.get('penggantiId')) : null;

  const target = db.prepare('SELECT * FROM JenisArsipKesekretariatan WHERE id = ?').get(id);
  if (!target) return NextResponse.json({ error: 'Jenis arsip tidak ditemukan.' }, { status: 404 });

  const totalJenis = db.prepare('SELECT COUNT(*) as c FROM JenisArsipKesekretariatan').get().c;
  if (totalJenis <= 1) {
    return NextResponse.json({ error: 'Tidak bisa menghapus — ini jenis arsip terakhir yang tersisa.' }, { status: 400 });
  }

  const jumlahArsip = db.prepare('SELECT COUNT(*) as c FROM ArsipKesekretariatan WHERE jenisArsipId = ?').get(id).c;

  if (jumlahArsip > 0) {
    if (!penggantiId) {
      return NextResponse.json(
        { error: 'Jenis arsip ini masih dipakai arsip.', jumlahArsip, butuhPengganti: true },
        { status: 400 }
      );
    }
    const pengganti = db.prepare('SELECT id FROM JenisArsipKesekretariatan WHERE id = ?').get(penggantiId);
    if (!pengganti) return NextResponse.json({ error: 'Jenis arsip pengganti tidak ditemukan.' }, { status: 400 });
    if (penggantiId === id) return NextResponse.json({ error: 'Jenis pengganti tidak boleh sama dengan yang dihapus.' }, { status: 400 });

    db.prepare('UPDATE ArsipKesekretariatan SET jenisArsipId = ? WHERE jenisArsipId = ?').run(penggantiId, id);
  }

  db.prepare('DELETE FROM JenisArsipKesekretariatan WHERE id = ?').run(id);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'hapus_jenis_kesekretariatan',
    `${session.namaLengkap} menghapus jenis arsip "${target.nama}"${jumlahArsip > 0 ? ` (${jumlahArsip} arsip dipindahkan)` : ''}`,
    session.id
  );

  return NextResponse.json({ ok: true });
}
