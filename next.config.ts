import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "prisma", "ioredis", "bullmq", "unpdf"],
};

export default nextConfig;
