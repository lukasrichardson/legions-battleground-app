import type { NextConfig } from "next";

const r2ImageHost = (() => {
  try {
    return new URL(process.env.R2_PUBLIC_BASE_URL || "https://pub-8e94f6b176a84fbd900c0ef39d4b6e5b.r2.dev").hostname;
  } catch {
    return "pub-8e94f6b176a84fbd900c0ef39d4b6e5b.r2.dev";
  }
})();

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.legionstoolbox.com",
      },
      {
        protocol: "https",
        hostname: r2ImageHost,
      }
    ]
  }
};

export default nextConfig;
