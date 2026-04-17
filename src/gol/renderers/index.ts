import type { Renderer, RendererName } from "../types";
import { Canvas2DRenderer } from "./canvas2d";

export function getRenderer(name: RendererName): Renderer {
  switch (name) {
    case "canvas2d":
      return new Canvas2DRenderer();
  }
}
