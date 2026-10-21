// middleware.js
// Melindungi halaman-halaman aplikasi: kalau belum login, redirect ke /login.

import { NextResponse } from 'next/server';

const COOKIE_NAME = 'arsip_session';

export function middleware(request) {
  const session = request.cookies.get(COOKIE_NAME);
  const { pathname } = request.nextUrl;

  const isPublicPath = pathname === '/login' || pathname === '/register';
  const isApiAuth = pathname.startsWith('/api/auth');

  if (!session && !isPublicPath && !isApiAuth) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isPublicPath) {
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
