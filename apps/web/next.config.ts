/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.example.com', // dodaj tu realne hosty, z których masz linki
      'cs.copart.com',
      'content.iaai.com',
    ],
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'images.example.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cs.copart.com', pathname: '/**' },
      { protocol: 'https', hostname: 'content.iaai.com', pathname: '/**' },
    ],
  },
};
module.exports = nextConfig;
