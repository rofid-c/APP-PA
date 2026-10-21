/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 adalah native module, jangan di-bundle oleh webpack di sisi server
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

module.exports = nextConfig;
