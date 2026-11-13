import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true }, // no sharp, saves disk
};

export default nextConfig;
