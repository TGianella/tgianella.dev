# Architecture

This document covers the non-obvious architectural decisions in this project.
For basic setup and structure, see the [README](../README.md).

## i18n

All routes are locale-prefixed (`/en/blog/...`, `/fr/talks/...`). The root `/`
redirects to `/en` via a 301.

Translation dictionaries live in `src/i18n/en.ts` and `fr.ts`. The English file
is the source of truth for the translation shape: `fr.ts` must satisfy
`typeof en` (enforced via `satisfies`), so adding a key to English without
adding it to French is a compile-time error.

`useTranslations(lang)` returns the full dictionary object (not individual
keys). There is no dynamic key lookup or interpolation system -- functions like
`readingTime(n)` are embedded directly in the dictionaries as methods.

Content collection IDs follow the pattern `{lang}/{slug}`. Both locales share
the same slug for a given piece of content, so switching languages on an article
page is just a path swap. The helper `slugOf(id, lang)` strips the lang prefix.

## Content model

Three collections are defined in `src/content.config.ts`, all using the `glob`
loader:

- **blog** -- MDX articles with `pubDate`, optional `thumbnail` (processed by
  Astro's image pipeline), `tags`, `draft` flag, optional `coAuthors` and
  `firstPublishedIn` attribution.
- **talks** -- Conference talks with an `events[]` array. Each event has a date,
  name, location, scope (`internal`/`regional`/`national`), optional YouTube
  `videoId`, and duration. The `featuredVideo` field overrides auto-detection of
  which video to embed.
- **gallery** -- Individual photos. Images are hosted externally on an R2-backed
  CDN (`images.tgianella.dev`), not processed by Astro's image pipeline.
  Thumbnails are derived by URL convention: `/photo.webp` becomes
  `/thumbnails/photo.webp` (see `thumbnailUrl()` in `src/content/utils.ts`).

### Talk sorting and timeline

Talks are sorted by their "debut event" -- the earliest event at the highest
scope (national > regional > internal). The `debutEvent()` function handles
this, ignoring upcoming events when past events exist (so a talk already given
at a regional meetup doesn't show an upcoming national conference as its debut).

The talks index page has a list/timeline tab view. The timeline groups talks by
event occurrence (same name + same day), so two talks given at the same
conference appear under a single event entry. Tab state is persisted in the URL
via `?tab=timeline`.

## View transitions

The site uses Astro's `<ClientRouter />` for SPA-style navigation with the View
Transition API.

There are two distinct transition modes:

### Page navigation (directional slides)

When navigating between different pages, the root element slides left or right.
Direction is determined by a **page weight** system
(`src/scripts/view-transition-utils.ts`): each route is assigned a numeric
weight (home=0, blog=10, blog article=15, talks=20, etc.), and navigating to a
heavier page slides forward, lighter slides back. Gallery photos use explicit
prev/next link detection instead of weights, since they have no inherent
ordering in the nav hierarchy.

### Language switch (named element morphing)

When switching languages (same path, different locale), the transition direction
is set to `"none"` (no root slide). Instead, individual elements marked with
`data-vt-name` attributes get their `view-transition-name` CSS property
activated, so they morph in place. This creates a smooth effect where nav links,
the page title, and the language toggle pill animate to their translated
equivalents.

The `data-vt-name` dance works in 4 phases:

1. `astro:before-preparation` -- detect lang switch, set names on old DOM
2. Browser captures old-state snapshot of named elements
3. `astro:after-swap` -- set names on new (swapped-in) DOM
4. `astro:page-load` -- clear all names to avoid conflicts on next navigation

Names are intentionally kept off elements between navigations to prevent
unrelated transitions from accidentally morphing elements that happen to share a
name.

## Scroll preservation

`src/scripts/scroll-preservation.ts` implements a pluggable strategy system for
preserving scroll position during language switches. The challenge: when you
switch from English to French on a blog article, the content length changes, so
a raw pixel offset would land you in the wrong spot.

The system uses a strategy registry with last-registered-wins semantics:

- **Default strategy** (registered in `scroll-preservation.ts`): preserves raw
  pixel offset. Works for most pages where content length is similar across
  languages.
- **Blog strategy** (registered in `blog-scroll.ts`): anchors to the prose
  child element visible at the top of the viewport, then restores to the
  same-index element in the new DOM. This survives content length changes because
  it's index-based rather than pixel-based.

Page-specific strategies are loaded in page `<script>` tags, which Astro
guarantees run after the global module, so they naturally override the default.

A separate handler for `traverse` navigations (browser back/forward) forces
`behavior: "instant"` to override Open Props normalize's `scroll-behavior:
smooth`, which would otherwise cause a visible animated scroll to the restored
position.

## Theme system

The theme toggle supports three states: system default, explicit light, and
explicit dark. It is implemented across three layers:

1. **`public/theme.js`** -- A blocking inline script that reads localStorage
   before first paint to prevent FOUC. It also hooks into
   `astro:after-swap` to reapply the theme after view transitions swap the DOM.
2. **CSS `light-dark()` + `@property`** -- Color tokens are defined once using
   `light-dark()`, with the browser resolving the correct value based on
   `color-scheme`. The `@property` declarations register custom properties with
   `syntax: "<color>"` so they can be animated with CSS transitions, producing a
   smooth color shift when the theme changes.
3. **Nav script** -- Handles the toggle button click, stores the preference in
   localStorage with a 1-week expiry. When the system theme changes (via OS
   settings), the stored preference is cleared and the site follows the system
   again.

The 1-week expiry ensures that if a user toggles the theme once on a sunny day
but normally prefers dark mode, they aren't stuck with it forever.

## 404 page

The 404 page is a standalone page that doesn't use `BaseLayout` or the i18n
system. It renders in English by default and uses an inline script to detect
`/fr` in the URL path and swap the text to French at runtime. This is
intentional: a 404 is served for any unmatched route, and the full layout/nav
would be misleading since the page doesn't exist. Keeping it standalone also
avoids depending on the Astro runtime for a static error page.

## CSS approach

- **Native CSS only**, no preprocessor. Design tokens come from Open Props.
- **BEM naming** for component classes, enforced by Stylelint
  (`block__element--modifier`).
- **Defensive CSS** plugin catches common CSS pitfalls (missing fallbacks,
  unsafe patterns).
- **Idiomatic property ordering** enforced by Stylelint.
- **Mobile-first** -- default styles target mobile, `@media (width >= ...)`
  enhances for larger screens.
- **Component-scoped styles** in `<style>` blocks within `.astro` files.
  Global styles are in `src/styles/global.css`.
- **`@property`-based color transitions** -- custom properties are registered
  with explicit types so the browser can interpolate them during theme switches.

## Accessibility

- Skip-to-content link on every page
- `aria-current="page"` on active nav links
- Mobile menu uses the Popover API with proper `aria-expanded`/`aria-controls`
- All images have alt text; decorative images use `role="presentation"`
- Lightbox traps focus and supports keyboard navigation
- Gallery arrows have `aria-keyshortcuts` annotations
- Heading anchor buttons have translated aria-labels
- `prefers-reduced-motion` is respected throughout (transitions, animations)
- ESLint jsx-a11y plugin enforces accessibility rules in templates

## Security headers

`public/_headers` sets strict security headers (CSP, HSTS, X-Frame-Options,
etc.). The CSP allowlists `images.tgianella.dev` for images and
`youtube.com` for video embeds. If a new external resource domain is added, the
CSP must be updated or it will be blocked.
