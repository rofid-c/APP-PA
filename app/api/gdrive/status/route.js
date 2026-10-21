import { NextResponse } from 'next/server';
const { getSession } = require('../../../../lib/session');
const { testGoogleDriveConnection, isGoogleDriveConfigured, getFolderId } = require('../../../../lib/gdrive');

// GET /api/gdrive/status - Cek status koneksi Google Drive
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await testGoogleDriveConnection();
  return NextResponse.json(result);
}
