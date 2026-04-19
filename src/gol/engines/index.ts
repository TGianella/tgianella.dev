import type { Engine, EngineName } from "../types";
import { TsEngine } from "./ts";

export async function getEngine(name: EngineName): Promise<Engine> {
  if (name === "wasm") {
    try {
      const mod = await import("./wasm");
      // Eagerly load the wasm binary here so any failure (fetch, CSP block,
      // instantiation error) surfaces before we return — letting us swap in
      // the TS fallback without the caller ever seeing the error.
      await mod.loadWasm();
      return new mod.WasmEngine();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("[gol] wasm engine unavailable, falling back to TS:", err);
      }
      return new TsEngine();
    }
  }
  return new TsEngine();
}
