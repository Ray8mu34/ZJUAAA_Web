import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb"
    }
  },
  images: {
    remotePatterns: []
  }
};

export default nextConfig;
