import { NextResponse } from 'next/server';
const { getOAuth2Client, saveTokens } = require('../../../../lib/gdrive');

// GET /api/gdrive/callback?code=...
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/pengaturan?category=gdrive&error=' + encodeURIComponent(error || 'Otorisasi dibatalkan'), request.url));
  }

  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    return NextResponse.redirect(new URL('/pengaturan?category=gdrive&error=OAuth2_tidak_terkonfigurasi', request.url));
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    saveTokens(tokens);
    return NextResponse.redirect(new URL('/pengaturan?category=gdrive&success=1', request.url));
  } catch (err) {
    console.error('[GDrive OAuth Error]:', err?.message || err);
    return NextResponse.redirect(new URL('/pengaturan?category=gdrive&error=' + encodeURIComponent(err?.message || 'Gagal menukar token'), request.url));
  }
}
