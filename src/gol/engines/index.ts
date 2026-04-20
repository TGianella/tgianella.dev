import type { Engine, EngineName } from "../types";
import { TsEngine } from "./ts";

export async function getEngine(name: EngineName): Promise<Engine> {
  if (name === "wasm") {
    try {
      const mod = await import("./wasm");
      // Force instantiation here so fetch/CSP/instantiation failures surface
      // before we commit to returning the wasm engine.
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
