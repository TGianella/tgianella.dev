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

/** Strips the language prefix from a content collection ID to get the slug */
export function slugOf(id: string, lang: Locale): string {
  return id.replace(`${lang}/`, '');
}

/** Static paths for top-level [lang] routes */
export function getLocaleStaticPaths() {
  return locales.map(lang => ({ params: { lang } }));
}

/** Returns true if all events are in the future, or if there are no events */
export function isUpcoming(events: { date: Date }[]): boolean {
  return events.length === 0 || events.every(e => e.date > new Date());
}
