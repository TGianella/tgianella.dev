import type { Cells, Engine, EngineName } from "../types";

const TRAIL_LENGTH = 24;

/**
 * POC engine: a single cell bouncing diagonally, leaving a trail.
 * Validates animation timing, resize preservation, and theme reactivity.
 */
export class PocWalkerEngine implements Engine {
  readonly name: EngineName = "poc-walker";
  private cols = 0;
  private rows = 0;
  private x = 0;
  private y = 0;
  private dx = 1;
  private dy = 1;
  private readonly trail: number[] = [];
  private cells: Cells = new Uint8Array();

  async init(cols: number, rows: number, seed?: Cells): Promise<void> {
    this.cols = cols;
    this.rows = rows;
    this.cells = new Uint8Array(cols * rows);
    this.trail.length = 0;

    if (seed && seed.length === cols * rows) {
      // Re-absorb the previous engine's snapshot as a dying trail.
      // Find up to TRAIL_LENGTH alive cells to seed the tail; pick the walker's
      // current position at the last one (or center if seed is empty).
      for (let i = 0; i < seed.length && this.trail.length < TRAIL_LENGTH; i++) {
        if (seed[i]) this.trail.push(i);
      }
      if (this.trail.length > 0) {
        const last = this.trail[this.trail.length - 1];
        this.x = last % cols;
        this.y = Math.floor(last / cols);
      } else {
        this.center();
      }
    } else {
      this.center();
    }

    this.render();
  }

  resize(cols: number, rows: number) {
    const oldCols = this.cols;
    const remapped: number[] = [];
    if (oldCols > 0) {
      for (const idx of this.trail) {
        const r = Math.floor(idx / oldCols);
        const c = idx % oldCols;
        if (r < rows && c < cols) remapped.push(r * cols + c);
      }
    }
    this.cols = cols;
    this.rows = rows;
    this.x = Math.min(this.x, Math.max(0, cols - 1));
    this.y = Math.min(this.y, Math.max(0, rows - 1));
    this.trail.length = 0;
    for (const i of remapped) this.trail.push(i);
    if (this.trail.length === 0) this.trail.push(this.y * cols + this.x);
    this.cells = new Uint8Array(cols * rows);
    this.render();
  }

  step() {
    if (this.cols === 0 || this.rows === 0) return;
    this.x += this.dx;
    this.y += this.dy;
    if (this.x <= 0) { this.x = 0; this.dx = 1; }
    else if (this.x >= this.cols - 1) { this.x = this.cols - 1; this.dx = -1; }
    if (this.y <= 0) { this.y = 0; this.dy = 1; }
    else if (this.y >= this.rows - 1) { this.y = this.rows - 1; this.dy = -1; }

    this.trail.push(this.y * this.cols + this.x);
    if (this.trail.length > TRAIL_LENGTH) this.trail.shift();
    this.render();
  }

  snapshot(): Cells {
    return this.cells;
  }

  destroy() {
    this.cells = new Uint8Array();
    this.trail.length = 0;
  }

  private center() {
    this.x = Math.floor(this.cols / 2);
    this.y = Math.floor(this.rows / 2);
    this.trail.push(this.y * this.cols + this.x);
  }

  private render() {
    this.cells = new Uint8Array(this.cols * this.rows);
    for (const idx of this.trail) {
      if (idx >= 0 && idx < this.cells.length) this.cells[idx] = 1;
    }
  }
}
