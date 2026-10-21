// lib/session.js
// Helper untuk membaca sesi user yang sedang login, dipakai di Server Components
// dan Route Handlers (App Router).

const { cookies } = require('next/headers');
const { verifySessionToken, COOKIE_NAME } = require('./auth');

async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

module.exports = { getSession };
