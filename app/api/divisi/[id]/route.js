import { NextResponse } from 'next/server';
const { db } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');
const { slugify } = require('../../../../lib/slugify');

function requireAdmin(session) {
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (session.role !== 'admin') return { error: 'Hanya admin yang boleh mengelola divisi.', status: 403 };
  return null;
}

// PATCH /api/divisi/:id - rename (slug ikut berubah sesuai nama baru)
export async function PATCH(request, { params }) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const id = Number(params.id);
  const { nama } = await request.json();
  if (!nama || !nama.trim()) {
    return NextResponse.json({ error: 'Nama divisi wajib diisi.' }, { status: 400 });
  }

  const target = db.prepare('SELECT * FROM Divisi WHERE id = ?').get(id);
  if (!target) return NextResponse.json({ error: 'Divisi tidak ditemukan.' }, { status: 404 });

  const namaTrim = nama.trim();
  const existing = db.prepare('SELECT id FROM Divisi WHERE nama = ? AND id != ?').get(namaTrim, id);
  if (existing) return NextResponse.json({ error: 'Nama ini sudah dipakai divisi lain.' }, { status: 400 });

  let slug = slugify(namaTrim);
  let slugFinal = slug;
  let counter = 2;
  while (db.prepare('SELECT id FROM Divisi WHERE slug = ? AND id != ?').get(slugFinal, id)) {
    slugFinal = `${slug}-${counter}`;
    counter++;
  }

  db.prepare('UPDATE Divisi SET nama = ?, slug = ? WHERE id = ?').run(namaTrim, slugFinal, id);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'ubah_divisi',
    `${session.namaLengkap} mengubah nama divisi "${target.nama}" menjadi "${namaTrim}"`,
    session.id
  );

  return NextResponse.json({ ok: true, slug: slugFinal });
}

// DELETE /api/divisi/:id?penggantiId=X - hapus, pindahkan arsip kesekretariatan ke divisi pengganti dulu kalau perlu
export async function DELETE(request, { params }) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const id = Number(params.id);
  const { searchParams } = new URL(request.url);
  const penggantiId = searchParams.get('penggantiId') ? Number(searchParams.get('penggantiId')) : null;

  const target = db.prepare('SELECT * FROM Divisi WHERE id = ?').get(id);
  if (!target) return NextResponse.json({ error: 'Divisi tidak ditemukan.' }, { status: 404 });

  const totalDivisi = db.prepare('SELECT COUNT(*) as c FROM Divisi').get().c;
  if (totalDivisi <= 1) {
    return NextResponse.json({ error: 'Tidak bisa menghapus — ini divisi terakhir yang tersisa.' }, { status: 400 });
  }

  const jumlahArsip = db.prepare('SELECT COUNT(*) as c FROM ArsipKesekretariatan WHERE divisiId = ?').get(id).c;

  if (jumlahArsip > 0) {
    if (!penggantiId) {
      return NextResponse.json(
        { error: 'Divisi ini masih dipakai arsip.', jumlahArsip, butuhPengganti: true },
        { status: 400 }
      );
    }
    const pengganti = db.prepare('SELECT id FROM Divisi WHERE id = ?').get(penggantiId);
    if (!pengganti) return NextResponse.json({ error: 'Divisi pengganti tidak ditemukan.' }, { status: 400 });
    if (penggantiId === id) return NextResponse.json({ error: 'Divisi pengganti tidak boleh sama dengan yang dihapus.' }, { status: 400 });

    db.prepare('UPDATE ArsipKesekretariatan SET divisiId = ? WHERE divisiId = ?').run(penggantiId, id);
  }

  db.prepare('DELETE FROM Divisi WHERE id = ?').run(id);

  db.prepare('INSERT INTO LogAktivitas (aksi, deskripsi, userId) VALUES (?, ?, ?)').run(
    'hapus_divisi',
    `${session.namaLengkap} menghapus divisi "${target.nama}"${jumlahArsip > 0 ? ` (${jumlahArsip} arsip dipindahkan)` : ''}`,
    session.id
  );

  return NextResponse.json({ ok: true });
}
