import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure images
  images: {
    domains: [],
  },
  // Experimental features
  experimental: {
    // App router features
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
