import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
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
