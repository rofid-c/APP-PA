// scripts/auto-backup.js
// Pencadangan otomatis database dan berkas lokal sebelum proses update/instalasi.

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const envFile = path.join(rootDir, '.env');
const backupBaseDir = path.join(rootDir, 'backups');

if (!fs.existsSync(dataDir)) {
  console.log('[BACKUP] Folder data belum ada, tidak ada data yang perlu dicadangkan.');
  process.exit(0);
}

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const backupDir = path.join(backupBaseDir, `backup_${timestamp}`);

function copyFolderSync(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const item of fs.readdirSync(from)) {
    const srcPath = path.join(from, item);
    const destPath = path.join(to, item);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  fs.mkdirSync(backupDir, { recursive: true });
  copyFolderSync(dataDir, path.join(backupDir, 'data'));
  if (fs.existsSync(envFile)) {
    fs.copyFileSync(envFile, path.join(backupDir, '.env'));
  }
  console.log(`[V] Cadangan data otomatis BERHASIL disimpan di: backups/backup_${timestamp}`);

  // Simpan maksimal 10 cadangan terakhir untuk menghemat ruang penyimpanan
  const allBackups = fs.readdirSync(backupBaseDir)
    .filter((d) => d.startsWith('backup_'))
    .sort();

  if (allBackups.length > 10) {
    const toRemove = allBackups.slice(0, allBackups.length - 10);
    for (const old of toRemove) {
      try {
        fs.rmSync(path.join(backupBaseDir, old), { recursive: true, force: true });
      } catch (e) {}
    }
  }
} catch (err) {
  console.warn('[!] Peringatan saat membuat cadangan data:', err.message);
}
