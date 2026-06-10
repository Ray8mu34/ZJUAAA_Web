import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "512mb"
    }
  },
  images: {
    remotePatterns: []
  }
};

export default nextConfig;
