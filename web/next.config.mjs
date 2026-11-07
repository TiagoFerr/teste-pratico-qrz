import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';

// Garante o carregamento do .env da raiz do monorepo tanto em dev local quanto em container
const { loadEnvConfig } = nextEnv;
const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnvConfig(projectDir);

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
