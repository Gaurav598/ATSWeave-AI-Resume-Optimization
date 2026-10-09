import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "ioredis", "bullmq", "unpdf"],
};

export default nextConfig;
