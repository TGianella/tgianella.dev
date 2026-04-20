export const CELL_SIZE = 40;

export type EngineName = "ts" | "wasm";

export type Cells = Uint8Array;

export interface GridSize {
  cols: number;
  rows: number;
}

export interface Viewport {
  w: number;
  h: number;
}

export interface Engine {
  readonly name: EngineName;
  init(cols: number, rows: number, seed?: Cells): Promise<void>;
  resize(cols: number, rows: number): void;
  step(): void;
  snapshot(): Cells;
  /** Overwrite a rectangular region (row-major). Out-of-bounds writes clip. */
  paintRegion(
    startCol: number,
    startRow: number,
    regionCols: number,
    regionRows: number,
    src: Cells,
  ): void;
  destroy(): void;
}

export interface Renderer {
  attach(canvas: HTMLCanvasElement): void;
  setGrid(size: GridSize): void;
  draw(
    cells: Cells,
    scrollY: number,
    viewport: Viewport,
    cellColor: string,
  ): void;
  clear(): void;
  detach(): void;
}

export interface ControllerStats {
  engine: EngineName;
  fps: number;
  cells: GridSize & { alive: number };
  scrollY: number;
  docHeight: number;
}
