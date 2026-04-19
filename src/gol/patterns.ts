import type { Cells } from "./types";

/** Uniform random fill at a given alive density in [0, 1]. */
export function random(cols: number, rows: number, density = 0.15): Cells {
  const out = new Uint8Array(cols * rows);
  for (let i = 0; i < out.length; i++) {
    if (Math.random() < density) out[i] = 1;
  }
  return out;
}

function stamp(
  cols: number,
  rows: number,
  shape: ReadonlyArray<readonly [number, number]>,
  originCol: number,
  originRow: number,
): Cells {
  const out = new Uint8Array(cols * rows);
  for (const [dc, dr] of shape) {
    const c = originCol + dc;
    const r = originRow + dr;
    if (c >= 0 && c < cols && r >= 0 && r < rows) out[r * cols + c] = 1;
  }
  return out;
}

const GLIDER_SHAPE = [
  [1, 0],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2],
] as const;

export function glider(
  cols: number,
  rows: number,
  originCol = 0,
  originRow = 0,
): Cells {
  return stamp(cols, rows, GLIDER_SHAPE, originCol, originRow);
}

const ACORN_SHAPE = [
  [1, 0],
  [3, 1],
  [0, 2],
  [1, 2],
  [4, 2],
  [5, 2],
  [6, 2],
] as const;

export function acorn(
  cols: number,
  rows: number,
  originCol = Math.floor(cols / 2) - 3,
  originRow = Math.floor(rows / 2) - 1,
): Cells {
  return stamp(cols, rows, ACORN_SHAPE, originCol, originRow);
}

const PULSAR_SHAPE = (() => {
  const arms: [number, number][] = [];
  const offsets = [2, 3, 4];
  for (const o of offsets) {
    arms.push([o, 0], [-o, 0], [0, o], [0, -o]);
    arms.push([o, 5], [-o, 5], [5, o], [5, -o]);
    arms.push([o, -5], [-o, -5], [-5, o], [-5, -o]);
  }
  return arms.map(([c, r]) => [c + 7, r + 7] as [number, number]);
})();

export function pulsar(
  cols: number,
  rows: number,
  originCol = Math.floor(cols / 2) - 7,
  originRow = Math.floor(rows / 2) - 7,
): Cells {
  return stamp(cols, rows, PULSAR_SHAPE, originCol, originRow);
}
