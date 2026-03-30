import en from './en';
import fr from './fr';

export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

const dictionaries = { en, fr } satisfies Record<Locale, typeof en>;

export function useTranslations(lang: Locale) {
  return dictionaries[lang];
}

export function getLocalizedPath(path: string, lang: Locale): string {
  // Strip any existing locale prefix, then prepend the target locale
  const stripped = path.replace(/^\/(en|fr)/, '');
  return `/${lang}${stripped.startsWith('/') ? '' : '/'}${stripped}`;
}

/** Returns the alternate locale for use in hreflang / lang switcher */
export function getAlternateLocale(lang: Locale): Locale {
  return lang === 'en' ? 'fr' : 'en';
}
