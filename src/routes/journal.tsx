import { createFileRoute } from "@tanstack/react-router";
import { BookHeart, Plus } from "lucide-react";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal — AltCam" },
      { name: "description", content: "Arrange photos, stickers, and captions into a scrapbook journal page." },
      { property: "og:title", content: "Journal — AltCam" },
      { property: "og:description", content: "Arrange photos, stickers, and captions into scrapbook pages." },
    ],
  }),
  component: Journal,
});

function Journal() {
  return (
    <div className="min-h-screen px-4 md:px-10 py-8 md:py-12">
      <header className="max-w-5xl mx-auto mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <BookHeart className="h-3.5 w-3.5" /> Journal
          </div>
          <h1 className="font-display text-4xl md:text-6xl leading-[0.95] text-foreground">
            Your scrapbook.
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl">
            Arrange photos, stickers, and captions on a canvas. Pages save to your account.
          </p>
        </div>
        <button className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md">
          <Plus className="h-4 w-4" /> New page
        </button>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] bg-card border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground rounded-lg"
          >
            Empty page
          </div>
        ))}
      </div>
    </div>
  );
}
