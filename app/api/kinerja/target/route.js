import { NextResponse } from 'next/server';
const { db } = require('../../../../lib/db');
const { getSession } = require('../../../../lib/session');

// PUT /api/kinerja/target
// body { indikatorId, tahun, target } - upsert target indikator untuk tahun tertentu
export async function PUT(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang boleh mengelola Capaian Kinerja.' }, { status: 403 });
  }

  const { indikatorId, tahun, target } = await request.json();
  if (!indikatorId || !tahun) {
    return NextResponse.json({ error: 'indikatorId dan tahun wajib diisi.' }, { status: 400 });
  }
  if (target === '' || target === null || target === undefined || isNaN(Number(target))) {
    return NextResponse.json({ error: 'Target harus berupa angka.' }, { status: 400 });
  }

  const indikator = db.prepare('SELECT * FROM IndikatorKinerja WHERE id = ?').get(indikatorId);
  if (!indikator) return NextResponse.json({ error: 'Indikator kinerja tidak ditemukan.' }, { status: 404 });

  db.prepare(
    `INSERT INTO TargetKinerja (indikatorId, tahun, target) VALUES (?, ?, ?)
     ON CONFLICT(indikatorId, tahun) DO UPDATE SET target = excluded.target`
  ).run(indikatorId, tahun, Number(target));

  return NextResponse.json({ ok: true });
}
