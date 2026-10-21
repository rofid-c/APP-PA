import { NextResponse } from 'next/server';
const { db } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang boleh mengakses ini.' }, { status: 403 });
  }

  const data = db.prepare('SELECT namaPenandatangan, nipPenandatangan FROM PengaturanKinerja WHERE id = 1').get();
  return NextResponse.json({ data });
}

export async function PUT(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang boleh mengubah ini.' }, { status: 403 });
  }

  const { namaPenandatangan, nipPenandatangan } = await request.json();
  if (!namaPenandatangan || !namaPenandatangan.trim()) {
    return NextResponse.json({ error: 'Nama penandatangan wajib diisi.' }, { status: 400 });
  }

  db.prepare('UPDATE PengaturanKinerja SET namaPenandatangan = ?, nipPenandatangan = ? WHERE id = 1').run(
    namaPenandatangan.trim(),
    (nipPenandatangan || '').trim()
  );

  return NextResponse.json({ ok: true });
}
