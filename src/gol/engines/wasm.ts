import type { Cells, Engine, EngineName } from "../types";

interface WasmUniverse {
  tick(): void;
  width(): number;
  height(): number;
  cells(): number;
  resize(width: number, height: number): void;
  set_cells_from_bytes(bytes: Uint8Array): void;
  free(): void;
}

interface WasmModule {
  default: (input?: unknown) => Promise<{ memory: WebAssembly.Memory }>;
  // Universe::new is a plain `pub fn`, so wasm-bindgen emits a static factory.
  // Calling `new` on the class would produce an object with no __wbg_ptr.
  Universe: {
    new: (blank: boolean, width: number, height: number) => WasmUniverse;
  };
}

let loadPromise: Promise<{
  module: WasmModule;
  memory: WebAssembly.Memory;
}> | null = null;

export async function loadWasm() {
  if (!loadPromise) {
    // Dynamic imports code-split the wasm chunk out of the main bundle; `?url`
    // asks Vite to emit gol_bg.wasm as a hashed asset and hand back its URL.
    loadPromise = (async () => {
      const [glue, wasmUrlMod] = await Promise.all([
        import("../../../vendor/gol-wasm/gol.js"),
        import("../../../vendor/gol-wasm/gol_bg.wasm?url"),
      ]);
      const module = glue as unknown as WasmModule;
      const { memory } = await module.default(wasmUrlMod.default);
      return { module, memory };
    })();
    // Don't latch a permanent failure; allow retry after a transient error.
    loadPromise.catch(() => {
      loadPromise = null;
    });
  }
  return loadPromise;
}

export class WasmEngine implements Engine {
  readonly name: EngineName = "wasm";
  private universe: WasmUniverse | null = null;
  private memory: WebAssembly.Memory | null = null;
  private cols = 0;
  private rows = 0;

  async init(cols: number, rows: number, seed?: Cells): Promise<void> {
    const { module, memory } = await loadWasm();
    this.memory = memory;
    const universe = module.Universe.new(true, cols, rows);
    this.universe = universe;
    this.cols = cols;
    this.rows = rows;
    if (seed && seed.length === cols * rows) {
      universe.set_cells_from_bytes(seed);
    }
  }

  resize(cols: number, rows: number) {
    if (!this.universe) return;
    this.universe.resize(cols, rows);
    this.cols = cols;
    this.rows = rows;
  }

  step() {
    this.universe?.tick();
  }

  snapshot(): Cells {
    if (!this.universe || !this.memory) return new Uint8Array();
    const ptr = this.universe.cells();
    const len = this.cols * this.rows;
    // slice() detaches from wasm memory so a grow (which detaches the backing
    // ArrayBuffer) doesn't invalidate snapshots held by the controller.
    return new Uint8Array(this.memory.buffer, ptr, len).slice();
  }

  paintRegion(
    startCol: number,
    startRow: number,
    regionCols: number,
    regionRows: number,
    src: Cells,
  ) {
    if (!this.universe) return;
    const ptr = this.universe.cells();
    if (!this.memory) return;
    const view = new Uint8Array(this.memory.buffer, ptr, this.cols * this.rows);
    const maxCol = Math.min(startCol + regionCols, this.cols);
    const maxRow = Math.min(startRow + regionRows, this.rows);
    for (let r = startRow; r < maxRow; r++) {
      for (let c = startCol; c < maxCol; c++) {
        const srcIdx = (r - startRow) * regionCols + (c - startCol);
        view[r * this.cols + c] = src[srcIdx] ? 1 : 0;
      }
    }
  }

  destroy() {
    this.universe?.free();
    this.universe = null;
    this.memory = null;
    this.cols = 0;
    this.rows = 0;
  }
}
