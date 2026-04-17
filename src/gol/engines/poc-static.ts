import type { Cells, Engine, EngineName } from "../types";

/**
 * POC engine: paints a static checkerboard (or the provided seed).
 * step() is a no-op — validates renderer + scroll-offset math.
 */
export class PocStaticEngine implements Engine {
  readonly name: EngineName = "poc-static";
  private cols = 0;
  private rows = 0;
  private cells: Cells = new Uint8Array();

  async init(cols: number, rows: number, seed?: Cells): Promise<void> {
    this.cols = cols;
    this.rows = rows;
    this.cells =
      seed && seed.length === cols * rows
        ? new Uint8Array(seed)
        : this.makeCheckerboard(cols, rows);
  }

  resize(cols: number, rows: number) {
    const next = this.makeCheckerboard(cols, rows);
    // Copy overlap from the previous state so a hot-swap seed is preserved.
    const copyCols = Math.min(cols, this.cols);
    const copyRows = Math.min(rows, this.rows);
    for (let r = 0; r < copyRows; r++) {
      for (let c = 0; c < copyCols; c++) {
        next[r * cols + c] = this.cells[r * this.cols + c];
      }
    }
    this.cols = cols;
    this.rows = rows;
    this.cells = next;
  }

  step() {
    // Intentionally empty.
  }

  snapshot(): Cells {
    return this.cells;
  }

  destroy() {
    this.cells = new Uint8Array();
    this.cols = 0;
    this.rows = 0;
  }

  private makeCheckerboard(cols: number, rows: number): Cells {
    const out = new Uint8Array(cols * rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Group cells in 2x2 blocks to make scroll drift obvious if present.
        const blockR = Math.floor(r / 2);
        const blockC = Math.floor(c / 2);
        out[r * cols + c] = (blockR + blockC) % 2 === 0 ? 1 : 0;
      }
    }
    return out;
  }
}
