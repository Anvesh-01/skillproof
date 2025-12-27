import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  
  // Image configuration
  images: {
    domains: ['example.com'],
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/old-route',
        destination: '/new-route',
        permanent: true,
      },
    ];
  },
};

export default config;
