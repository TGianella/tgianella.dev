export interface SchedulerOptions {
  fps: number;
  onTick: () => void;
  onFrame?: () => void;
}

export class Scheduler {
  private readonly minTickMs: number;
  private readonly onTick: () => void;
  private readonly onFrame: (() => void) | undefined;

  private rafId = 0;
  private running = false;
  private lastTick = 0;
  private frameCount = 0;
  private lastFpsSample = 0;
  private fpsValue = 0;

  constructor(opts: SchedulerOptions) {
    this.minTickMs = 1000 / opts.fps;
    this.onTick = opts.onTick;
    this.onFrame = opts.onFrame;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTick = performance.now();
    this.lastFpsSample = this.lastTick;
    this.frameCount = 0;
    document.addEventListener("visibilitychange", this.handleVisibility);
    this.loop(this.lastTick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    document.removeEventListener("visibilitychange", this.handleVisibility);
  }

  requestFrame() {
    if (!this.running) this.onFrame?.();
  }

  getFps(): number {
    return this.fpsValue;
  }

  private readonly handleVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.rafId);
    } else if (this.running) {
      this.lastTick = performance.now();
      this.loop(this.lastTick);
    }
  };

  private loop = (now: number) => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);

    if (now - this.lastTick >= this.minTickMs) {
      this.lastTick = now;
      this.onTick();
    }
    this.onFrame?.();

    this.frameCount++;
    if (now - this.lastFpsSample >= 1000) {
      this.fpsValue = Math.round(
        (this.frameCount * 1000) / (now - this.lastFpsSample),
      );
      this.frameCount = 0;
      this.lastFpsSample = now;
    }
  };
}
