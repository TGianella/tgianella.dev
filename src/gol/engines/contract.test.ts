import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { TsEngine } from "./ts.ts";
import type { Cells, Engine } from "../types.ts";

// The wasm engine runs in the browser; for the contract test we need a node
// build of the same crate. Check for `public/gol-node/gol.js` (produced by
// `pnpm build:wasm:node`) and skip gracefully otherwise so `pnpm test` stays
// green on machines without the Rust toolchain.
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");
const nodePkgEntry = join(repoRoot, "public", "gol-node", "gol.js");
const wasmAvailable = existsSync(nodePkgEntry);

function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function makeSeed(cols: number, rows: number, seed: number): Cells {
  const rand = seededRandom(seed);
  const out = new Uint8Array(cols * rows);
  for (let i = 0; i < out.length; i++) out[i] = rand() < 0.3 ? 1 : 0;
  return out;
}

async function run(
  engine: Engine,
  cols: number,
  rows: number,
  generations: number,
  seed: Cells,
) {
  await engine.init(cols, rows, seed);
  const history: Uint8Array[] = [];
  for (let i = 0; i < generations; i++) {
    engine.step();
    history.push(Uint8Array.from(engine.snapshot()));
  }
  return history;
}

describe("engine contract: ts == wasm for 100 generations", () => {
  let wasmEngine: Engine | null = null;

  before(async () => {
    if (!wasmAvailable) return;
    const require = createRequire(import.meta.url);
    const mod = require(nodePkgEntry) as {
      Universe: new (
        blank: boolean,
        w: number,
        h: number,
      ) => {
        tick(): void;
        resize(w: number, h: number): void;
        set_cells_from_bytes(b: Uint8Array): void;
        cells(): number;
        free(): void;
      };
      __wasm: { memory: WebAssembly.Memory };
    };

    wasmEngine = {
      name: "wasm",
      async init(cols, rows, maybeSeed) {
        const u = new mod.Universe(true, cols, rows);
        if (maybeSeed && maybeSeed.length === cols * rows) {
          u.set_cells_from_bytes(maybeSeed);
        }
        // Stash on closure for later methods.
        (this as unknown as { u: unknown; w: number; h: number }).u = u;
        (this as unknown as { w: number }).w = cols;
        (this as unknown as { h: number }).h = rows;
      },
      resize(cols, rows) {
        const self = this as unknown as {
          u: { resize(w: number, h: number): void };
          w: number;
          h: number;
        };
        self.u.resize(cols, rows);
        self.w = cols;
        self.h = rows;
      },
      step() {
        (this as unknown as { u: { tick(): void } }).u.tick();
      },
      snapshot() {
        const self = this as unknown as {
          u: { cells(): number };
          w: number;
          h: number;
        };
        const ptr = self.u.cells();
        return new Uint8Array(
          mod.__wasm.memory.buffer,
          ptr,
          self.w * self.h,
        ).slice();
      },
      paintRegion() {
        // not exercised by the contract test
      },
      destroy() {
        (this as unknown as { u: { free(): void } }).u.free();
      },
    };
  });

  it("matches byte-for-byte", async (t) => {
    if (!wasmAvailable) {
      t.skip("wasm node build missing; run `pnpm build:wasm:node` to enable.");
      return;
    }
    const cols = 24;
    const rows = 18;
    const gens = 100;
    const seed = makeSeed(cols, rows, 0xc0ffee);

    const tsHistory = await run(new TsEngine(), cols, rows, gens, seed);
    const wasmHistory = await run(wasmEngine!, cols, rows, gens, seed);

    for (let i = 0; i < gens; i++) {
      assert.deepEqual(
        Array.from(wasmHistory[i]),
        Array.from(tsHistory[i]),
        `divergence at generation ${i + 1}`,
      );
    }
  });
});
