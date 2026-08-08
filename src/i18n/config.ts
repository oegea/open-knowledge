export const LOCALE_CODES = [
  'es',
  'en',
  'fr',
  'de',
  'it',
  'zh',
  'ru',
  'uk',
  'ca',
  'gl',
  'eu',
  'pt',
  'ja',
] as const;

export type Locale = (typeof LOCALE_CODES)[number];

export interface LocaleInfo {
  code: Locale;
  /* Short, hyper-visual language tag shown in the UI (no country flags). */
  iso: string;
  nativeName: string;
}

export const LOCALES: LocaleInfo[] = [
  { code: 'es', iso: 'ES', nativeName: 'Español' },
  { code: 'en', iso: 'EN', nativeName: 'English' },
  { code: 'fr', iso: 'FR', nativeName: 'Français' },
  { code: 'de', iso: 'DE', nativeName: 'Deutsch' },
  { code: 'it', iso: 'IT', nativeName: 'Italiano' },
  { code: 'zh', iso: 'ZH', nativeName: '简体中文' },
  { code: 'ru', iso: 'RU', nativeName: 'Русский' },
  { code: 'uk', iso: 'UK', nativeName: 'Українська' },
  { code: 'ca', iso: 'CA', nativeName: 'Català' },
  { code: 'gl', iso: 'GL', nativeName: 'Galego' },
  { code: 'eu', iso: 'EU', nativeName: 'Euskara' },
  { code: 'pt', iso: 'PT', nativeName: 'Português' },
  { code: 'ja', iso: 'JA', nativeName: '日本語' },
];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_COOKIE = 'ok_locale';

export function isLocale(value: string): value is Locale {
  return (LOCALE_CODES as readonly string[]).includes(value);
}

/**
 * Picks the best supported locale from an Accept-Language header.
 * `zh-Hans`, `zh-CN`, etc. all resolve to our `zh` (Simplified Chinese).
 */
export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const candidates = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, qPart] = part.trim().split(';q=');
      return { tag: tag.toLowerCase(), q: qPart ? Number(qPart) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of candidates) {
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
