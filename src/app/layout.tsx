import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Manrope, Source_Serif_4, Geist_Mono } from 'next/font/google';
import { getLocale } from '@/i18n/getLocale';
import { getDictionary } from '@/i18n/dictionary';
import { I18nProvider } from '@/i18n/I18nProvider';
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

export const metadata: Metadata = {
  title: 'Open Knowledge',
  description:
    'An open, self-hosted library of knowledge. Browse courses and learn at your own pace.',
};

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
