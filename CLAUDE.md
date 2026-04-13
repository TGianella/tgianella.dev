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

## JetBrains MCP (WebStorm)

This repository is developed in WebStorm with the JetBrains MCP server
enabled. The `mcp__webstorm__*` tools expose the IDE's semantic index,
TypeScript type resolution, diagnostics, and refactoring engine.

When the WebStorm MCP is connected, prefer it over `Grep`/`Glob` for
code navigation and symbol lookup — it understands the TypeScript/Astro
type graph rather than just matching text.

### Checking connectivity

Verify the connection before code work by calling a cheap probe tool such
as `mcp__webstorm__get_all_open_file_paths`. If the call fails or the
`mcp__webstorm__*` tools are absent (ToolSearch for "webstorm" returns
nothing), fall back to the built-in `Grep`/`Glob`/`Read` tools — this
codebase is small enough that text search remains reliable. Inform the
user that WebStorm MCP is offline so they can reconnect if they want.

### Tool catalog — what to use when

**Symbol search:**

* `mcp__webstorm__search_symbol` — find a TypeScript type, function, or
  component by name via the IDE index. Prefer over `Grep` when you want
  the canonical definition rather than every text occurrence (e.g.
  "where is `useTranslations` defined?").
* `mcp__webstorm__get_symbol_info` — signature, JSDoc, and declaring file
  for a symbol at a given file offset. Use as a follow-up to
  `search_symbol` to confirm the right overload or import.

**Text search:**

* `mcp__webstorm__search_in_files_by_text` — literal string search across
  the project, respecting IDE excludes (`node_modules/`, `dist/`).
* `mcp__webstorm__search_in_files_by_regex` — regex project-wide.
* `mcp__webstorm__search_text` / `mcp__webstorm__search_regex` —
  alternative project-wide forms.

These are useful when you know the exact string but want IDE-aware
exclusions (skips `dist/`, `.astro` build cache, etc.).

**File discovery:**

* `mcp__webstorm__find_files_by_glob` — glob inside the project tree,
  excluding `node_modules/` and `dist/` by default.
* `mcp__webstorm__find_files_by_name_keyword` — fuzzy filename search.
* `mcp__webstorm__search_file` — single-name file lookup.
* `mcp__webstorm__list_directory_tree` — structural overview of a subtree.

For simple cases the built-in `Glob` tool is fine. Prefer the WebStorm
variants when you need IDE-aware exclusions or fuzzy matching.

**File read/edit:**

* `mcp__webstorm__get_file_text_by_path` / `mcp__webstorm__read_file` —
  read through the IDE, capturing unsaved buffer state.
* `mcp__webstorm__replace_text_in_file` — exact-string edit; the IDE
  reindexes immediately.
* `mcp__webstorm__create_new_file` — create a file inside the project.
* `mcp__webstorm__reformat_file` — apply the project's code style.
  Useful after generating or heavily editing `.ts`/`.astro` files.
* `mcp__webstorm__open_file_in_editor` — surface a file to the user in
  the IDE.
* `mcp__webstorm__get_all_open_file_paths` — see what the user currently
  has open. Good for orienting at session start.

For plain-text files (`.md`, `.css`, `.json`, shell scripts) the
built-in `Read`/`Edit`/`Write` are perfectly fine and often simpler.

**Diagnostics:**

* `mcp__webstorm__get_file_problems` — TypeScript errors, warnings, and
  inspection results for a file. **Run this after editing `.ts`,
  `.astro`, or `.tsx` files** before reporting the task done — faster
  than `pnpm astro check` and catches inspection-level issues too.

**Refactoring:**

* `mcp__webstorm__rename_refactoring` — safe rename of a TypeScript
  symbol across every reference in `.ts`, `.tsx`, `.astro`, and `.mdx`
  files. Prefer this over `Edit ... replace_all` for anything that is
  a real symbol (component name, exported function, type alias). Text
  replacement silently misses re-exports and dynamic references.

**Build & run:**

* `mcp__webstorm__get_run_configurations` / `mcp__webstorm__execute_run_configuration` —
  list and run IDE run configurations (e.g. `pnpm dev`, `pnpm build`).
* `mcp__webstorm__build_project` — trigger an IDE build if one is
  configured. For this Astro project `pnpm build` via `Bash` is usually
  more direct.
* `mcp__webstorm__execute_terminal_command` — run a command in the IDE
  terminal panel. Prefer `Bash` for most shell work.

**Project structure:**

* `mcp__webstorm__get_project_modules` — list project modules.
* `mcp__webstorm__get_project_dependencies` — dependency graph from
  `package.json`. Useful before adding a new import to confirm the
  package is already installed.

### Workflow patterns

1. **Find where a component/function is defined** → `search_symbol`, then
   `get_symbol_info`. Skip `Grep` for this — it will also match import
   lines, comments, and string literals.
2. **Find all usages of a component** → `search_in_files_by_text` for the
   component name, or `search_in_files_by_regex` for import patterns.
3. **Rename a component or exported type** → `rename_refactoring`. Never
   use `replace_all` for symbol renames.
4. **Verify TypeScript correctness after an edit** → `get_file_problems`
   on the touched file. Only run `pnpm astro check` if you need a
   full-project type check.
5. **Orient at session start** → `get_all_open_file_paths` to see what
   the user is currently looking at.
6. **Read a file the user has open with unsaved changes** →
   `get_file_text_by_path` instead of `Read`, to capture buffer state.

### What stays with Bash / Grep / Glob

The WebStorm MCP does **not** replace these. Use built-in tools for:

* Git operations (`git status`, `git log`, `git diff`, `git commit`).
* Searching `.md`, `.css`, `.json`, and MDX content — the IDE index adds
  little value for prose and config.
* File operations outside the project root (`~/.claude/`, `/tmp/`).
* Shell pipelines (`jq`, `awk`, `sed`).
* When the WebStorm MCP is offline — fall back to `Grep`/`Glob`/`Read`
  freely; this codebase is small enough that text search is reliable.