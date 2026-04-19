#!/usr/bin/env node
/**
 * Build the wasm-game-of-life crate with wasm-pack and drop the artifacts into
 * vendor/gol-wasm/ so Vite owns bundling (`public/` would be served as-is but
 * cannot be `import`-ed from source code).
 *
 * Controlled by the WASM_GOL_CRATE env var (default: sibling path below);
 * skipped gracefully when wasm-pack is missing so CI / first-time clones
 * without the Rust toolchain still succeed with the silent TS fallback.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const defaultCrate = resolve(
  repoRoot,
  "../game-of-life/packages/wasm-game-of-life",
);
const crateDir = process.env.WASM_GOL_CRATE
  ? resolve(process.env.WASM_GOL_CRATE)
  : defaultCrate;
const outDir = join(repoRoot, "vendor", "gol-wasm");

function hasCmd(cmd) {
  const probe = spawnSync(cmd, ["--version"], { stdio: "ignore" });
  return probe.status === 0;
}

if (!existsSync(crateDir)) {
  console.warn(
    `[build-wasm] crate not found at ${crateDir}; skipping (the TS engine is the silent fallback).`,
  );
  process.exit(0);
}

if (!hasCmd("wasm-pack")) {
  console.warn(
    "[build-wasm] wasm-pack not found on PATH; skipping (the TS engine is the silent fallback).",
  );
  process.exit(0);
}

console.log(`[build-wasm] building ${crateDir}`);
execFileSync(
  "wasm-pack",
  [
    "build",
    "--release",
    "--target",
    "web",
    "--out-dir",
    "pkg",
    "--out-name",
    "gol",
  ],
  { cwd: crateDir, stdio: "inherit" },
);

const pkgDir = join(crateDir, "pkg");
if (!existsSync(pkgDir)) {
  console.error(`[build-wasm] wasm-pack produced no pkg/ in ${crateDir}`);
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const entry of readdirSync(pkgDir)) {
  if (
    entry.endsWith(".wasm") ||
    entry.endsWith(".js") ||
    entry.endsWith(".d.ts")
  ) {
    cpSync(join(pkgDir, entry), join(outDir, entry));
  }
}
console.log(`[build-wasm] copied pkg/* to ${outDir}`);
