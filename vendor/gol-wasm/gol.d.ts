/* tslint:disable */
/* eslint-disable */

export enum Cell {
    Dead = 0,
    Alive = 1,
}

export class Universe {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    cells(): number;
    height(): number;
    static new(blank: boolean, width: number, height: number): Universe;
    render(): string;
    /**
     * Resize the universe, preserving cells whose coordinates fall within the
     * overlap of the old and new rectangles. Newly revealed regions are filled
     * with `Cell::Dead`; callers that want a non-dead seed should follow up
     * with `set_cells_from_bytes`.
     */
    resize(width: number, height: number): void;
    /**
     * Bulk seed: `bytes.len()` must equal `width * height`; each byte is
     * treated as a boolean (0 = dead, non-zero = alive).
     */
    set_cells_from_bytes(bytes: Uint8Array): void;
    set_height(height: number): void;
    set_width(width: number): void;
    tick(): void;
    toggle_cell(row: number, column: number): void;
    width(): number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_universe_free: (a: number, b: number) => void;
    readonly universe_cells: (a: number) => number;
    readonly universe_height: (a: number) => number;
    readonly universe_new: (a: number, b: number, c: number) => number;
    readonly universe_render: (a: number) => [number, number];
    readonly universe_resize: (a: number, b: number, c: number) => void;
    readonly universe_set_cells_from_bytes: (a: number, b: number, c: number) => void;
    readonly universe_set_height: (a: number, b: number) => void;
    readonly universe_set_width: (a: number, b: number) => void;
    readonly universe_tick: (a: number) => void;
    readonly universe_toggle_cell: (a: number, b: number, c: number) => void;
    readonly universe_width: (a: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
