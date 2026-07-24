import { createFileRoute } from "@tanstack/react-router";
import { Camera, Sparkles, Film, Sticker } from "lucide-react";
import { AESTHETICS, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Capture,
});

function Capture() {
  const { aesthetic, setAesthetic } = useTheme();
  const current = AESTHETICS.find((a) => a.id === aesthetic)!;

  return (
    <div className="min-h-screen px-4 md:px-10 py-8 md:py-12">
      <header className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          <Camera className="h-3.5 w-3.5" /> Capture
        </div>
        <h1 className="font-display text-4xl md:text-6xl leading-[0.95] text-foreground">
          Shoot in <span className="text-primary">{current.label.toLowerCase()}</span>.
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl">
          Live filters apply as you shoot. Photobooth strips, polaroid frames, film borders — all free, no paywalls.
        </p>
      </header>

      <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_280px] gap-6">
        <div
          className="aspect-[3/4] md:aspect-video bg-card border border-border flex items-center justify-center relative overflow-hidden"
          style={{ borderRadius: "var(--radius)" }}
        >
          <div className="absolute inset-0" style={{ background: "var(--bg-texture)" }} />
          <div className="relative text-center px-6">
            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="font-display text-lg text-foreground">Viewfinder</p>
            <p className="text-xs text-muted-foreground mt-1">
              Camera preview + live WebGL filter coming in Phase 1
            </p>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <button
              className="h-16 w-16 rounded-full bg-primary border-4 border-background shadow-lg"
              aria-label="Shutter"
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="border border-border p-4 bg-card" style={{ borderRadius: "var(--radius)" }}>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Aesthetic
            </div>
            <div className="grid grid-cols-2 gap-2">
              {AESTHETICS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAesthetic(a.id)}
                  className={cn(
                    "text-left px-3 py-2 border transition-all",
                    aesthetic === a.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-foreground",
                  )}
                  style={{ borderRadius: "var(--radius-sm)" }}
                >
                  <div className="font-display text-sm">{a.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{a.blurb}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="border border-border p-4 bg-card" style={{ borderRadius: "var(--radius)" }}>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Film className="h-3 w-3" /> Mode
            </div>
            {["Single", "Strip ×3", "Strip ×4", "Polaroid"].map((m) => (
              <button
                key={m}
                className="w-full text-left px-3 py-2 text-sm border border-transparent hover:border-border hover:bg-accent transition-colors"
                style={{ borderRadius: "var(--radius-sm)" }}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="border border-border p-4 bg-card" style={{ borderRadius: "var(--radius)" }}>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Sticker className="h-3 w-3" /> Frames & props
            </div>
            <p className="text-xs text-muted-foreground">
              Polaroid · film · digicam borders + sticker overlays land with Phase 1.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
