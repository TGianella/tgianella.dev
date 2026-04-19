import { Controller, type ControllerOptions } from "./controller";
import type { ControllerStats, EngineName } from "./types";

declare global {
  interface Window {
    __gol?: GolApi;
  }
}

export interface GolApi {
  enable(opts?: Partial<ControllerOptions>): Promise<void>;
  disable(): void;
  isEnabled(): boolean;
  swapEngine(name: EngineName): Promise<void>;
  getStats(): ControllerStats;
  onStats(listener: (stats: ControllerStats) => void): () => void;
}

export function install(): GolApi {
  if (window.__gol) return window.__gol;

  const controller = new Controller();
  const api: GolApi = {
    enable: (opts) => controller.enable({ engine: opts?.engine ?? "wasm" }),
    disable: () => controller.disable(),
    isEnabled: () => controller.isEnabled(),
    swapEngine: (name) => controller.swapEngine(name),
    getStats: () => controller.getStats(),
    onStats: (listener) => controller.onStats(listener),
  };
  window.__gol = api;
  return api;
}

export type { ControllerOptions, ControllerStats, EngineName };
