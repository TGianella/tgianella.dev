import en from "./en.ts";
import fr from "./fr.ts";

export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

const dictionaries = { en, fr } satisfies Record<Locale, typeof en>;

export function useTranslations(lang: Locale) {
  return dictionaries[lang];
}

export function getLocalizedPath(path: string, lang: Locale): string {
  // Default locale (en) has no prefix; fr is prefixed. Accept pre-localized
  // inputs too: strip any existing /en or /fr so callers can pass either a
  // bare path ("/blog") or an already-localized one ("/fr/blog").
  const bare = path.replace(/^\/(en|fr)(?=\/|$)/, "") || "/";
  if (lang === "en") return bare;
  return bare === "/" ? "/fr/" : `/fr${bare}`;
}

/** Returns the alternate locale for use in hreflang / lang switcher */
export function getAlternateLocale(lang: Locale): Locale {
  return lang === "en" ? "fr" : "en";
}

/** Strips the language prefix from a content collection ID to get the slug */
export function slugOf(id: string, lang: Locale): string {
  return id.replace(`${lang}/`, "");
}

/** Static paths for top-level [...lang] routes.
 *  The default locale (en) uses `undefined` so the rest-param segment collapses
 *  to produce bare URLs like /blog; fr produces /fr/blog. */
export function getLocaleStaticPaths() {
  return [{ params: { lang: undefined } }, { params: { lang: "fr" as const } }];
}

/** Returns a long-style date formatter for the given locale */
export function getDateFormatter(lang: Locale): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(lang, { dateStyle: "long" });
}

/** Returns true if all events are in the future, or if there are no events */
export function isUpcoming(events: { date: Date }[]): boolean {
  return events.length === 0 || events.every((e) => e.date > new Date());
}
