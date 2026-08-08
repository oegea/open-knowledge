import type { Locale } from './config';

export type Dictionary = { [key: string]: string | Dictionary };

const loaders: Record<Locale, () => Promise<{ default: Dictionary }>> = {
  es: () => import('./dictionaries/es.json') as Promise<{ default: Dictionary }>,
  en: () => import('./dictionaries/en.json') as Promise<{ default: Dictionary }>,
  fr: () => import('./dictionaries/fr.json') as Promise<{ default: Dictionary }>,
  de: () => import('./dictionaries/de.json') as Promise<{ default: Dictionary }>,
  it: () => import('./dictionaries/it.json') as Promise<{ default: Dictionary }>,
  zh: () => import('./dictionaries/zh.json') as Promise<{ default: Dictionary }>,
  ru: () => import('./dictionaries/ru.json') as Promise<{ default: Dictionary }>,
  uk: () => import('./dictionaries/uk.json') as Promise<{ default: Dictionary }>,
  ca: () => import('./dictionaries/ca.json') as Promise<{ default: Dictionary }>,
  gl: () => import('./dictionaries/gl.json') as Promise<{ default: Dictionary }>,
  eu: () => import('./dictionaries/eu.json') as Promise<{ default: Dictionary }>,
  pt: () => import('./dictionaries/pt.json') as Promise<{ default: Dictionary }>,
  ja: () => import('./dictionaries/ja.json') as Promise<{ default: Dictionary }>,
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const dictionary = await loaders[locale]();
  return dictionary.default;
}

/**
 * Resolves a nested key ("nav.library") against a dictionary and applies
 * {placeholder} interpolation. Falls back to the key itself when missing,
 * so untranslated keys are visible during development and tests.
 */
export function translate(
  dictionary: Dictionary,
  key: string,
  params?: Record<string, string | number>
): string {
  let node: string | Dictionary | undefined = dictionary;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === undefined) break;
    node = node[part];
  }

  if (typeof node !== 'string') return key;

  if (!params) return node;
  return node.replace(/\{(\w+)\}/g, (match, name) =>
    params[name] !== undefined ? String(params[name]) : match
  );
}
