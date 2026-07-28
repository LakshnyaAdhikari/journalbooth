import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Images, Trash2, Download, Wand2, BookHeart, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { listPhotos, deletePhoto, signedUrlFor, type PhotoRow } from "@/lib/cloud-photos";
import { listJournalPages, deleteJournalPage, type JournalRow } from "@/lib/cloud-journal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — AltCam" },
      { name: "description", content: "Every photo and journal page you've saved in AltCam, in one place." },
      { property: "og:title", content: "Gallery — AltCam" },
      { property: "og:description", content: "Every photo and journal page you've saved in AltCam." },
    ],
  }),
  component: Gallery,
});

type Tab = "photos" | "journal";

function Gallery() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("photos");
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [pages, setPages] = useState<JournalRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    setErr(null);
    try {
      const [p, j] = await Promise.all([listPhotos(), listJournalPages()]);
      setPhotos(p);
      setPages(j);
      const paths = [...p.map((r) => r.storage_path), ...j.map((r) => r.preview_path).filter(Boolean) as string[]];
      const entries = await Promise.all(
        paths.map(async (path) => {
          try { return [path, await signedUrlFor(path)] as const; } catch { return null; }
        }),
      );
      setUrls(Object.fromEntries(entries.filter(Boolean) as (readonly [string, string])[]));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load your gallery.");
    } finally {
      setBusy(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="min-h-screen px-4 md:px-10 py-8 md:py-12">
      <header className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          <Images className="h-3.5 w-3.5" /> Gallery
        </div>
        <h1 className="font-display text-4xl md:text-6xl leading-[1.05] text-foreground">Everything you've made.</h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl">
          Saved to your own Supabase project — private storage, signed links only for you.
        </p>
      </header>

      <div className="max-w-5xl mx-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !user ? (
          <div className="border border-border bg-card rounded-md p-8 text-center">
            <p className="font-display text-xl text-foreground mb-2">Sign in to see your gallery</p>
            <p className="text-sm text-muted-foreground">
              Head to the Profile tab to sign in. Nothing is uploaded until you're signed in.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-5">
              {(["photos", "journal"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-3 py-1.5 text-sm border rounded-md capitalize",
                    tab === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent",
                  )}
                >
                  {t} ({t === "photos" ? photos.length : pages.length})
                </button>
              ))}
              <button
                onClick={() => void load()}
                disabled={busy}
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} /> Refresh
              </button>
            </div>

            {err && <p className="text-sm text-destructive mb-4">{err}</p>}

            {tab === "photos" ? (
              <PhotoGrid photos={photos} urls={urls} onChanged={load} />
            ) : (
              <JournalGrid pages={pages} urls={urls} onChanged={load} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="border border-dashed border-border rounded-md p-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function PhotoGrid({ photos, urls, onChanged }: { photos: PhotoRow[]; urls: Record<string, string>; onChanged: () => Promise<void> | void }) {
  const navigate = useNavigate();
  if (!photos.length) return <Empty label="No photos yet — capture or edit something and hit Save to Cloud." />;

  const openInEditor = async (url: string) => {
    const dataUrl = await urlToDataUrl(url);
    sessionStorage.setItem("altcam:edit-image", dataUrl);
    navigate({ to: "/edit" });
  };
  const openInJournal = async (url: string) => {
    const dataUrl = await urlToDataUrl(url);
    sessionStorage.setItem("altcam:journal-image", dataUrl);
    navigate({ to: "/journal" });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {photos.map((p) => {
        const url = urls[p.storage_path];
        return (
          <figure key={p.id} className="group relative border border-border rounded-md overflow-hidden bg-card">
            {url ? (
              <img src={url} alt={p.aesthetic ? `${p.aesthetic} photo` : "Saved photo"} className="w-full aspect-square object-cover" loading="lazy" />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center text-xs text-muted-foreground">—</div>
            )}
            <figcaption className="absolute inset-x-0 bottom-0 p-1.5 flex gap-1 bg-background/85 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <IconBtn title="Open in editor" onClick={() => url && openInEditor(url)}><Wand2 className="h-3.5 w-3.5" /></IconBtn>
              <IconBtn title="Add to journal" onClick={() => url && openInJournal(url)}><BookHeart className="h-3.5 w-3.5" /></IconBtn>
              <IconBtn title="Download" onClick={() => url && downloadUrl(url, `altcam-${p.id}.png`)}><Download className="h-3.5 w-3.5" /></IconBtn>
              <IconBtn title="Delete" danger onClick={async () => { await deletePhoto(p); await onChanged(); }}><Trash2 className="h-3.5 w-3.5" /></IconBtn>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function JournalGrid({ pages, urls, onChanged }: { pages: JournalRow[]; urls: Record<string, string>; onChanged: () => Promise<void> | void }) {
  const navigate = useNavigate();
  if (!pages.length) return <Empty label="No journal pages yet — build one in the Journal tab and hit Save to Cloud." />;

  const reopen = (row: JournalRow) => {
    sessionStorage.setItem("altcam:journal-layout", JSON.stringify({ ...(row.layout as object), title: row.title ?? "" }));
    navigate({ to: "/journal" });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {pages.map((row) => {
        const url = row.preview_path ? urls[row.preview_path] : undefined;
        return (
          <figure key={row.id} className="group relative border border-border rounded-md overflow-hidden bg-card">
            {url ? (
              <img src={url} alt={row.title ?? "Journal page"} className="w-full aspect-[3/4] object-cover" loading="lazy" />
            ) : (
              <div className="w-full aspect-[3/4] flex items-center justify-center text-xs text-muted-foreground">no preview</div>
            )}
            <figcaption className="p-2 text-xs text-foreground truncate">{row.title || "Untitled page"}</figcaption>
            <div className="absolute inset-x-0 bottom-8 p-1.5 flex gap-1 bg-background/85 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <IconBtn title="Reopen in journal" onClick={() => reopen(row)}><BookHeart className="h-3.5 w-3.5" /></IconBtn>
              <IconBtn title="Download" onClick={() => url && downloadUrl(url, `altcam-journal-${row.id}.png`)}><Download className="h-3.5 w-3.5" /></IconBtn>
              <IconBtn title="Delete" danger onClick={async () => { await deleteJournalPage(row); await onChanged(); }}><Trash2 className="h-3.5 w-3.5" /></IconBtn>
            </div>
          </figure>
        );
      })}
    </div>
  );
}

function IconBtn({ children, title, onClick, danger }: { children: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        "flex-1 inline-flex items-center justify-center py-1.5 border border-border rounded",
        danger ? "hover:bg-destructive hover:text-destructive-foreground" : "hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

async function urlToDataUrl(url: string) {
  const blob = await (await fetch(url)).blob();
  return await new Promise<string>((res) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.readAsDataURL(blob);
  });
}

function downloadUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  a.click();
}
