# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository. For in-depth architectural decisions, see
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Commands

```bash
pnpm dev          # dev server at localhost:4321
pnpm build        # production build to ./dist/
pnpm preview      # preview the production build
pnpm astro check  # TypeScript + Astro type checking
pnpm test         # run unit tests (node:test)
pnpm lint         # ESLint
pnpm lint:style   # Stylelint
pnpm build:wasm   # local-only: rebuild vendor/gol-wasm/gol.{js,wasm} from
                  # the wasm-game-of-life Rust crate. Requires rustup +
                  # wasm-pack. Not part of `pnpm build` — artifacts are
                  # committed to the repo so CI doesn't need Rust. Run
                  # after touching the crate.
```

Tests use Node's built-in test runner (`node:test`) and live next to the code
they test (`*.test.ts`).

## Architecture overview

This is an **Astro 6** personal site with MDX and full i18n (English + French).

### Routing & i18n

All content routes are prefixed with `[lang]`: `/en/blog/...`, `/fr/talks/...`.
The root `/` redirects to `/en`.

- `src/i18n/en.ts` is the source of truth for translations. `fr.ts` must
  satisfy `typeof en` (enforced via `satisfies`), so missing keys are
  compile-time errors.
- `useTranslations(lang)` returns the full dictionary object.
- Every visible string must use the translation system -- never hardcode text.

### Content collections

Three collections in `src/content.config.ts`:

- **blog** -- `src/content/blog/{lang}/{slug}.mdx`
- **talks** -- `src/content/talks/{lang}/{slug}.mdx`
- **gallery** -- `src/content/gallery/{lang}/{slug}.mdx`

Content IDs follow `{lang}/{slug}`. Both locales share the same slug. Use
`slugOf(id, lang)` to extract the slug.

### Styling

Native CSS only. Design tokens from **Open Props**. Key custom tokens defined in
`src/styles/global.css`:

| Token                   | Purpose                       |
| ----------------------- | ----------------------------- |
| `--text-1` / `--text-2` | Primary / secondary text      |
| `--surface-1/2/3`       | Background layers             |
| `--border`              | Borders                       |
| `--color-brand`         | Accent color                  |
| `--content-width`       | Prose max-width (68ch)        |
| `--layout-width`        | Page max-width (64rem)        |
| `--page-padding`        | Responsive horizontal padding |

Rules: mobile-first (default styles for mobile, `@media (width >= ...)` to
enhance), BEM class names (enforced by Stylelint), component-scoped `<style>`
blocks in `.astro` files.

### Layout

`BaseLayout.astro` is the shared shell (`<head>`, Nav, `<main>`, footer).
Requires `lang`, `description`, optional `title` and `canonicalPath`.

`MainContent.astro` wraps page content in a centered, padded column.

### Key systems

- **View transitions** -- Directional page slides (via page weight) + named
  element morphing on language switches. See `src/scripts/view-transitions.ts`
  and `src/scripts/view-transition-utils.ts`.
- **Scroll preservation** -- Pluggable strategy system for keeping scroll
  position during language switches. See `src/scripts/scroll-preservation.ts`.
- **Theme** -- Three-layer system: blocking `public/theme.js` for FOUC
  prevention, CSS `light-dark()` + `@property` for animated color transitions,
  Nav script for toggle logic with 1-week localStorage expiry.
- **Background Game of Life** -- Opt-in background animation wired into
  `BaseLayout.astro` via `GameOfLifeToggle` + `DevHud`. Self-contained in
  `src/gol/`. See `src/gol/README.md` for module layout, lifecycle, and
  extension points.

### Gotchas

- Gallery images are hosted on `images.tgianella.dev` (R2 CDN), not in the
  repo. Thumbnails are derived by URL convention (`thumbnailUrl()` in
  `src/content/utils.ts`).
- `public/_headers` has a strict CSP. Adding a new external resource domain
  (images, scripts, frames) requires updating the CSP or it will be silently
  blocked.
- The 404 page is standalone (no BaseLayout) and uses an inline script for
  French translation. See comment in `src/pages/404.astro`.
- `vendor/gol-wasm/` holds prebuilt Rust artifacts committed to the repo so
  CI doesn't need Rust. `src/gol/engines/index.ts` falls back to the TS
  engine if they're missing. Rebuild with `pnpm build:wasm`. See
  `src/gol/README.md` for details.

## JetBrains MCP (WebStorm)

This repository is developed in WebStorm with the JetBrains MCP server
enabled. The `mcp__webstorm__*` tools expose the IDE's semantic index,
TypeScript type resolution, diagnostics, and refactoring engine.

When the WebStorm MCP is connected, prefer it over `Grep`/`Glob` for
code navigation and symbol lookup -- it understands the TypeScript/Astro
type graph rather than just matching text.

### Checking connectivity

Verify the connection before code work by calling a cheap probe tool such
as `mcp__webstorm__get_all_open_file_paths`. If the call fails or the
`mcp__webstorm__*` tools are absent (ToolSearch for "webstorm" returns
nothing), fall back to the built-in `Grep`/`Glob`/`Read` tools -- this
codebase is small enough that text search remains reliable. Inform the
user that WebStorm MCP is offline so they can reconnect if they want.

### Quick reference

| Task                        | Tool                                                    |
| --------------------------- | ------------------------------------------------------- |
| Find a symbol definition    | `search_symbol` then `get_symbol_info`                  |
| Find all usages             | `search_in_files_by_text` or `search_in_files_by_regex` |
| Rename a symbol             | `rename_refactoring` (never `replace_all` for symbols)  |
| Check for errors after edit | `get_file_problems` on the touched file                 |
| Read unsaved buffer         | `get_file_text_by_path` instead of `Read`               |
| See what user has open      | `get_all_open_file_paths`                               |

### What stays with built-in tools

- Git operations
- Searching `.md`, `.css`, `.json`, MDX prose
- File operations outside the project root
- Shell pipelines
- When WebStorm MCP is offline
