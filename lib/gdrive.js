// lib/gdrive.js
// Integrasi Google Drive API v3 untuk sinkronisasi arsip digital ke cloud storage.
// Mendukung otentikasi via OAuth 2.0 (Akun Pribadi) dan Service Account (Workspace/Shared Drive).

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

let cachedDrive = null;
let cachedAuthEmail = null;

const DEFAULT_FOLDER_ID = '1TQ4uJrd64oMTTbncXQUWfC4LQgSCaRui';
const TOKEN_PATH = path.join(process.cwd(), 'data', 'gdrive-token.json');

function getFolderId() {
  return process.env.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID;
}

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/gdrive/callback';

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function saveTokens(tokens) {
  fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf8');
  cachedDrive = null;
}

function loadTokens() {
  if (fs.existsSync(TOKEN_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    } catch {
      return null;
    }
  }
  return null;
}

function getDriveClient() {
  if (cachedDrive) {
    return cachedDrive;
  }

  // 1. Cek otentikasi OAuth 2.0 (Khusus Akun Gmail Pribadi - Kuota 15GB user)
  const oauth2 = getOAuth2Client();
  const savedTokens = loadTokens();
  const refreshToken = savedTokens?.refresh_token || process.env.GOOGLE_REFRESH_TOKEN;

  if (oauth2 && refreshToken) {
    oauth2.setCredentials({
      refresh_token: refreshToken,
      access_token: savedTokens?.access_token,
    });
    cachedAuthEmail = 'Akun Google Pribadi (OAuth 2.0)';
    cachedDrive = google.drive({ version: 'v3', auth: oauth2 });
    return cachedDrive;
  }

  // 2. Cek file JSON Service Account
  const candidateFiles = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(process.cwd(), 'google-service-account.json'),
    path.join(process.cwd(), 'data', 'google-service-account.json'),
  ].filter(Boolean);

  let keyFilePath = null;
  for (const f of candidateFiles) {
    if (fs.existsSync(f)) {
      keyFilePath = f;
      break;
    }
  }

  let auth = null;
  if (keyFilePath) {
    try {
      const raw = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
      cachedAuthEmail = raw.client_email || 'Service Account File';
      auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
    } catch (err) {
      console.error('[GDrive] Gagal membaca keyFile:', err.message);
    }
  } else if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    try {
      cachedAuthEmail = process.env.GOOGLE_CLIENT_EMAIL;
      const formattedKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
      auth = new google.auth.JWT({
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: formattedKey,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
    } catch (err) {
      console.error('[GDrive] Gagal inisialisasi JWT credentials:', err.message);
    }
  }

  if (!auth) {
    return null;
  }

  cachedDrive = google.drive({ version: 'v3', auth });
  return cachedDrive;
}

/**
 * Cek apakah kredensial Google Drive sudah terpasang
 */
function isGoogleDriveConfigured() {
  return !!getDriveClient();
}

/**
 * Upload buffer file ke folder Google Drive
 */
async function uploadToGoogleDrive({ fileName, buffer, mimeType = 'application/pdf', folderId = null }) {
  const drive = getDriveClient();
  if (!drive) {
    return null;
  }

  const targetFolderId = folderId || getFolderId();

  try {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const res = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: targetFolderId ? [targetFolderId] : undefined,
      },
      media: {
        mimeType,
        body: stream,
      },
      supportsAllDrives: true,
      fields: 'id, name, webViewLink, webContentLink',
    });

    return {
      fileId: res.data.id,
      webViewLink: res.data.webViewLink,
      webContentLink: res.data.webContentLink,
    };
  } catch (err) {
    console.error('[GDrive Upload Error]:', err?.message || err);
    return null;
  }
}

/**
 * Hapus file dari Google Drive secara aman
 */
async function deleteFromGoogleDrive(fileId) {
  if (!fileId) return false;
  const drive = getDriveClient();
  if (!drive) return false;

  try {
    await drive.files.delete({ fileId, supportsAllDrives: true });
    return true;
  } catch (err) {
    console.error('[GDrive Delete Error]:', err?.message || err);
    return false;
  }
}

/**
 * Test koneksi Google Drive dan cek akses ke target folder
 */
async function testGoogleDriveConnection() {
  const drive = getDriveClient();
  const folderId = getFolderId();
  const oauth2Configured = !!getOAuth2Client();
  const hasUserToken = !!loadTokens();

  if (!drive) {
    return {
      configured: false,
      oauth2Configured,
      hasUserToken,
      folderId,
      message: 'Kredensial belum diatur. Untuk akun Gmail pribadi, atur GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET lalu klik Hubungkan Akun Google.',
    };
  }

  try {
    const folderRes = await drive.files.get({
      fileId: folderId,
      supportsAllDrives: true,
      fields: 'id, name, mimeType, owners, shared',
    });

    return {
      configured: true,
      ok: true,
      folderId,
      folderName: folderRes.data.name,
      authMethod: hasUserToken ? 'OAuth 2.0 (Akun Pribadi)' : 'Service Account',
      serviceAccountEmail: cachedAuthEmail,
      message: `Terhubung dengan sukses ke folder "${folderRes.data.name}"`,
    };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      folderId,
      serviceAccountEmail: cachedAuthEmail,
      error: err?.message || 'Gagal mengakses folder Google Drive. Pastikan folder dibagikan dengan benar.',
    };
  }
}

module.exports = {
  DEFAULT_FOLDER_ID,
  getFolderId,
  getOAuth2Client,
  saveTokens,
  loadTokens,
  isGoogleDriveConfigured,
  uploadToGoogleDrive,
  deleteFromGoogleDrive,
  testGoogleDriveConnection,
};
