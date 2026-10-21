import { NextResponse } from 'next/server';
const { getSession } = require('../../../../lib/session');
const { getOAuth2Client } = require('../../../../lib/gdrive');

// GET /api/gdrive/auth - Redirect ke Google OAuth Consent Page
export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    return NextResponse.json({ error: 'GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET belum diatur di .env' }, { status: 400 });
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive'],
    prompt: 'consent',
  });

  return NextResponse.redirect(authUrl);
}
