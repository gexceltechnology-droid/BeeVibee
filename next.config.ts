import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/secret-owner-portal',
        permanent: false,
      },
      {
        source: '/admin/login',
        destination: '/secret-owner-portal',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
