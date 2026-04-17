import type { EngineName, GolApi } from "../gol";

const QUERY_KEY = "gol";
const ENGINE_QUERY_KEY = "engine";
const POC_CYCLE: EngineName[] = ["poc-walker", "poc-static"];

function parseEngineParam(value: string | null): EngineName | null {
  if (!value) return null;
  if (value === "walker") return "poc-walker";
  if (value === "static") return "poc-static";
  if (value === "poc-walker" || value === "poc-static") return value;
  return null;
}

async function loadApi(): Promise<GolApi> {
  const mod = await import("../gol");
  return mod.install();
}

async function activateFromQuery() {
  const params = new URLSearchParams(window.location.search);
  if (params.get(QUERY_KEY) !== "1") return;
  const engine = parseEngineParam(params.get(ENGINE_QUERY_KEY)) ?? "poc-walker";
  const api = await loadApi();
  await api.enable({ engine });
}

function installShortcuts() {
  document.addEventListener("keydown", async (event) => {
    if (!event.shiftKey || !(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLowerCase();

    if (key === "g") {
      event.preventDefault();
      const api = window.__gol ?? (await loadApi());
      if (api.isEnabled()) api.disable();
      else await api.enable({ engine: "poc-walker" });
      return;
    }

    if (key === "e") {
      event.preventDefault();
      const api = window.__gol;
      if (!api?.isEnabled()) return;
      const current = api.getStats().engine;
      const idx = POC_CYCLE.indexOf(current as EngineName);
      const next = POC_CYCLE[(idx + 1) % POC_CYCLE.length];
      await api.swapEngine(next);
    }
  });
}

if (typeof window !== "undefined") {
  installShortcuts();
  // Defer query activation until DOM is interactive so the canvas has a body to attach to.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      void activateFromQuery();
    });
  } else {
    void activateFromQuery();
  }
}
