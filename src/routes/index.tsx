import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { AESTHETICS, useTheme } from "@/lib/theme";
import { CaptureStudio } from "@/components/capture-studio";

export const Route = createFileRoute("/")({
  component: Capture,
});

function Capture() {
  const { aesthetic } = useTheme();
  const current = AESTHETICS.find((a) => a.id === aesthetic)!;

  return (
    <div className="min-h-screen px-4 md:px-10 py-8 md:py-12">
      <header className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          <Camera className="h-3.5 w-3.5" /> Capture
        </div>
        <h1 className="font-display text-4xl md:text-6xl leading-[1.1] text-foreground">
          Shoot in <span className="text-primary">{current.label.toLowerCase()}</span>.
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl">
          Live filters apply as you shoot. Photobooth strips, polaroid frames — all free.
        </p>
      </header>

      <ClientOnly fallback={<div className="max-w-5xl mx-auto text-sm text-muted-foreground">Loading camera…</div>}>
        <CaptureStudio />
      </ClientOnly>
    </div>
  );
}
