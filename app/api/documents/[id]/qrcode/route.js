import { NextResponse } from 'next/server';
const QRCode = require('qrcode');
const { db } = require('../../../../../lib/db');
const { getSession } = require('../../../../../lib/session');

function parseValidId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/documents/:id/qrcode -- gambar PNG QR yang mengarah ke halaman detail arsip ini
export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID arsip tidak valid.' }, { status: 400 });

  const arsip = db.prepare('SELECT id FROM Arsip WHERE id = ?').get(id);
  if (!arsip) return NextResponse.json({ error: 'Arsip tidak ditemukan.' }, { status: 404 });

  // Base URL diambil dari request itu sendiri (host header) supaya otomatis sesuai
  // alamat/IP yang sedang dipakai mengakses aplikasi -- tidak di-hardcode.
  const url = new URL(request.url);
  const targetUrl = `${url.protocol}//${url.host}/cari/${id}`;

  const pngBuffer = await QRCode.toBuffer(targetUrl, {
    type: 'png',
    width: 300,
    margin: 1,
    errorCorrectionLevel: 'M',
  });

  return new NextResponse(pngBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, max-age=86400',
    },
  });
}
