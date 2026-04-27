import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "512mb",
    },
  },
  outputFileTracingExcludes: {
    "*": [".git/**/*", ".data/**/*", "dev.db", "prisma/dev.db"],
  },
};

export default nextConfig;
