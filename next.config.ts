// import type { NextConfig } from 'next';

// const config: NextConfig = {
//   reactStrictMode: true,
  
//   // Image configuration
//   images: {
//     domains: ['example.com'],
//   },
  
//   // Environment variables
//   env: {
//     CUSTOM_KEY: process.env.CUSTOM_KEY,
//   },
  
//   // Redirects
//   async redirects() {
//     return [
//       {
//         source: '/old-route',
//         destination: '/new-route',
//         permanent: true,
//       },
//     ];
//   },
// };

// export default config;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // ⚠️ Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;