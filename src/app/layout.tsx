import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Manrope, Source_Serif_4, Geist_Mono } from 'next/font/google';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary } from '@/i18n/dictionary';
import { I18nProvider } from '@/i18n/I18nProvider';
import settingsFactory from '@/modules/settings/application/factory';
import './globals.css';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

const sourceSerif = Source_Serif_4({
  variable: '--font-source-serif',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  // Mobile browser chrome follows the active theme, like a native app.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f9fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1117' },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  // The configured library name leads every tab title; child pages append
  // what is being viewed through the template ("Library - Course title").
  let libraryName = 'Open Knowledge';
  try {
    const settings = await settingsFactory.getInstanceSettings();
    libraryName = settings.getLibraryName() || libraryName;
  } catch {
    /* fresh instance without a database yet keeps the default */
  }
  return {
    title: { default: libraryName, template: `${libraryName} - %s` },
    description:
      'An open, self-hosted library of knowledge. Browse courses and learn at your own pace.',
    applicationName: libraryName,
    // Installed-app niceties (iOS home screen, Android WebAPK).
    appleWebApp: { capable: true, title: libraryName, statusBarStyle: 'default' },
  };
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  // Explicit theme choice persisted in a cookie renders without a flash.
  const cookieStore = await cookies();
  const theme = cookieStore.get('ok_theme')?.value;

  return (
    <html
      lang={locale}
      data-theme={theme === 'light' || theme === 'dark' ? theme : undefined}
      className={`${manrope.variable} ${sourceSerif.variable} ${geistMono.variable}`}
    >
      <body>
        <I18nProvider locale={locale} dictionary={dictionary}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
