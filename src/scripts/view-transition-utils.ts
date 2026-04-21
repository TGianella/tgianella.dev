export function stripLocale(pathname: string): string {
  return pathname.replace(/^\/fr(?=\/|$)/, "") || "/";
}

/** Assigns a numeric weight to each route to determine slide direction.
 *  Navigating to a heavier page slides forward, lighter slides back.
 *  Detail pages sit between their parent and the next section so that
 *  "blog -> article" and "article -> talks" both slide forward. */
export function getPageWeight(pathname: string): number {
  const cleanPathname = pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
  const p = stripLocale(cleanPathname);
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
