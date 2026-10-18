import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Hides the Next.js development badge, which otherwise sits over the sidebar in demos and recordings.
  devIndicators: false,
};

export default nextConfig;
