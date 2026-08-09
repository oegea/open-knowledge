import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Loaded from node_modules at runtime: pdfkit needs its bundled font
  // metrics on disk and better-sqlite3 is a native addon.
  serverExternalPackages: ['pdfkit', 'better-sqlite3', 'sharp'],
  // Self-contained server bundle for the Docker image. Vercel does its own
  // output tracing and breaks when standalone is on (missing .nft.json).
  output: process.env.VERCEL ? undefined : 'standalone',
};

export default nextConfig;
