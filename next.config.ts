import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cpus: 1,
    webpackMemoryOptimizations: true,
    serverActions: {
      bodySizeLimit: "512mb"
    }
  },
  images: {
    localPatterns: [
      {
        pathname: "/media/**"
      },
      {
        pathname: "/uploads/**"
      }
    ],
    remotePatterns: []
  }
};

export default nextConfig;
