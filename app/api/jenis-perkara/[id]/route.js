import { NextResponse } from 'next/server';
const { db } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');

function canManage(session) {
  if (!session) return false;
  return session.role !== 'staf_umum';
}

// PATCH /api/jenis-perkara/:id - rename
export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!canManage(session)) {
    return NextResponse.json({ error: 'Tidak punya akses untuk mengelola jenis perkara.' }, { status: 403 });
  }

  const id = Number(params.id);
  const { nama } = await request.json();
  if (!nama || !nama.trim()) {
    return NextResponse.json({ error: 'Nama jenis perkara wajib diisi.' }, { status: 400 });
  }

  const target = db.prepare('SELECT * FROM JenisPerkara WHERE id = ?').get(id);
  if (!target) return NextResponse.json({ error: 'Jenis perkara tidak ditemukan.' }, { status: 404 });

  const existing = db.prepare('SELECT id FROM JenisPerkara WHERE nama = ? AND id != ?').get(nama.trim(), id);
  if (existing) return NextResponse.json({ error: 'Nama ini sudah dipakai jenis perkara lain.' }, { status: 400 });

  db.prepare('UPDATE JenisPerkara SET nama = ? WHERE id = ?').run(nama.trim(), id);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'ubah_jenis_perkara',
    `${session.namaLengkap} mengubah nama jenis perkara "${target.nama}" menjadi "${nama.trim()}"`,
    session.id
  );

  return NextResponse.json({ ok: true });
}

// DELETE /api/jenis-perkara/:id?penggantiId=X - hapus, pindahkan arsip ke jenis pengganti dulu kalau perlu
export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!canManage(session)) {
    return NextResponse.json({ error: 'Tidak punya akses untuk mengelola jenis perkara.' }, { status: 403 });
  }

  const id = Number(params.id);
  const { searchParams } = new URL(request.url);
  const penggantiId = searchParams.get('penggantiId') ? Number(searchParams.get('penggantiId')) : null;

  const target = db.prepare('SELECT * FROM JenisPerkara WHERE id = ?').get(id);
  if (!target) return NextResponse.json({ error: 'Jenis perkara tidak ditemukan.' }, { status: 404 });

  const totalJenis = db.prepare('SELECT COUNT(*) as c FROM JenisPerkara').get().c;
  if (totalJenis <= 1) {
    return NextResponse.json({ error: 'Tidak bisa menghapus — ini jenis perkara terakhir yang tersisa.' }, { status: 400 });
  }

  const jumlahArsip = db.prepare('SELECT COUNT(*) as c FROM Arsip WHERE jenisPerkaraId = ?').get(id).c;

  if (jumlahArsip > 0) {
    if (!penggantiId) {
      return NextResponse.json(
        { error: 'Jenis ini masih dipakai arsip.', jumlahArsip, butuhPengganti: true },
        { status: 400 }
      );
    }
    const pengganti = db.prepare('SELECT id FROM JenisPerkara WHERE id = ?').get(penggantiId);
    if (!pengganti) return NextResponse.json({ error: 'Jenis perkara pengganti tidak ditemukan.' }, { status: 400 });
    if (penggantiId === id) return NextResponse.json({ error: 'Jenis pengganti tidak boleh sama dengan yang dihapus.' }, { status: 400 });

    db.prepare('UPDATE Arsip SET jenisPerkaraId = ? WHERE jenisPerkaraId = ?').run(penggantiId, id);
  }

  db.prepare('DELETE FROM JenisPerkara WHERE id = ?').run(id);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'hapus_jenis_perkara',
    `${session.namaLengkap} menghapus jenis perkara "${target.nama}"${jumlahArsip > 0 ? ` (${jumlahArsip} arsip dipindahkan)` : ''}`,
    session.id
  );

  return NextResponse.json({ ok: true });
}
