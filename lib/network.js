// lib/network.js
// Utilitas pendeteksi IP jaringan lokal (Wi-Fi / LAN)
// Memastikan QR Code dan link presensi otomatis menggunakan IP laptop di jaringan kantor,
// bukan "localhost", agar dapat discan dan dibuka oleh HP peserta yang terhubung ke Wi-Fi.

const os = require('os');

function getPrimaryNetworkIp() {
  if (process.env.HOST_IP) {
    return process.env.HOST_IP.trim();
  }
  if (process.env.APP_URL) {
    try {
      const parsed = new URL(process.env.APP_URL);
      return parsed.hostname;
    } catch {}
  }

  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    const lowerName = name.toLowerCase();

    // Abaikan interface virtual / VPN
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
      'loopback',
    ].some((kw) => lowerName.includes(kw));

    for (const net of addrs) {
      if (net.family !== 'IPv4' && net.family !== 4) continue;
      if (net.internal) continue;
      if (net.address.startsWith('127.')) continue;
      if (net.address.startsWith('169.254.')) continue; // Tak tersambung
      if (net.address.startsWith('192.168.56.')) continue; // VirtualBox

      let score = 50;
      if (isVirtual) score -= 100;

      // Utamakan Wi-Fi kantor, lalu kabel Ethernet/LAN
      if (lowerName.includes('wi-fi') || lowerName.includes('wireless') || lowerName.includes('wlan')) {
        score += 50;
      } else if (lowerName.includes('ethernet') || lowerName.includes('lan')) {
        score += 30;
      }

      if (score > 0) {
        candidates.push({ name, address: net.address, score });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.length > 0 ? candidates[0].address : 'localhost';
}

function getExternalBaseUrl(request) {
  let protocol = 'http';
  let host = 'localhost:3000';

  if (request) {
    try {
      const url = new URL(request.url);
      protocol = url.protocol.replace(':', '');
      host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
    } catch {}
  }

  const [hostname, port] = host.split(':');
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

  if (isLocalhost) {
    const networkIp = getPrimaryNetworkIp();
    if (networkIp && networkIp !== 'localhost') {
      const portPart = port ? `:${port}` : '';
      return `${protocol}://${networkIp}${portPart}`;
    }
  }

  return `${protocol}://${host}`;
}

module.exports = {
  getPrimaryNetworkIp,
  getExternalBaseUrl,
};
