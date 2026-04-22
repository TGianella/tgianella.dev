/** Normalizes a pathname for route comparison:
 *   - strips the `/fr` locale prefix (the default `en` locale has no prefix)
 *   - strips any trailing slash, so `/talks` and `/talks/` compare equal
 *  Root (`/`, `/fr`, `/fr/`) always normalizes to `/`.
 *
 *  Needed because Astro's directory-format build serves pages with trailing
 *  slashes in prod but `<a href>` values in the app are authored without them;
 *  without normalization, `event.from.pathname` and `event.to.pathname` can
 *  differ only in a trailing slash and break lang-switch / scroll-restore
 *  detection. */
export function stripLocale(pathname: string): string {
  const withoutLocale = pathname.replace(/^\/fr(?=\/|$)/, "");
  const withoutTrailingSlash = withoutLocale.replace(/\/$/, "");
  return withoutTrailingSlash || "/";
}
