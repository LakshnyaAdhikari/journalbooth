import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Palette } from "lucide-react";
import { EditorStudio } from "@/components/editor-studio";

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

function Edit() {
  return (
    <div className="min-h-screen px-4 md:px-10 py-8 md:py-12">
      <header className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          <Palette className="h-3.5 w-3.5" /> Edit
        </div>
        <h1 className="font-display text-4xl md:text-6xl leading-[1.1] text-foreground">Push it further.</h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl">
          Upload a photo or bring one over from Capture. Same filter engine, now with hands on every dial.
        </p>
      </header>
      <ClientOnly fallback={<div className="max-w-5xl mx-auto text-sm text-muted-foreground">Loading editor…</div>}>
        <EditorStudio />
      </ClientOnly>
    </div>
  );
}
