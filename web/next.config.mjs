/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiInternalUrl = process.env.API_INTERNAL_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternalUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
