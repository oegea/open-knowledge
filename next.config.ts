import type { NextConfig } from "next";

/**
 * Baseline security headers for every response. The CSP added in headers()
 * only carries directives that cannot break rendering (no script/style
 * policy: Next inlines both); it stops clickjacking, <base> hijacking,
 * cross-origin form posts and plugin content. HSTS is left to the
 * TLS-terminating proxy.
 */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), midi=(), browsing-topics=()',
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      // Headers set here override the route's own, and the media route sends
      // a stricter sandboxing CSP for uploaded SVGs: keep it out of this one.
      {
        source: '/((?!api/media/).*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'",
          },
        ],
      },
    ];
  },
  // Loaded from node_modules at runtime: pdfkit needs its bundled font
  // metrics on disk and better-sqlite3 is a native addon.
  serverExternalPackages: ['pdfkit', 'better-sqlite3', 'sharp', 'fontkit'],
  // The PDF exporter reads its bundled TTF fonts from disk at runtime; the
  // standalone trace cannot see that dependency on its own.
  outputFileTracingIncludes: {
    '/api/courses/**': ['src/modules/export/infrastructure/fonts/**/*'],
  },
  // Self-contained server bundle for the Docker image. Vercel does its own
  // output tracing and breaks when standalone is on (missing .nft.json).
  output: process.env.VERCEL ? undefined : 'standalone',
};

export default nextConfig;
