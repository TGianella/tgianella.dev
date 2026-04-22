import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TsEngine } from "./ts.ts";
import type { Cells } from "../types.ts";

function seedFromCoords(
  cols: number,
  rows: number,
  coords: ReadonlyArray<readonly [number, number]>,
): Cells {
  const out = new Uint8Array(cols * rows);
  for (const [c, r] of coords) out[r * cols + c] = 1;
  return out;
}

async function makeEngine(
  cols: number,
  rows: number,
  seed: Cells,
): Promise<TsEngine> {
  const e = new TsEngine();
  await e.init(cols, rows, seed);
  return e;
}

function aliveCoords(cells: Cells, cols: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i]) out.push([i % cols, Math.floor(i / cols)]);
  }
  out.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  return out;
}

describe("TsEngine", () => {
  it("a 2x2 block is a still life", async () => {
    const cols = 8,
      rows = 8;
    const block: Array<[number, number]> = [
      [2, 2],
      [3, 2],
      [2, 3],
      [3, 3],
    ];
    const e = await makeEngine(cols, rows, seedFromCoords(cols, rows, block));
    const before = Uint8Array.from(e.snapshot());
    for (let i = 0; i < 10; i++) e.step();
    assert.deepEqual(Array.from(e.snapshot()), Array.from(before));
  });

  it("a blinker oscillates with period 2", async () => {
    const cols = 7,
      rows = 7;
    const horizontal: Array<[number, number]> = [
      [2, 3],
      [3, 3],
      [4, 3],
    ];
    const vertical: Array<[number, number]> = [
      [3, 2],
      [3, 3],
      [3, 4],
    ];
    const e = await makeEngine(
      cols,
      rows,
      seedFromCoords(cols, rows, horizontal),
    );
    e.step();
    assert.deepEqual(aliveCoords(e.snapshot(), cols), vertical);
    e.step();
    assert.deepEqual(aliveCoords(e.snapshot(), cols), horizontal);
  });

  it("a glider translates by (1,1) every 4 generations", async () => {
    const cols = 30,
      rows = 30;
    const glider: Array<[number, number]> = [
      [2, 1],
      [3, 2],
      [1, 3],
      [2, 3],
      [3, 3],
    ];
    const e = await makeEngine(cols, rows, seedFromCoords(cols, rows, glider));
    for (let i = 0; i < 4; i++) e.step();
    const expected = glider.map(([c, r]) => [c + 1, r + 1] as [number, number]);
    expected.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    assert.deepEqual(aliveCoords(e.snapshot(), cols), expected);
  });

  it("blinker wraps at the east/west torus edge", async () => {
    const cols = 5,
      rows = 5;
    // Horizontal blinker straddling the right edge: cells at (4,2), (0,2), (1,2)
    const seed: Array<[number, number]> = [
      [4, 2],
      [0, 2],
      [1, 2],
    ];
    const e = await makeEngine(cols, rows, seedFromCoords(cols, rows, seed));
    e.step();
    // Rotates vertically around column 0
    const expected: Array<[number, number]> = [
      [0, 1],
      [0, 2],
      [0, 3],
    ];
    assert.deepEqual(aliveCoords(e.snapshot(), cols), expected);
  });

  it("blinker wraps at the north/south torus edge", async () => {
    const cols = 5,
      rows = 5;
    // Vertical blinker straddling the top edge: (2,4), (2,0), (2,1)
    const seed: Array<[number, number]> = [
      [2, 4],
      [2, 0],
      [2, 1],
    ];
    const e = await makeEngine(cols, rows, seedFromCoords(cols, rows, seed));
    e.step();
    // Rotates horizontally around row 0
    const expected: Array<[number, number]> = [
      [1, 0],
      [2, 0],
      [3, 0],
    ];
    assert.deepEqual(aliveCoords(e.snapshot(), cols), expected);
  });

  it("resize preserves the overlap region", async () => {
    const e = new TsEngine();
    await e.init(
      6,
      6,
      seedFromCoords(6, 6, [
        [1, 1],
        [2, 1],
        [1, 2],
        [2, 2],
      ]),
    );
    e.resize(10, 10);
    assert.deepEqual(aliveCoords(e.snapshot(), 10), [
      [1, 1],
      [2, 1],
      [1, 2],
      [2, 2],
    ]);
  });
});
