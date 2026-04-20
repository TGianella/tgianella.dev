import { getEngine } from "./engines";
import { getRenderer } from "./renderers";
import { LayoutObserver, readLayout, type LayoutSnapshot } from "./layout";
import { random } from "./patterns";
import { Scheduler } from "./scheduler";
import { ThemeObserver, readCellColor } from "./theme";

const SEED_DENSITY = 0.15;

function makeColorProbe(): HTMLDivElement {
  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText =
    "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;color:var(--text-1);";
  return probe;
}
import {
  CELL_SIZE,
  type ControllerStats,
  type Engine,
  type EngineName,
  type Renderer,
} from "./types";

const CANVAS_ID = "gol-canvas";
const ROOT_ATTR = "data-gol";
const TICK_HZ = 10;

export interface ControllerOptions {
  engine: EngineName;
}

export class Controller {
  private engine: Engine | null = null;
  private readonly renderer: Renderer;
  private readonly scheduler: Scheduler;
  private readonly layout: LayoutObserver;
  private readonly theme: ThemeObserver;
  private colorProbe: HTMLDivElement | null = null;
  private cellColor: string = "currentColor";
  private running = false;
  private readonly statsListeners = new Set<(s: ControllerStats) => void>();

  constructor() {
    this.renderer = getRenderer("canvas2d");
    this.scheduler = new Scheduler({
      fps: TICK_HZ,
      onTick: () => this.tick(),
      onFrame: () => this.emitStats(),
    });
    this.layout = new LayoutObserver(
      (snap, prev) => this.handleLayoutChange(snap, prev),
      () => this.handleScroll(),
    );
    this.theme = new ThemeObserver(() => {
      // Don't read the color here: `--text-1` is registered via @property and
      // transitions over `--duration-gentle-1` on theme swap. The observer fires
      // synchronously on the attribute change, before the interpolation has
      // advanced — reading now would latch the OLD theme's color. Instead
      // redraw() re-reads on every frame, so cells naturally follow the
      // transition curve and settle on the target color.
      this.redraw();
    });
  }

  isEnabled(): boolean {
    return this.running;
  }

  async enable(opts: ControllerOptions): Promise<void> {
    if (this.running) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      if (import.meta.env.DEV) {
        console.info(
          "[gol] reduced-motion preference active; enable() is a no-op.",
        );
      }
      return;
    }

    const canvas = this.getOrCreateCanvas();
    canvas.style.display = "block";
    this.renderer.attach(canvas);

    this.colorProbe = makeColorProbe();
    document.body.appendChild(this.colorProbe);
    this.cellColor = readCellColor(this.colorProbe);

    const snap = readLayout();
    this.renderer.setGrid(snap.grid, CELL_SIZE);

    this.engine = await getEngine(opts.engine);
    await this.engine.init(
      snap.grid.cols,
      snap.grid.rows,
      random(snap.grid.cols, snap.grid.rows, SEED_DENSITY),
    );

    this.layout.start();
    this.theme.start();
    document.addEventListener("astro:after-swap", this.handleAfterSwap);
    document.documentElement.setAttribute(ROOT_ATTR, "on");

    this.running = true;
    this.scheduler.start();
    this.redraw();
  }

  disable() {
    if (!this.running) return;
    this.running = false;
    this.scheduler.stop();
    this.layout.stop();
    this.theme.stop();
    document.removeEventListener("astro:after-swap", this.handleAfterSwap);
    this.renderer.clear();
    this.renderer.detach();
    this.engine?.destroy();
    this.engine = null;
    this.colorProbe?.remove();
    this.colorProbe = null;
    document.documentElement.removeAttribute(ROOT_ATTR);
    const canvas = document.getElementById(
      CANVAS_ID,
    ) as HTMLCanvasElement | null;
    if (canvas) canvas.style.display = "";
    this.emitStats();
  }

  getStats(): ControllerStats {
    const snap = this.layout.current;
    const cells = this.engine?.snapshot();
    let alive = 0;
    if (cells) for (let i = 0; i < cells.length; i++) if (cells[i]) alive++;
    return {
      engine: this.engine?.name ?? "ts",
      fps: this.scheduler.getFps(),
      cells: { cols: snap.grid.cols, rows: snap.grid.rows, alive },
      scrollY: snap.scrollY,
      docHeight: snap.docHeight,
    };
  }

  onStats(listener: (stats: ControllerStats) => void): () => void {
    this.statsListeners.add(listener);
    return () => this.statsListeners.delete(listener);
  }

  private tick() {
    if (!this.engine) return;
    this.engine.step();
    this.redraw();
  }

  private redraw() {
    if (!this.engine) return;
    this.refreshCellColor();
    const snap = this.layout.current;
    this.renderer.draw(
      this.engine.snapshot(),
      snap.scrollY,
      snap.viewport,
      this.cellColor,
    );
  }

  private refreshCellColor() {
    // Astro's ClientRouter replaces <body>'s contents on SPA swap, which
    // detaches the probe. getComputedStyle on a disconnected element returns
    // a default that would freeze the cells at the wrong color forever.
    if (!this.colorProbe || !this.colorProbe.isConnected) {
      this.colorProbe?.remove();
      this.colorProbe = makeColorProbe();
      document.body.appendChild(this.colorProbe);
    }
    this.cellColor = readCellColor(this.colorProbe);
  }

  private handleLayoutChange(snap: LayoutSnapshot, prev: LayoutSnapshot) {
    if (!this.engine) return;
    this.renderer.setGrid(snap.grid, CELL_SIZE);
    this.engine.resize(snap.grid.cols, snap.grid.rows);

    // Seed newly-revealed regions (grown cols or rows) with random cells so
    // the universe stays alive as the document lengthens or the viewport
    // widens. Existing cells are preserved by the resize's overlap copy.
    const grewCols = snap.grid.cols > prev.grid.cols;
    const grewRows = snap.grid.rows > prev.grid.rows;
    if (grewRows) {
      const regionCols = snap.grid.cols;
      const regionRows = snap.grid.rows - prev.grid.rows;
      this.engine.paintRegion(
        0,
        prev.grid.rows,
        regionCols,
        regionRows,
        random(regionCols, regionRows, SEED_DENSITY),
      );
    }
    if (grewCols) {
      const regionCols = snap.grid.cols - prev.grid.cols;
      const regionRows = Math.min(prev.grid.rows, snap.grid.rows);
      if (regionRows > 0) {
        this.engine.paintRegion(
          prev.grid.cols,
          0,
          regionCols,
          regionRows,
          random(regionCols, regionRows, SEED_DENSITY),
        );
      }
    }
    this.redraw();
  }

  private handleScroll() {
    this.redraw();
  }

  private readonly handleAfterSwap = () => {
    this.layout.refresh();
    this.redraw();
  };

  private getOrCreateCanvas(): HTMLCanvasElement {
    let canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement | null;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = CANVAS_ID;
      canvas.setAttribute("aria-hidden", "true");
      document.body.prepend(canvas);
    }
    return canvas;
  }

  private emitStats() {
    if (this.statsListeners.size === 0) return;
    const stats = this.getStats();
    this.statsListeners.forEach((l) => l(stats));
  }
}
