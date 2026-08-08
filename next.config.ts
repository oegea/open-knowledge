import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Loaded from node_modules at runtime: pdfkit needs its bundled font
  // metrics on disk and better-sqlite3 is a native addon.
  serverExternalPackages: ['pdfkit', 'better-sqlite3', 'sharp'],
};

export default nextConfig;
