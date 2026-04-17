import type { Engine, EngineName } from "../types";
import { PocStaticEngine } from "./poc-static";
import { PocWalkerEngine } from "./poc-walker";

export async function getEngine(name: EngineName): Promise<Engine> {
  switch (name) {
    case "poc-static":
      return new PocStaticEngine();
    case "poc-walker":
      return new PocWalkerEngine();
    case "ts":
    case "wasm":
      throw new Error(`Engine '${name}' is not available in the POC phase.`);
  }
}

export const POC_ENGINES: EngineName[] = ["poc-walker", "poc-static"];
