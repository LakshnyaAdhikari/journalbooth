import type { Aesthetic } from "./theme";

// Uniforms controlling each aesthetic. All shaders share the same signature
// so we can swap them without rebuilding the WebGL program per-aesthetic.
export type FilterParams = {
  saturation: number; // 0..2 (1 = neutral)
  contrast: number;   // 0..2
  brightness: number; // -0.5..0.5
  grain: number;      // 0..1
  vignette: number;   // 0..1
  warmth: number;     // -0.5..0.5 (positive = warm)
  tintR: number; tintG: number; tintB: number; // additive tint 0..1
  chromaShift: number; // 0..0.02
};

export const AESTHETIC_PRESETS: Record<Aesthetic, FilterParams & { label: string }> = {
  y2k: {
    label: "Y2K digicam",
    saturation: 1.35, contrast: 1.25, brightness: 0.08, grain: 0.35, vignette: 0.35,
    warmth: -0.05, tintR: 0.06, tintG: 0.0, tintB: 0.08, chromaShift: 0.006,
  },
  kawaii: {
    label: "Kawaii soft",
    saturation: 0.85, contrast: 0.9, brightness: 0.15, grain: 0.1, vignette: 0.15,
    warmth: 0.1, tintR: 0.1, tintG: 0.04, tintB: 0.08, chromaShift: 0.0,
  },
  goth: {
    label: "Goth crush",
    saturation: 0.35, contrast: 1.55, brightness: -0.1, grain: 0.5, vignette: 0.6,
    warmth: -0.15, tintR: 0.04, tintG: 0.0, tintB: 0.02, chromaShift: 0.002,
  },
  chaotic: {
    label: "Deep-fried",
    saturation: 1.9, contrast: 1.6, brightness: 0.1, grain: 0.65, vignette: 0.2,
    warmth: 0.2, tintR: 0.15, tintG: 0.05, tintB: 0.0, chromaShift: 0.012,
  },
};
