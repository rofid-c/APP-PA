import { NextResponse } from 'next/server';
const QRCode = require('qrcode');
const { db } = require('../../../../../lib/db');

function parseValidId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/rapat/:id/qrcode -- QR Code PNG gambar untuk diarahkan ke halaman presensi mandiri
export async function GET(request, { params }) {
  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID rapat tidak valid.' }, { status: 400 });

  const rapat = db.prepare('SELECT id, judul FROM Rapat WHERE id = ?').get(id);
  if (!rapat) return NextResponse.json({ error: 'Data rapat tidak ditemukan.' }, { status: 404 });

  const url = new URL(request.url);
  const targetUrl = `${url.protocol}//${url.host}/presensi/${id}`;

  const pngBuffer = await QRCode.toBuffer(targetUrl, {
    type: 'png',
    width: 400,
    margin: 2,
    color: {
      dark: '#003526',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });

  return new NextResponse(pngBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

