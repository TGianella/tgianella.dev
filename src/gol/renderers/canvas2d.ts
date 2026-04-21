import {
  CELL_SIZE,
  type Cells,
  type GridSize,
  type Renderer,
  type Viewport,
} from "../types";

const CELL_ALPHA = 0.35;

export class Canvas2DRenderer implements Renderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private dpr = 1;
  private viewport: Viewport = { w: 0, h: 0 };
  private grid: GridSize = { cols: 0, rows: 0 };

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.resizeBackingStore();
  }

  detach() {
    if (this.canvas) {
      // Shrink the backing store so the GPU texture (viewport × dpr, can be
      // ~10MB) isn't retained while GoL is off. The node itself persists
      // across navs via `transition:persist`.
      this.canvas.width = 0;
      this.canvas.height = 0;
    }
    this.canvas = null;
    this.ctx = null;
  }

  setGrid(size: GridSize) {
    this.grid = size;
  }

  draw(cells: Cells, scrollY: number, viewport: Viewport, cellColor: string) {
    if (!this.ctx || !this.canvas) return;
    if (
      viewport.w !== this.viewport.w ||
      viewport.h !== this.viewport.h ||
      (window.devicePixelRatio || 1) !== this.dpr
    ) {
      this.viewport = viewport;
      this.resizeBackingStore();
    }

    const ctx = this.ctx;
    const { cols, rows } = this.grid;
    const size = CELL_SIZE;

    ctx.clearRect(0, 0, viewport.w, viewport.h);
    ctx.globalAlpha = CELL_ALPHA;
    ctx.fillStyle = cellColor;

    // Which logical rows intersect the viewport?
    const firstRow = Math.max(0, Math.floor(scrollY / size));
    const lastRow = Math.min(
      rows - 1,
      Math.ceil((scrollY + viewport.h) / size),
    );
    if (firstRow > lastRow) return;

    for (let row = firstRow; row <= lastRow; row++) {
      const rowOffset = row * cols;
      const y = row * size - scrollY;
      for (let col = 0; col < cols; col++) {
        if (cells[rowOffset + col]) {
          ctx.fillRect(col * size, y, size, size);
        }
      }
    }
  }

  clear() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.viewport.w, this.viewport.h);
  }

  private resizeBackingStore() {
    if (!this.canvas || !this.ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = this.viewport.w || window.innerWidth;
    const h = this.viewport.h || window.innerHeight;
    this.viewport = { w, h };
    this.dpr = dpr;

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}
