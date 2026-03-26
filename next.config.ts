import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "64mb"
    }
  },
  images: {
    remotePatterns: []
  }
};

export default nextConfig;
