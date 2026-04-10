type ScrollStrategy = {
  condition: (fromPath: string) => boolean;
  /** Captures the current scroll anchor. Returns a restore function, or null if nothing to save. */
  save: () => (() => void) | null;
};

function stripLocale(pathname: string) {
  return pathname.replace(/^\/(en|fr)/, '') || '/';
}

const strategies: ScrollStrategy[] = [];

/**
 * Register a scroll strategy for language switches.
 *
 * Strategy resolution: the LAST registered strategy whose condition matches
 * wins (via findLast). This means page-level scripts can override the default
 * by registering a more specific strategy after this module loads.
 *
 * Convention: load this module globally (BaseLayout). Load page-specific
 * strategies in the page's own <script> — Astro guarantees those run after
 * the global module, so they naturally take priority over the default.
 */
export function registerScrollStrategy(strategy: ScrollStrategy) {
  strategies.push(strategy);
}

let pendingRestore: (() => void) | null = null;

document.addEventListener('astro:before-preparation', (e) => {
  const event = e as Event & { from: URL; to: URL; navigationType: string };

  // Browser back/forward: history.state is already the destination entry (the browser
  // moves the history pointer before firing popstate). Astro would restore scroll via the
  // two-argument scrollTo(x, y), which respects CSS scroll-behavior: smooth (set by Open
  // Props normalize) and produces a visible animated scroll. Override with instant instead.
  if (event.navigationType === 'traverse') {
    const scrollX = (history.state?.scrollX as number) ?? 0;
    const scrollY = (history.state?.scrollY as number) ?? 0;
    pendingRestore = () => window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
    return;
  }

  const fromPath = stripLocale(event.from.pathname);
  const toPath   = stripLocale(event.to.pathname);
  if (fromPath !== toPath || event.from.pathname === event.to.pathname) return;

  // Try strategies in reverse registration order (most specific last, wins first).
  // A strategy returning null signals "not my case" — fall through to the next match.
  for (let i = strategies.length - 1; i >= 0; i--) {
    if (!strategies[i].condition(fromPath)) continue;
    const restore = strategies[i].save();
    if (restore !== null) { pendingRestore = restore; break; }
  }
});

document.addEventListener('astro:after-swap', () => {
  if (!pendingRestore) return;
  pendingRestore();
  pendingRestore = null;
});

// Default strategy: preserve pixel scroll on all non-overridden pages
registerScrollStrategy({
  condition: () => true,
  save: () => {
    const y = window.scrollY;
    return () => window.scrollTo({ top: y, behavior: 'instant' });
  },
});
