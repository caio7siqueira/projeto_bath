/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

const allowedDevOrigins = [
  'localhost',
  '127.0.0.1',
  'localhost:3000',
  '127.0.0.1:3000',
  'localhost:3001',
  '127.0.0.1:3001',
  'localhost:3100',
  '127.0.0.1:3100',
];

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins,
};

module.exports = withPWA(nextConfig);
