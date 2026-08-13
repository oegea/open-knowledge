import type { MetadataRoute } from 'next';
import settingsFactory from '@/modules/settings/application/factory';

// Resolve at request time: the library name lives in runtime settings (or in
// the content repository), never in the build.
export const dynamic = 'force-dynamic';

/**
 * Web app manifest so any deployment is installable as a PWA without prior
 * configuration: the name comes from the instance settings and every URL is
 * origin-relative, so the same build works on any domain.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let libraryName = 'Open Knowledge';
  try {
    const settings = await settingsFactory.getInstanceSettings();
    libraryName = settings.getLibraryName() || libraryName;
  } catch {
    /* fresh instance without a database yet keeps the default */
  }

  return {
    id: '/',
    name: libraryName,
    short_name: libraryName.length > 12 ? 'Library' : libraryName,
    description: 'An open, self-hosted library of knowledge.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f6f9fa',
    theme_color: '#0e7c86',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
