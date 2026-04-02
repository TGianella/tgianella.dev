# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # dev server at localhost:4321
pnpm build        # production build to ./dist/
pnpm preview      # preview the production build
pnpm astro check  # TypeScript + Astro type checking
```

There are no tests.

## Architecture

This is an **Astro 6** personal site with React (for interactive components), MDX, and full i18n support (English + French).

### Routing & i18n

All content routes are prefixed with `[lang]`: `/en/blog/...`, `/fr/talks/...`, etc. The root `/` redirects to `/en`. The `src/i18n/` directory has:
- `en.ts` / `fr.ts` — typed translation dictionaries
- `utils.ts` — `useTranslations(lang)`, `getLocalizedPath()`, `getAlternateLocale()`

`fr.ts` must satisfy `typeof en` (enforced via `satisfies`), so `en.ts` is the source of truth for the translation shape.

### Content Collections

Three collections defined in `src/content.config.ts`:
- **blog** — `src/content/blog/{lang}/{slug}.mdx` — articles with `pubDate`, optional `cover` (R2 URL), `tags`, `draft`
- **talks** — `src/content/talks/{lang}/{slug}.mdx` — conference talks with `events[]`, optional `slides`/`featuredVideo`
- **gallery** — `src/content/gallery/{lang}/{slug}.mdx` — photo albums with `photos[]` (R2 URLs + dimensions)

Content file IDs are structured as `{lang}/{slug}`. Dynamic pages extract the locale by splitting on the first `/`:
```ts
const [lang, ...slugParts] = post.id.split('/');
```

Both `en` and `fr` versions of a piece of content share the same slug.

### Styling

Native CSS only — no preprocessor. Design tokens come from **Open Props** (`open-props/style` + `open-props/normalize`). Custom semantic tokens are defined in `src/styles/global.css`:

| Token | Purpose |
|---|---|
| `--text-1` / `--text-2` | Primary / secondary text |
| `--surface-1/2/3` | Background layers |
| `--border` | Borders |
| `--color-brand` | Accent (`--indigo-6` light, `--indigo-4` dark) |
| `--content-width` | Prose max-width (68ch) |
| `--layout-width` | Page max-width (64rem) |
| `--page-padding` | Responsive horizontal padding |

Dark mode is handled via `@media (prefers-color-scheme: dark)` overriding the custom tokens.

Component-scoped styles live in `<style>` blocks inside `.astro` files. The `.prose` class (defined globally) styles MDX content.

### Layout

`BaseLayout.astro` is the single shared layout. It handles the `<head>` (SEO, OG, hreflang), `Nav`, `<main>`, and `<footer>`. It requires `lang`, `title`, `description`, and an optional `canonicalPath` (path without locale prefix).
