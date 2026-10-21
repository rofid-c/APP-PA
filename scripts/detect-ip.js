/**
 * detect-ip.js
 * Otomatis mendeteksi alamat IP lokal (Wi-Fi / Ethernet LAN)
 * dan menampilkan URL akses untuk perangkat lain di jaringan yang sama.
 */

const os = require('os');
const { execSync } = require('child_process');

const fs = require('fs');

let PORT = process.env.PORT || 3000;
if (fs.existsSync('.env')) {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const match = envContent.match(/^PORT\s*=\s*['"]?(\d+)['"]?/m);
    if (match) {
      PORT = parseInt(match[1], 10);
    }
  } catch (e) {}
}

const args = process.argv.slice(2);
const shouldCopy = args.includes('--copy');

function formatUrl(host, port) {
  if (Number(port) === 80) {
    return `http://${host}`;
  }
  return `http://${host}:${port}`;
}

function getNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    const lowerName = name.toLowerCase();

    // Abaikan adaptor virtual / tunnel
    const isVirtual = [
      'virtual',
      'vbox',
      'vmware',
      'hyper-v',
      'vethernet',
      'wsl',
      'tap',
      'tun',
      'tailscale',
      'zerotier',
      'bluetooth',
      'loopback'
    ].some(kw => lowerName.includes(kw));

    for (const net of addrs) {
      // Hanya IPv4 non-internal
      if (net.family !== 'IPv4' && net.family !== 4) continue;
      if (net.internal) continue;
      if (net.address.startsWith('127.')) continue;
      if (net.address.startsWith('169.254.')) continue; // Auto-IP tak tersambung
      if (net.address.startsWith('192.168.56.')) continue; // VirtualBox host-only

      let score = 50;
      if (isVirtual) score -= 100;
      if (lowerName.includes('wi-fi') || lowerName.includes('wireless') || lowerName.includes('wlan')) {
        score += 50;
      } else if (lowerName.includes('ethernet') || lowerName.includes('lan')) {
        score += 30;
      }

      if (score > 0) {
        candidates.push({
          name,
          address: net.address,
          score
        });
      }
    }
  }

  // Urutkan dari score tertinggi (Wi-Fi lebih diutamakan, lalu Ethernet)
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

function copyToClipboard(text) {
  try {
    // Gunakan powershell Set-Clipboard di Windows
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-Clipboard -Value '${text}'"`, {
      stdio: 'ignore',
      timeout: 3000
    });
    return true;
  } catch (e) {
    return false;
  }
}

function main() {
  const candidates = getNetworkAddresses();
  const localUrl = formatUrl('localhost', PORT);

  console.log('\n' + '='.repeat(67));
  console.log('       SISTEM INFORMASI ARSIP & CAPAIAN KINERJA (PA)');
  console.log('='.repeat(67));
  console.log('\n  [1] Akses dari LAPTOP INI (Server Host):');
  console.log(`      -> \x1b[36m${localUrl}\x1b[0m`);

  if (candidates.length > 0) {
    const primary = candidates[0];
    const networkUrl = formatUrl(primary.address, PORT);

    console.log('\n  [2] Akses dari HP / LAPTOP LAIN (Wi-Fi yang sama):');
    console.log(`      -> \x1b[32m\x1b[1m${networkUrl}\x1b[0m   (Jaringan: ${primary.name})`);

    if (candidates.length > 1) {
      console.log('\n      Alternatif IP lain yang aktif:');
      for (let i = 1; i < candidates.length; i++) {
        console.log(`      -> ${formatUrl(candidates[i].address, PORT)}  (${candidates[i].name})`);
      }
    }

    let copied = false;
    if (shouldCopy) {
      copied = copyToClipboard(networkUrl);
    }

    if (copied) {
      console.log('\n  \x1b[33m[OK] Link sudah otomatis DISALIN ke Clipboard!\x1b[0m');
      console.log('       Tinggal tekan Paste (Ctrl + V) di WhatsApp / Browser rekan.');
    }

    console.log('\n  Catatan: Pastikan rekan kerja terhubung ke Wi-Fi yang sama');
    console.log('  dengan laptop ini agar link di atas dapat dibuka.');
  } else {
    console.log('\n  [!] STATUS JARINGAN:');
    console.log('      Laptop ini belum terhubung ke Wi-Fi atau kabel LAN.');
    console.log('      Aplikasi tetap bisa digunakan di laptop ini via localhost.');
    console.log('      Untuk berbagi dengan orang lain, hubungkan laptop ke Wi-Fi.');
  }

  console.log('='.repeat(67));
  console.log('  * JANGAN TUTUP jendela terminal ini selama memakai aplikasi.');
  console.log('  * Untuk MEMATIKAN server: cukup tutup jendela ini [X] atau Ctrl + C');
  console.log('='.repeat(67) + '\n');
}

main();
