import { NextResponse } from 'next/server';
const { db } = require('../../../../lib/db');
const QRCode = require('qrcode');

function parseValidId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/presensi/:id (Public: mengambil info rapat untuk form absensi mobile)
export async function GET(request, { params }) {
  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID rapat tidak valid.' }, { status: 400 });

  const rapat = db
    .prepare(
      `SELECT id, judul, tanggal, waktuMulai, waktuSelesai, tempat, pimpinanRapat, agenda
       FROM Rapat
       WHERE id = ?`
    )
    .get(id);

  if (!rapat) {
    return NextResponse.json({ error: 'Rapat tidak ditemukan atau sudah ditutup.' }, { status: 404 });
  }

  return NextResponse.json({ data: rapat });
}

// POST /api/presensi/:id (Public: submit absensi oleh peserta dengan TTD digital)
export async function POST(request, { params }) {
  const id = parseValidId(params.id);
  if (!id) return NextResponse.json({ error: 'ID rapat tidak valid.' }, { status: 400 });

  const rapat = db.prepare('SELECT id, judul FROM Rapat WHERE id = ?').get(id);
  if (!rapat) {
    return NextResponse.json({ error: 'Rapat tidak ditemukan atau sudah ditutup.' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { nama, jabatan, nip, instansi, ttdData } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: 'Nama lengkap wajib diisi.' }, { status: 400 });
    }
    if (!jabatan || !jabatan.trim()) {
      return NextResponse.json({ error: 'Jabatan / unit kerja wajib diisi.' }, { status: 400 });
    }
    if (!ttdData || !ttdData.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Tanda tangan digital wajib dibubuhkan.' }, { status: 400 });
    }

    // Kode unik presensi / barcode identifier
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestampStr = Date.now().toString().slice(-4);
    const barcodeData = `PAGS-RAPAT-${id}-${timestampStr}-${randomHex}`;

    const info = db
      .prepare(
        `INSERT INTO PresensiRapat (
          rapatId, nama, jabatan, nip, instansi, ttdData, barcodeData, waktuHadir
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`
      )
      .run(
        id,
        nama.trim(),
        jabatan.trim(),
        (nip || '').trim() || null,
        (instansi || 'PA Gunung Sugih').trim(),
        ttdData,
        barcodeData
      );

    // Buat QR code base64 tanda verifikasi kehadiran peserta
    const qrBukti = await QRCode.toDataURL(barcodeData, {
      margin: 1,
      width: 180,
      color: { dark: '#003526', light: '#ffffff' },
    });

    return NextResponse.json({
      ok: true,
      id: info.lastInsertRowid,
      nama: nama.trim(),
      jabatan: jabatan.trim(),
      barcodeData,
      qrBukti,
      waktuHadir: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error submitting presensi:', err);
    return NextResponse.json({ error: 'Gagal mengirim presensi: ' + err.message }, { status: 500 });
  }
}

