// middleware.js
// Melindungi halaman-halaman aplikasi: kalau belum login, redirect ke /login.

import { NextResponse } from 'next/server';

const COOKIE_NAME = 'arsip_session';

export function middleware(request) {
  const session = request.cookies.get(COOKIE_NAME);
  const { pathname } = request.nextUrl;

  const isAuthOnlyPath = pathname === '/login' || pathname === '/register';
  const isPresensiPublic = pathname.startsWith('/presensi');
  const isPublicPath = isAuthOnlyPath || isPresensiPublic;
  const isApiPublic = pathname.startsWith('/api/auth') || pathname.startsWith('/api/presensi');

  if (!session && !isPublicPath && !isApiPublic) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isAuthOnlyPath) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon\\.(?:svg|png|ico)|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
