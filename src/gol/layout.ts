import { CELL_SIZE, type GridSize, type Viewport } from "./types";

export interface LayoutSnapshot {
  viewport: Viewport;
  docHeight: number;
  scrollY: number;
  grid: GridSize;
  dpr: number;
}

export type LayoutChangeListener = (
  snapshot: LayoutSnapshot,
  previous: LayoutSnapshot,
) => void;

export function readLayout(): LayoutSnapshot {
  const viewport: Viewport = {
    w: window.innerWidth,
    h: window.innerHeight,
  };
  const docHeight = Math.max(document.documentElement.scrollHeight, viewport.h);
  const cols = Math.ceil(viewport.w / CELL_SIZE);
  const rows = Math.ceil(docHeight / CELL_SIZE);
  return {
    viewport,
    docHeight,
    scrollY: window.scrollY,
    grid: { cols, rows },
    dpr: window.devicePixelRatio || 1,
  };
}

function hasLayoutChanged(a: LayoutSnapshot, b: LayoutSnapshot): boolean {
  return (
    a.grid.cols !== b.grid.cols ||
    a.grid.rows !== b.grid.rows ||
    a.viewport.h !== b.viewport.h ||
    a.dpr !== b.dpr
  );
}

export class LayoutObserver {
  private readonly onChange: LayoutChangeListener;
  private readonly onScroll: () => void;
  private resizeObserver: ResizeObserver | null = null;
  private rafPending = false;
  private scrollRafPending = false;
  private last: LayoutSnapshot;

  constructor(onChange: LayoutChangeListener, onScroll: () => void) {
    this.onChange = onChange;
    this.onScroll = onScroll;
    this.last = readLayout();
  }

  start() {
    this.resizeObserver = new ResizeObserver(() => this.scheduleChange());
    this.resizeObserver.observe(document.documentElement);
    window.addEventListener("resize", this.scheduleChange, { passive: true });
    window.addEventListener("scroll", this.handleScroll, { passive: true });
  }

  stop() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener("resize", this.scheduleChange);
    window.removeEventListener("scroll", this.handleScroll);
  }

  get current(): LayoutSnapshot {
    return this.last;
  }

  /** Manually re-read, e.g. after astro:after-swap. */
  refresh() {
    const next = readLayout();
    const prev = this.last;
    this.last = next;
    if (hasLayoutChanged(next, prev)) this.onChange(next, prev);
  }

  private readonly scheduleChange = () => {
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      const next = readLayout();
      const prev = this.last;
      this.last = next;
      if (hasLayoutChanged(next, prev)) this.onChange(next, prev);
    });
  };

  private readonly handleScroll = () => {
    if (this.scrollRafPending) return;
    this.scrollRafPending = true;
    requestAnimationFrame(() => {
      this.scrollRafPending = false;
      this.last = { ...this.last, scrollY: window.scrollY };
      this.onScroll();
    });
  };
}
