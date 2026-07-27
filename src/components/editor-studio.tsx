import { useEffect, useRef, useState } from "react";
import { Upload, Download, RotateCcw, Sliders, Sparkles, Cloud, Check } from "lucide-react";
import { WebGLFilter } from "@/lib/webgl-filter";
import { AESTHETIC_PRESETS } from "@/lib/filters";
import type { FilterParams } from "@/lib/filters";
import { AESTHETICS, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { savePhotoToCloud } from "@/lib/cloud-photos";
import { useAuth } from "@/lib/auth";

const NEUTRAL: FilterParams = {
  saturation: 1, contrast: 1, brightness: 0, grain: 0, vignette: 0,
  warmth: 0, tintR: 0, tintG: 0, tintB: 0, chromaShift: 0,
};

type SliderKey = keyof Pick<FilterParams, "saturation" | "contrast" | "brightness" | "warmth" | "grain" | "vignette" | "chromaShift">;
const SLIDERS: { key: SliderKey; label: string; min: number; max: number; step: number }[] = [
  { key: "saturation", label: "Saturation", min: 0, max: 2, step: 0.01 },
  { key: "contrast",   label: "Contrast",   min: 0, max: 2, step: 0.01 },
  { key: "brightness", label: "Brightness", min: -0.5, max: 0.5, step: 0.01 },
  { key: "warmth",     label: "Warmth",     min: -0.5, max: 0.5, step: 0.01 },
  { key: "grain",      label: "Grain",      min: 0, max: 1, step: 0.01 },
  { key: "vignette",   label: "Vignette",   min: 0, max: 1, step: 0.01 },
  { key: "chromaShift",label: "Chroma",     min: 0, max: 0.02, step: 0.0005 },
];

export function EditorStudio() {
  const { aesthetic, setAesthetic } = useTheme();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const filterRef = useRef<WebGLFilter | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [params, setParams] = useState<FilterParams>(NEUTRAL);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Init WebGL
  useEffect(() => {
    if (!canvasRef.current) return;
    try { filterRef.current = new WebGLFilter(canvasRef.current); } catch (e) { console.error(e); }
  }, []);

  // Pull handoff image from Capture (sessionStorage)
  useEffect(() => {
    try {
      const src = sessionStorage.getItem("altcam:edit-image");
      if (src) { setImgSrc(src); sessionStorage.removeItem("altcam:edit-image"); }
    } catch {}
  }, []);

  // Load image element and render on any param change
  useEffect(() => {
    if (!imgSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      const f = filterRef.current;
      if (f) { f.resize(img.width, img.height); f.render(img, params); }
    };
    img.src = imgSrc;
  }, [imgSrc]);

  useEffect(() => {
    const f = filterRef.current, img = imgRef.current;
    if (f && img) f.render(img, params);
  }, [params]);

  const onFile = (file: File | null | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const applyAestheticPreset = (id: typeof AESTHETICS[number]["id"]) => {
    setAesthetic(id);
    const { label: _l, ...p } = AESTHETIC_PRESETS[id];
    setParams(p);
  };

  const reset = () => setParams(NEUTRAL);
  const download = () => {
    const f = filterRef.current;
    if (!f) return;
    const url = f.snapshot();
    const a = document.createElement("a");
    a.href = url;
    a.download = `altcam-edit-${Date.now()}.png`;
    a.click();
  };

  const saveToCloud = async () => {
    const f = filterRef.current;
    if (!f) return;
    if (!user) { setSaveState("error"); setSaveMsg("Sign in on the Profile tab to save to cloud."); return; }
    setSaveState("saving"); setSaveMsg(null);
    try {
      await savePhotoToCloud({ dataUrl: f.snapshot(), aesthetic, folder: "edits" });
      setSaveState("saved"); setSaveMsg("Saved to your gallery.");
    } catch (e) {
      setSaveState("error"); setSaveMsg(e instanceof Error ? e.message : "Save failed.");
    }
  };

  return (
    <div className="grid md:grid-cols-[1fr_300px] gap-6 max-w-5xl mx-auto">
      <div className="space-y-4">
        <div
          className="relative aspect-video bg-black overflow-hidden border border-border flex items-center justify-center"
          style={{ borderRadius: "var(--radius)" }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
        >
          <canvas ref={canvasRef} className={cn("w-full h-full object-contain", !imgSrc && "hidden")} />
          {!imgSrc && (
            <label className="cursor-pointer text-center px-6 py-10 w-full">
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-display text-lg text-foreground">Drop or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP — nothing leaves your browser</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </label>
          )}
        </div>

        {imgSrc && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-md hover:bg-accent">
                <Upload className="h-4 w-4" /> Replace
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
              <button onClick={reset} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-md hover:bg-accent">
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
              <button
                onClick={saveToCloud}
                disabled={saveState === "saving" || saveState === "saved"}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-md hover:bg-accent disabled:opacity-60 ml-auto"
              >
                {saveState === "saved" ? <Check className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}
                {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Save to Cloud"}
              </button>
              <button onClick={download} className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md">
                <Download className="h-4 w-4" /> Download
              </button>
            </div>
            {saveMsg && (
              <div className={cn("text-xs", saveState === "error" ? "text-destructive" : "text-muted-foreground")}>
                {saveMsg}
              </div>
            )}
          </>
        )}
      </div>

      <aside className="space-y-4">
        <div className="border border-border p-4 bg-card" style={{ borderRadius: "var(--radius)" }}>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Aesthetic preset
          </div>
          <div className="grid grid-cols-2 gap-2">
            {AESTHETICS.map((a) => (
              <button
                key={a.id}
                onClick={() => applyAestheticPreset(a.id)}
                className={cn(
                  "text-left px-3 py-2 border transition-all text-card-foreground",
                  aesthetic === a.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background/40 border-border hover:border-foreground",
                )}
                style={{ borderRadius: "var(--radius-sm)" }}
              >
                <div className="font-display text-sm">{a.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="border border-border p-4 bg-card space-y-3" style={{ borderRadius: "var(--radius)" }}>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Sliders className="h-3 w-3" /> Adjust
          </div>
          {SLIDERS.map(({ key, label, min, max, step }) => (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-foreground">{label}</span>
                <span className="text-muted-foreground tabular-nums">{params[key].toFixed(key === "chromaShift" ? 3 : 2)}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={params[key]}
                onChange={(e) => setParams((p) => ({ ...p, [key]: parseFloat(e.target.value) }))}
                className="w-full accent-primary"
              />
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
