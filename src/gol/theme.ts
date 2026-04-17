export type ColorListener = () => void;

/**
 * Reads the resolved color of an element. We cannot use getPropertyValue on a
 * custom property (e.g. `--text-1`) because that returns its declared value
 * (literal `light-dark(...)` / `color-mix(...)` text) which canvas.fillStyle
 * cannot parse. Reading `color` on an element that *uses* the token forces the
 * browser to resolve it to an rgb/oklch value we can hand to the canvas.
 */
export function readCellColor(el: HTMLElement): string {
  const resolved = getComputedStyle(el).color;
  return resolved || "currentColor";
}

export class ThemeObserver {
  private readonly onColor: ColorListener;
  private mo: MutationObserver | null = null;
  private mql: MediaQueryList | null = null;

  constructor(onColor: ColorListener) {
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
