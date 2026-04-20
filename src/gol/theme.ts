// Custom properties like `--text-1` declare as `light-dark(...)` text, which
// canvas.fillStyle can't parse — reading `color` on an element that *uses*
// the token forces resolution to an rgb/oklch value the canvas accepts.
export function readCellColor(el: HTMLElement): string {
  return getComputedStyle(el).color || "currentColor";
}

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
