import type { Cells, Engine, EngineName } from "../types";

/**
 * Conway's Game of Life on a torus (wraparound at all four edges).
 *
 * Double-buffered: `read` holds the current generation, `write` receives the
 * next. After each `step()` the buffers are swapped, avoiding per-tick
 * allocation.
 */
export class TsEngine implements Engine {
  readonly name: EngineName = "ts";
  private cols = 0;
  private rows = 0;
  private read: Cells = new Uint8Array();
  private write: Cells = new Uint8Array();

  async init(cols: number, rows: number, seed?: Cells): Promise<void> {
    this.cols = cols;
    this.rows = rows;
    const size = cols * rows;
    this.read = new Uint8Array(size);
    this.write = new Uint8Array(size);
    if (seed && seed.length === size) {
      this.read.set(seed);
    }
  }

  resize(cols: number, rows: number) {
    const nextSize = cols * rows;
    const next = new Uint8Array(nextSize);
    const copyCols = Math.min(cols, this.cols);
    const copyRows = Math.min(rows, this.rows);
    for (let r = 0; r < copyRows; r++) {
      for (let c = 0; c < copyCols; c++) {
        next[r * cols + c] = this.read[r * this.cols + c];
      }
    }
    this.cols = cols;
    this.rows = rows;
    this.read = next;
    this.write = new Uint8Array(nextSize);
  }

  step() {
    const { cols, rows, read, write } = this;
    if (cols === 0 || rows === 0) return;

    for (let r = 0; r < rows; r++) {
      const rN = r === 0 ? rows - 1 : r - 1;
      const rS = r === rows - 1 ? 0 : r + 1;
      const rowOff = r * cols;
      const rowNOff = rN * cols;
      const rowSOff = rS * cols;
      for (let c = 0; c < cols; c++) {
        const cW = c === 0 ? cols - 1 : c - 1;
        const cE = c === cols - 1 ? 0 : c + 1;
        const n =
          read[rowNOff + cW] +
          read[rowNOff + c] +
          read[rowNOff + cE] +
          read[rowOff + cW] +
          read[rowOff + cE] +
          read[rowSOff + cW] +
          read[rowSOff + c] +
          read[rowSOff + cE];
        const alive = read[rowOff + c];
        write[rowOff + c] = alive
          ? n === 2 || n === 3
            ? 1
            : 0
          : n === 3
            ? 1
            : 0;
      }
    }

    this.read = write;
    this.write = read;
  }

  snapshot(): Cells {
    return this.read;
  }

  /**
   * Overwrite a rectangular region with `src` (row-major). Out-of-bounds writes
   * are clipped silently. Used by the controller to seed newly-revealed rows
   * after a resize without touching existing cells.
   */
  paintRegion(
    startCol: number,
    startRow: number,
    regionCols: number,
    regionRows: number,
    src: Cells,
  ) {
    const maxCol = Math.min(startCol + regionCols, this.cols);
    const maxRow = Math.min(startRow + regionRows, this.rows);
    for (let r = startRow; r < maxRow; r++) {
      for (let c = startCol; c < maxCol; c++) {
        const srcIdx = (r - startRow) * regionCols + (c - startCol);
        this.read[r * this.cols + c] = src[srcIdx] ? 1 : 0;
      }
    }
  }

  destroy() {
    this.read = new Uint8Array();
    this.write = new Uint8Array();
    this.cols = 0;
    this.rows = 0;
  }
}
