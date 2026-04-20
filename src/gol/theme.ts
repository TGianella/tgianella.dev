/**
 * Reads the resolved color of an element. Cannot use getPropertyValue on a
 * custom property (e.g. `--text-1`) because that returns its declared value
 * (literal `light-dark(...)` / `color-mix(...)` text) which canvas.fillStyle
 * cannot parse. Reading `color` on an element that *uses* the token forces the
 * browser to resolve it to an rgb/oklch value the canvas accepts.
 */
export function readCellColor(el: HTMLElement): string {
  return getComputedStyle(el).color || "currentColor";
}

/**
 * Off-screen `<div>` that inherits `color: var(--text-1)`. Exists solely to
 * give {@link readCellColor} an attached element to read from.
 */
export function makeColorProbe(): HTMLDivElement {
  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText =
    "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;color:var(--text-1);";
  return probe;
}

export class ThemeObserver {
  private readonly onColor: () => void;
  private mo: MutationObserver | null = null;
  private mql: MediaQueryList | null = null;

  constructor(onColor: () => void) {
    this.onColor = onColor;
  }

  start() {
    this.mo = new MutationObserver(() => this.emit());
    this.mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    this.mql = window.matchMedia("(prefers-color-scheme: dark)");
    this.mql.addEventListener("change", this.emit);
  }

  stop() {
    this.mo?.disconnect();
    this.mo = null;
    this.mql?.removeEventListener("change", this.emit);
    this.mql = null;
  }

  private readonly emit = () => {
    this.onColor();
  };
}
