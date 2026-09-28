import type { NextConfig } from "next";

const designQA = process.env.NODE_ENV === "development" && process.env.DESIGN_QA === "1";

const nextConfig: NextConfig = {
  distDir: designQA ? ".design-qa/next" : process.env.DESIGN_QA_BUILD === "1" ? ".design-qa/production-build" : ".next",
  ...(designQA ? { devIndicators: false as const } : {}),
  experimental: {
    serverActions: {
      bodySizeLimit: "512mb"
    }
  },
  images: {
    // Fixtures already have bounded dimensions; avoid Windows image-cache path limits.
    unoptimized: designQA,
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
