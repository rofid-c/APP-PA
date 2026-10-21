import { NextResponse } from 'next/server';
const { db } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');

// PATCH /api/divisi/reorder  body: { orderedIds: [3, 1, 2] }
export async function PATCH(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang boleh mengelola divisi.' }, { status: 403 });
  }

  const { orderedIds } = await request.json();
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ error: 'Data urutan tidak valid.' }, { status: 400 });
  }

  const updateUrutan = db.transaction((ids) => {
    const stmt = db.prepare('UPDATE Divisi SET urutan = ? WHERE id = ?');
    ids.forEach((id, index) => stmt.run(index, Number(id)));
  });
  updateUrutan(orderedIds);

  return NextResponse.json({ ok: true });
}
