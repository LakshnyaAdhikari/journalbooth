import { createFileRoute } from "@tanstack/react-router";
import { Images } from "lucide-react";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — AltCam" },
      { name: "description", content: "Every photo you've saved in AltCam, in one place." },
      { property: "og:title", content: "Gallery — AltCam" },
      { property: "og:description", content: "Every photo you've saved in AltCam." },
    ],
  }),
  component: Gallery,
});

function Gallery() {
  return (
    <div className="min-h-screen px-4 md:px-10 py-8 md:py-12">
      <header className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          <Images className="h-3.5 w-3.5" /> Gallery
        </div>
        <h1 className="font-display text-4xl md:text-6xl leading-[0.95] text-foreground">Everything you've made.</h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl">
          Standalone photos live here. Journal pages have their own view.
        </p>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-card border border-border rounded-md flex items-center justify-center text-xs text-muted-foreground"
          >
            —
          </div>
        ))}
      </div>
    </div>
  );
}
