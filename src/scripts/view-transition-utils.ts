export function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|fr)/, "") || "/";
}

export function getPageWeight(pathname: string): number {
  const p = stripLocale(pathname);
  if (p === "/") return 0;
  if (p === "/blog") return 10;
  if (p === "/talks") return 20;
  if (p === "/blue-screens") return 30;
  if (p.startsWith("/blog/")) return 15;
  if (p.startsWith("/talks/")) return 25;
  if (p.startsWith("/blue-screens/")) return 35;
  return -1;
}

/** Determines the transition direction between two pages.
 *  Gallery navigation uses explicit prev/next hrefs (resolved from the DOM by the caller).
 *  Everything else uses page weight comparison. */
export function resolveDirection(
  from: { pathname: string },
  to: { pathname: string },
  galleryNav?: { prevHref?: string; nextHref?: string },
): string {
  const fromPath = stripLocale(from.pathname);
  const toPath = stripLocale(to.pathname);

  if (
    fromPath.startsWith("/blue-screens/") &&
    toPath.startsWith("/blue-screens/") &&
    fromPath !== toPath
  ) {
    if (to.pathname === galleryNav?.nextHref) return "forward";
    if (to.pathname === galleryNav?.prevHref) return "back";
    return "none";
  }

  const fromW = getPageWeight(from.pathname);
  const toW = getPageWeight(to.pathname);
  if (fromW !== -1 && toW !== -1 && fromW !== toW) {
    return toW > fromW ? "forward" : "back";
  }
  return "none";
}
