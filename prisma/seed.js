// prisma/seed.js
// Jalankan dengan: npm run seed
// Membuat akun admin awal.

const { db } = require('../lib/db');
const bcrypt = require('bcryptjs');

async function main() {
  const existing = db.prepare('SELECT id FROM User WHERE username = ?').get('admin');
  if (existing) {
    console.log('User admin sudah ada, skip pembuatan user.');
  } else {
    const hash = await bcrypt.hash('admin123', 10);
    db.prepare(
      `INSERT INTO User (username, password, namaLengkap, role) VALUES (?, ?, ?, ?)`
    ).run('admin', hash, 'Admin Arsip', 'admin');
    console.log('User admin dibuat. Username: admin | Password: admin123');
    console.log('SEGERA ganti password ini setelah login pertama kali.');
  }
}

main();
