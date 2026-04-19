import { CELL_SIZE, type GridSize, type Viewport } from "./types";

export interface LayoutSnapshot {
  viewport: Viewport;
  docHeight: number;
  scrollY: number;
  grid: GridSize;
  dpr: number;
}

export type LayoutListener = (
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

export class LayoutObserver {
  private readonly onChange: LayoutListener;
  private readonly onScroll: LayoutListener;
  private resizeObserver: ResizeObserver | null = null;
  private rafPending = false;
  private scrollRafPending = false;
  private last: LayoutSnapshot;

  constructor(onChange: LayoutListener, onScroll: LayoutListener) {
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

  /** Manually re-read after e.g. astro:after-swap. */
  refresh() {
    const next = readLayout();
    const prev = this.last;
    if (!sameGrid(next, prev) || next.viewport.h !== prev.viewport.h) {
      this.last = next;
      this.onChange(next, prev);
    } else {
      this.last = next;
    }
  }

  private readonly scheduleChange = () => {
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      const next = readLayout();
      const prev = this.last;
      const changed =
        !sameGrid(next, prev) ||
        next.viewport.h !== prev.viewport.h ||
        next.dpr !== prev.dpr;
      this.last = next;
      if (changed) this.onChange(next, prev);
    });
  };

  private readonly handleScroll = () => {
    if (this.scrollRafPending) return;
    this.scrollRafPending = true;
    requestAnimationFrame(() => {
      this.scrollRafPending = false;
      const prev = this.last;
      this.last = { ...prev, scrollY: window.scrollY };
      this.onScroll(this.last, prev);
    });
  };
}

function sameGrid(a: LayoutSnapshot, b: LayoutSnapshot): boolean {
  return a.grid.cols === b.grid.cols && a.grid.rows === b.grid.rows;
}
