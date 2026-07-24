import { createFileRoute } from "@tanstack/react-router";
import { Palette, Upload, Sliders } from "lucide-react";

export const Route = createFileRoute("/edit")({
  head: () => ({
    meta: [
      { title: "Edit — AltCam" },
      { name: "description", content: "Filter and adjust any photo — captured or uploaded — with granular controls." },
      { property: "og:title", content: "Edit — AltCam" },
      { property: "og:description", content: "Filter and adjust any photo with granular controls." },
    ],
  }),
  component: Edit,
});

const sliders = ["Saturation", "Contrast", "Shadows", "Warmth", "Grain", "Vignette", "Gradient"];

function Edit() {
  return (
    <div className="min-h-screen px-4 md:px-10 py-8 md:py-12">
      <header className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          <Palette className="h-3.5 w-3.5" /> Edit
        </div>
        <h1 className="font-display text-4xl md:text-6xl leading-[0.95] text-foreground">Push it further.</h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl">
          Upload a photo or open one you shot in AltCam. Same filters, same controls — no second-class treatment.
        </p>
      </header>

      <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_280px] gap-6">
        <div
          className="aspect-video bg-card border border-border flex flex-col items-center justify-center relative overflow-hidden"
          style={{ borderRadius: "var(--radius)" }}
        >
          <div className="absolute inset-0" style={{ background: "var(--bg-texture)" }} />
          <div className="relative text-center px-6">
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-display text-lg text-foreground">Drop a photo here</p>
            <p className="text-xs text-muted-foreground mt-1">Editor canvas — Phase 2</p>
          </div>
        </div>

        <aside
          className="border border-border p-4 bg-card space-y-4"
          style={{ borderRadius: "var(--radius)" }}
        >
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Sliders className="h-3 w-3" /> Adjust
          </div>
          {sliders.map((s) => (
            <div key={s}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-foreground">{s}</span>
                <span className="text-muted-foreground">0</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-primary" />
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
