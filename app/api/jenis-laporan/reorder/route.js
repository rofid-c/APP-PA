import { NextResponse } from 'next/server';
const { db } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');

// PATCH /api/jenis-laporan/reorder  body: { orderedIds: [3, 1, 2] }
export async function PATCH(request) {
  const session = await getSession();
  if (!session || session.role === 'staf_umum') {
    return NextResponse.json({ error: 'Tidak punya akses untuk mengelola jenis laporan.' }, { status: 403 });
  }

  const { orderedIds } = await request.json();
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ error: 'Data urutan tidak valid.' }, { status: 400 });
  }

  const updateUrutan = db.transaction((ids) => {
    const stmt = db.prepare('UPDATE JenisLaporan SET urutan = ? WHERE id = ?');
    ids.forEach((id, index) => stmt.run(index, Number(id)));
  });
  updateUrutan(orderedIds);

  return NextResponse.json({ ok: true });
}
