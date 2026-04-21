# Background Game of Life

Conway's Game of Life rendered as a full-page background. Opt-in via the
toggle button, persistent across client-side navigations, theme-aware, and
disabled under `prefers-reduced-motion`.

This directory is self-contained: the rest of the site only touches it
through `window.__gol` (populated by `install()` in `index.ts`) and the two
Astro components that wire it into the layout — `GameOfLifeToggle.astro` and
`DevHud.astro`. Adding an engine, swapping the renderer, or changing the
automaton rules does not require edits outside of `src/gol/` and
`vendor/gol-wasm/`.

## Architecture at a glance

```
                BaseLayout.astro   declares <canvas> + mounts the two UI bits
                  ├── <canvas #gol-canvas transition:persist>
                  ├── <GameOfLifeToggle>  calls install() on first click
                  └── <DevHud>            reads stats via onStats() — dev-only

                             │ (both touch the module only via)
                             ▼
                       window.__gol     ← published by index.ts's install()
                             │
                             ▼
                       Controller       (controller.ts)
                             │  owns and coordinates:
     ┌─────────┬──────────┬──┴────────┬──────────────┐
     ▼         ▼          ▼           ▼              ▼
 Scheduler  Layout-     Theme-     Canvas2D-      Engine
            Observer    Observer   Renderer       (via engines/index.ts factory)
                                                      │
                                           ┌──────────┴──────────┐
                                           ▼                     ▼
                                       TsEngine              WasmEngine
                                   (engines/ts.ts)        (engines/wasm.ts)
                                                                  │
                                                                  ▼
                                                          vendor/gol-wasm/
                                                          (gol.js + gol_bg.wasm)

  patterns.ts   — random(cols, rows, density) seed, used by Controller
  types.ts      — Engine / Renderer / Cells / GridSize / Viewport contracts
```

**Reading the diagram.** `Controller` is the hub. Everything above it is
glue into the Astro site; everything below it does one bounded job and is
only invoked through the controller. Data types flowing between modules
are defined in `types.ts`.

## Module reference

Each module is one file doing one job. Below: the role, the APIs it uses,
and how it cooperates with the rest.

### `index.ts` — public API

The only entry point into the module from the outside. Declares the
`window.__gol: GolApi` global, exposes an idempotent `install()` that
creates a singleton `Controller` on first call, and returns a narrow
`GolApi` with `enable / disable / isEnabled / getStats / onStats`.
Consumers never reach the `Controller` class directly — this keeps the
DOM-facing surface in one file and makes internal refactors free as long
as the `GolApi` contract is preserved. `install()` is called lazily by
`GameOfLifeToggle.astro`'s first click, keeping the module out of the
critical path for visitors who never enable the background.

### `controller.ts` — the orchestrator

Single owner of lifecycle, DOM side-effects, and cross-subsystem glue.
Instantiates a `Canvas2DRenderer`, a `Scheduler`, a `LayoutObserver`, and
a `ThemeObserver` up front; creates the `Engine` lazily on `enable()`
(async because the wasm engine has to be fetched).

On `enable()`: guards on `matchMedia("(prefers-reduced-motion: reduce)")`,
finds or creates `<canvas id="gol-canvas">`, attaches the renderer, mounts
an off-DOM color probe so the renderer can read `--text-1`, snapshots
layout, initialises the engine with a `random` seed, starts observers and
the scheduler, subscribes to `astro:before-swap` + `astro:after-swap` via
a single `AbortController`, and sets `data-gol="on"` on `<html>` so site
CSS can react.

On `disable()`: tears down observers, aborts the swap-event listeners,
destroys the engine and color probe, removes the `<html data-gol>` flag,
emits a zeroed stats frame so overlays (like `DevHud`) can clear, and
schedules the renderer `detach()` after `FADE_OUT_MS` so the last frame
stays visible while the CSS opacity transition plays (see "Fade
transition" below).

Key internal methods:

- **`tick()`** — scheduler's simulation callback: `engine.step()` + redraw.
- **`redraw()`** — re-reads the cell color from the probe (see theme note
  below) and calls `renderer.draw(snapshot, scrollY, viewport, color)`.
- **`handleLayoutChange(next, prev)`** — on grow, calls `engine.resize`
  (which preserves the overlap region) then `engine.paintRegion` with a
  fresh `random` fill for the newly revealed strip. On shrink, just
  `engine.resize`.
- **`handleAfterSwap()`** — Astro soft-navigation hook. The color probe
  may have been torn out along with the swapped body; reattach, refresh
  layout, redraw.
- **`handleBeforeSwap(e)`** — runs _before_ Astro commits the new
  document. Pre-sets `data-gol="on"` on `e.newDocument.documentElement`
  so the `ClientRouter`'s attribute diff is a no-op; without this the
  canvas opacity transition would fire on every soft nav (see "Fade
  transition" below).
- **`getStats()` / `onStats()`** — pull-and-push stats for overlays.

### `scheduler.ts` — the clock

A `requestAnimationFrame` loop with two callbacks: `onTick` fires at most
every `1000 / fps` ms (10 Hz for the simulation), `onFrame` fires every
rAF (used for stats emission and fps measurement). Decoupling the two
lets the simulation run at a legible pace while overlays and fps counting
stay frame-accurate.

Fps is measured as a rolling 1-second window
(`frameCount * 1000 / elapsed`). Listens to `visibilitychange`: when the
tab hides, `cancelAnimationFrame` stops the loop but `running` stays
true, so the next "visible" event reseeds timers and resumes — cheaper
than stop+start and keeps background tabs from burning CPU.

Owns no DOM. Pure timing.

### `layout.ts` — the viewport observer

Computes a `LayoutSnapshot` (viewport, doc height, scrollY, grid size,
dpr) from the live DOM and exposes both a one-shot `readLayout()` and a
stateful `LayoutObserver`.

- **Grid sizing.** `cols = ceil(viewport.w / CELL_SIZE)`,
  `rows = ceil(max(docHeight, viewport.h) / CELL_SIZE)`. The grid covers
  the whole document, not just the viewport; the renderer decides what
  intersects.
- **Sources of truth.** `ResizeObserver` on `<html>` catches font-load
  reflows, content height changes, and lazily-hydrated MDX;
  `window.resize` catches viewport changes; `window.scroll` covers
  scrolling. All three go through `requestAnimationFrame` debounces so a
  burst of events coalesces into one snapshot + one callback.
- **Change vs. scroll split.** `onChange` fires only when `cols`, `rows`,
  `viewport.h`, or `dpr` actually differ (so scrolling never triggers
  `handleLayoutChange`). Scroll has its own cheap callback that only
  triggers a redraw.
- **`refresh()`** — forced re-read, used on `astro:after-swap` when the
  whole `<body>` may have changed height in a single frame.

### `theme.ts` — the color probe

Canvas 2D's `fillStyle` can't parse `light-dark(...)` — the form the site
uses for `--text-1`. Workaround: inject a zero-size hidden `<div>` whose
CSS `color` is `var(--text-1)`, and read its resolved `color` via
`getComputedStyle`. The resolved value is always an `rgb`/`oklch` string
the canvas accepts.

`ThemeObserver` fires its callback when `data-theme` on `<html>` changes
(via `MutationObserver` with `attributeFilter: ["data-theme"]`) or when
`prefers-color-scheme` changes (via `matchMedia`). The controller does
_not_ cache the color in the observer callback; see the "Theme
transitions" note below for why.

### `patterns.ts` — seed generators

Tiny factory module. Currently exports `random(cols, rows, density)`,
which returns a fresh `Uint8Array` filled with 0/1 at the given alive
density. New seeds (gliders, methuselahs, symmetric patterns) belong
here.

### `types.ts` — shared contracts

Defines `Engine` and `Renderer` — the interfaces the controller programs
against — plus supporting shapes (`Cells = Uint8Array`, `GridSize`,
`Viewport`, `ControllerStats`, `EngineName`) and the `CELL_SIZE` constant
(40px) used by both layout math and the renderer. Any swap-in engine or
renderer must satisfy these interfaces; this file is the module's
internal contract.

### `engines/index.ts` — the engine factory

Single async function `getEngine(name)`. For `"wasm"`, dynamically
imports the wasm wrapper, calls `loadWasm()` eagerly so fetch /
instantiation / CSP failures surface _before_ the controller commits,
and returns a `WasmEngine`. Any thrown error falls back to a `TsEngine`
with a dev-only `console.warn`. For `"ts"`, returns `TsEngine` directly.

The dynamic `import("./wasm")` lets the bundler code-split the wasm
wrapper and the `.wasm` asset out of the main bundle; visitors who never
enable the background never download either.

### `engines/ts.ts` — the pure-TypeScript engine

Conway's Game of Life on a torus, double-buffered. Holds two
`Uint8Array`s (`read` and `write`) sized `cols * rows`. Each `step`
iterates every cell, sums its 8 toroidal neighbors from `read`, applies
Conway's rules, writes into `write`, then swaps buffers — just pointer
reassignment, no per-step allocation.

- **Indexing.** Row-major: `cell(r, c) = buffer[r * cols + c]`. Every
  engine in this module honors this; `paintRegion` and the renderer
  depend on it.
- **Torus edges.** Branchless expressions:
  `r === 0 ? rows - 1 : r - 1`, etc.
- **`resize(cols, rows)`** — allocates new buffers of the new size and
  copies the overlap region. Cells outside the overlap drop (shrink) or
  start dead (grow).
- **`paintRegion()`** — writes a rectangle into the _read_ buffer,
  clipping out-of-bounds indices.
- **`snapshot()`** — returns the `read` buffer directly (no copy);
  callers must not mutate it.

Zero dependencies; always available; the fallback engine.

### `engines/wasm.ts` — the wasm engine wrapper

Thin adapter over the `wasm-game-of-life` Rust crate shipped as
`vendor/gol-wasm/`. Loads two artifacts via dynamic import:

- `vendor/gol-wasm/gol.js` — wasm-bindgen glue
- `vendor/gol-wasm/gol_bg.wasm?url` — the binary; Vite's `?url` suffix
  emits it as a hashed asset and returns a URL the glue's `default(url)`
  instantiator consumes

`loadWasm()` is memoised in a module-level `loadPromise` so the binary
is fetched once per page load. On transient failure the latch is cleared
so a subsequent call can retry.

`WasmEngine` drives a `Universe` from the crate (via wasm-bindgen):

- **`init()`** — calls `Universe.new(blank=true, cols, rows)`, the static
  factory wasm-bindgen emits for the crate's plain `pub fn new`. Using
  `new Universe()` would skip the `__wbg_ptr` setup. Then
  `set_cells_from_bytes(seed)` paints the initial state.
- **`snapshot()`** — reads a raw pointer via `universe.cells()`, builds a
  `Uint8Array` view over `memory.buffer`, and `.slice()`s it to detach
  from wasm memory. The slice matters: if wasm grows its memory (which
  detaches the original `ArrayBuffer`), any held view would go stale.
- **`paintRegion()`** — direct memory write through a `Uint8Array` view
  over wasm memory, same row-major indexing as the TS engine.
- **`destroy()`** — `universe.free()` so wasm-bindgen drops the Rust-side
  allocation.

CSP note: wasm instantiation requires `'wasm-unsafe-eval'` in
`public/_headers`.

### `renderers/canvas2d.ts` — the Canvas 2D renderer

Owns the `<canvas>` element's 2D context and bitmap sizing. Called by the
controller every tick plus on scroll/layout events.

- **`attach(canvas)`** — grabs a `'2d'` context (`alpha: true`) and sizes
  the backing store for the current viewport and device pixel ratio.
  Backing store in _device pixels_, CSS size in _logical pixels_,
  `setTransform(dpr, 0, 0, dpr, 0, 0)` so draw calls use logical coords.
- **`draw(cells, scrollY, viewport, cellColor)`** — clears the viewport,
  sets `globalAlpha = 0.35` and `fillStyle = cellColor`, then computes
  `firstRow / lastRow` from `scrollY` and `scrollY + viewport.h` and
  iterates only rows in that range. Dead cells skip `fillRect`. This is
  the primary performance win: on a long page the document grid can be
  thousands of rows but only a few dozen paint per frame.
- **DPR changes.** Re-checks `devicePixelRatio` on every `draw` and
  resizes the backing store when it changes (e.g. dragging the window
  between monitors).
- **`clear()` / `detach()`** — reset state on disable so the canvas
  doesn't keep a stale frame. `detach()` also shrinks the backing store
  to `0 × 0` so the GPU texture (viewport × dpr, can be ~10 MB) isn't
  retained while GoL is off. The `<canvas>` node itself persists across
  navs via `transition:persist`; only the bitmap is released.

Replacing Canvas 2D with WebGL/WebGPU means implementing the `Renderer`
interface in `types.ts` and changing one `new Canvas2DRenderer()` in
`controller.ts`.

## Lifecycle

`install()` is called lazily by `GameOfLifeToggle.astro` on first click. It
creates a singleton `Controller` and publishes `window.__gol`. Toggling on
triggers `Controller.enable()`:

1. Bail out if `prefers-reduced-motion: reduce` matches.
2. Get-or-create the persistent `<canvas id="gol-canvas">` (placed in
   `BaseLayout.astro` with `transition:persist` so it survives view
   transitions).
3. Attach the renderer, mount the theme color probe, take a layout snapshot,
   and ask the engine factory for the requested engine.
4. Start the layout + theme observers, subscribe to `astro:before-swap` +
   `astro:after-swap` (via one `AbortController`), set `data-gol="on"`
   on `<html>`, and start the scheduler.

`disable()` is the symmetric teardown. Both are idempotent. On
`disable()` the renderer's `detach()` is deferred by `FADE_OUT_MS` so
the last simulation frame stays visible while the CSS opacity
transition plays (see "Fade transition" below).

## Integration notes

**Canvas persistence.** The canvas element is declared in `BaseLayout.astro`
with `transition:persist="gol-canvas"` so Astro's `ClientRouter` keeps the
same DOM node (and its bitmap) across soft navigations. Without persistence
the grid would flicker black every page change.

**Viewport-only painting.** The grid is sized to the whole document, but the
renderer only iterates rows intersecting the current viewport. Combined with
cell size `CELL_SIZE` (40px) and an alpha of `0.35`, this keeps painting
cheap even on long pages.

**Growing the universe.** When the viewport widens or the document
lengthens, `Controller.handleLayoutChange` resizes the engine (which
preserves the overlap region) and paints random cells into the newly
revealed strip. Shrinking is a pure resize — the engine drops the outside
cells.

**Theme transitions.** `--text-1` is registered via `@property` so it
interpolates on theme swap. The controller re-reads the probe's computed
color inside `redraw()` on every frame instead of caching it on the
`ThemeObserver` callback — that callback fires synchronously with the
`data-theme` attribute change, before the transition has advanced, so
caching there would latch the old theme's color.

**Scheduler.** Ticks and frames are decoupled: `onTick` drives the
simulation at `TICK_HZ` (10 Hz), `onFrame` runs every rAF (used for stats
emission and fps counting). `visibilitychange` cancels the rAF without
stopping the scheduler, so tabs in the background don't burn CPU.

**Astro soft nav.** On `astro:after-swap` the controller reattaches the
color probe if it was torn out of the new DOM, refreshes the layout
snapshot, and redraws. The canvas itself survives via `transition:persist`.
The controller also listens to `astro:before-swap` and pre-sets
`data-gol="on"` on the incoming document's `<html>`; `ClientRouter`
copies `<html>` attributes from the new page onto the live one, so
without this pre-set the runtime-set flag would be wiped mid-nav and
the canvas opacity transition would fire on every navigation.
`before-swap` is used instead of `after-swap` because `handleAfterSwap`
calls `layout.refresh()` → `readLayout()` → reads `scrollHeight`, which
forces a style recalc that would observe the missing attribute before
it could be restored.

**Fade transition.** `#gol-canvas` fades between `opacity: 0` and
`opacity: 1` driven by `:root[data-gol="on"]` (in
`src/styles/global.css`). The transition is gated by
`@media (prefers-reduced-motion: no-preference)` and uses
`--duration-moderate-2` (260 ms). `disable()` defers
`renderer.detach()` by the same `FADE_OUT_MS` constant so the last
simulation frame stays painted while CSS fades it out; tearing down
the bitmap synchronously would make cells pop off instead. `enable()`
clears any pending fade-out timer so a rapid off→on flip resumes
cleanly instead of detaching mid-transition.

**Toggle presentation.** `GameOfLifeToggle.astro` renders one `<button>`
with two CSS dressings. Hover-capable viewports get the slide-out tab
anchored to the top-right (hidden until `:hover` or `:focus-visible`).
Hoverless viewports get a small muted icon in the bottom-right corner —
~36×36 hit target, no tab chrome — so touch users can reach it without
putting a decorative control in the reading flow. The split lives in the
component's `<style>` block, gated by `@media (hover: hover)`.

**DevHud is dev-only.** `BaseLayout.astro` wraps `<DevHud />` in
`import.meta.env.DEV`, so it's tree-shaken out of production builds. The
component itself is unchanged — it's still there in `pnpm dev` for
engine/fps/grid/alive-cell debugging. Production users never see it and
never load its script.

## Extension points

**New engine.** Implement `Engine` (`types.ts`), register its name in
`EngineName`, and teach `engines/index.ts` how to load it. The ts/wasm
engines both use `Cells = Uint8Array` with row-major `r * cols + c`
indexing; honor that so `paintRegion` stays portable.

**New renderer.** Implement `Renderer` (`types.ts`) and swap the
instantiation in `Controller`'s constructor. The canvas is a single
full-viewport overlay owned by the renderer via `attach/detach`.

**New seed / pattern.** Add an exported function to `patterns.ts`
returning a `Cells`. The controller's current seed is `random(…, 0.15)`.

**New controls.** Publish methods on `GolApi` (`index.ts`), not directly
on the `Controller` class — that keeps the DOM-facing surface in one file.
`onStats` is the pull-subscribe path for UI overlays like the DevHud.

## Testing

`engines/ts.test.ts` covers the simulation rules (block still life,
blinker period, glider translation, torus wraparound, resize overlap) —
these are the highest-value checks because they lock in correctness
regardless of renderer or scheduler changes.

The wasm engine is exercised implicitly by the factory fallback; a
byte-for-byte cross-engine contract test used to live next to the ts
tests and can be reintroduced if engines diverge in practice.

## WASM build

`vendor/gol-wasm/` holds the prebuilt artifacts (`gol.js`, `gol_bg.wasm`,
`.d.ts`). They are committed so CI and fresh clones don't need a Rust
toolchain; `engines/index.ts` falls back to the ts engine if the import
fails. Run `pnpm build:wasm` after touching the upstream crate — it shells
out to `wasm-pack` and copies the output into `vendor/gol-wasm/`. The CSP
in `public/_headers` includes `'wasm-unsafe-eval'` for instantiation.
