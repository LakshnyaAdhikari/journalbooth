import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { BookHeart } from "lucide-react";
import { JournalComposer } from "@/components/journal-composer";

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
      <header className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          <BookHeart className="h-3.5 w-3.5" /> Journal
        </div>
        <h1 className="font-display text-4xl md:text-6xl leading-[1.1] text-foreground">
          Your scrapbook.
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl">
          Drop photos on paper. Add stickers, captions, and a bit of chaos. Download as PNG.
        </p>
      </header>

      <ClientOnly fallback={<div className="max-w-5xl mx-auto text-sm text-muted-foreground">Loading composer…</div>}>
        <JournalComposer />
      </ClientOnly>
    </div>
  );
}
