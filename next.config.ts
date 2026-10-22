import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Hides the Next.js development badge, which otherwise sits over the sidebar in demos and recordings.
  devIndicators: false,
  // Files read from disk at run time, which the hosted build must ship with every function.
  outputFileTracingIncludes: {
    "/": ["./db/schema.sql", "./deploy/initial.db", "./lib-source/ai_trace_synthetic_dataset.xlsx"],
    "/**": ["./db/schema.sql", "./deploy/initial.db", "./lib-source/ai_trace_synthetic_dataset.xlsx"],
  },
};

export default nextConfig;
