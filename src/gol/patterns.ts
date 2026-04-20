import type { Cells } from "./types";

/** Uniform random fill at a given alive density in [0, 1]. */
export function random(cols: number, rows: number, density = 0.15): Cells {
  const out = new Uint8Array(cols * rows);
  for (let i = 0; i < out.length; i++) {
    if (Math.random() < density) out[i] = 1;
  }
  return out;
}
