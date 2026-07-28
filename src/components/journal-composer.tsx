import { useEffect, useRef, useState } from "react";
import { BookHeart, Download, ImagePlus, Trash2, Type, Sparkles, Copy, Undo2, Cloud, Check } from "lucide-react";
import { AESTHETICS, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { saveJournalPage } from "@/lib/cloud-journal";
import { useAuth } from "@/lib/auth";

type ItemKind = "photo" | "text" | "sticker";
type Item = {
  id: string;
  kind: ItemKind;
  x: number; // 0..1 relative to canvas
  y: number;
  w: number; // 0..1 relative to canvas width
  rot: number; // deg
  z: number;
  // photo
  src?: string;
  // text
  text?: string;
  color?: string;
  font?: string;
  // sticker
  glyph?: string;
};

const STICKERS = ["★", "♥", "✿", "☾", "☀", "✧", "❀", "♪", "☕", "✈", "☁", "♛"];
const FONTS = [
  { id: "display", label: "Display", css: "var(--font-display)" },
  { id: "hand", label: "Hand", css: "'Caveat', cursive" },
  { id: "mono", label: "Mono", css: "ui-monospace, monospace" },
];
const COLORS = ["#111111", "#ffffff", "#ff2d87", "#4c1d95", "#f59e0b", "#10b981", "#ef4444"];

const PAPERS: Record<string, { bg: string; label: string }> = {
  cream: { bg: "#f6f2e8", label: "Cream" },
  grid: { bg: "#ffffff", label: "Grid" },
  dark: { bg: "#111214", label: "Noir" },
  pink: { bg: "#ffe1ee", label: "Bubblegum" },
};

const uid = () => Math.random().toString(36).slice(2, 9);

export function JournalComposer() {
  const { aesthetic } = useTheme();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [paper, setPaper] = useState<keyof typeof PAPERS>("cream");
  const [history, setHistory] = useState<Item[][]>([]);
  const [title, setTitle] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load from sessionStorage handoff
  useEffect(() => {
    try {
      const layoutRaw = sessionStorage.getItem("altcam:journal-layout");
      if (layoutRaw) {
        const parsed = JSON.parse(layoutRaw) as { paper?: keyof typeof PAPERS; items?: Item[]; title?: string };
        if (parsed.items) setItems(parsed.items);
        if (parsed.paper && PAPERS[parsed.paper]) setPaper(parsed.paper);
        if (parsed.title) setTitle(parsed.title);
        sessionStorage.removeItem("altcam:journal-layout");
        return;
      }
      const stashed = sessionStorage.getItem("altcam:journal-image");
      if (stashed) {
        addPhoto(stashed);
        sessionStorage.removeItem("altcam:journal-image");
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = (next: Item[]) => {
    setHistory((h) => [...h.slice(-30), items]);
    setItems(next);
  };

  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setItems(prev);
      return h.slice(0, -1);
    });
  };

  const addPhoto = (src: string) => {
    commit([
      ...items,
      { id: uid(), kind: "photo", src, x: 0.5, y: 0.5, w: 0.45, rot: (Math.random() - 0.5) * 8, z: items.length + 1 },
    ]);
  };

  const addText = () => {
    commit([
      ...items,
      { id: uid(), kind: "text", text: "type here", x: 0.5, y: 0.3, w: 0.4, rot: 0, z: items.length + 1, color: paper === "dark" ? "#ffffff" : "#111111", font: "hand" },
    ]);
  };

  const addSticker = (glyph: string) => {
    commit([
      ...items,
      { id: uid(), kind: "sticker", glyph, x: 0.5, y: 0.5, w: 0.12, rot: (Math.random() - 0.5) * 30, z: items.length + 1 },
    ]);
  };

  const onFile = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => addPhoto(String(reader.result));
    reader.readAsDataURL(f);
  };

  const updateItem = (id: string, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const removeSelected = () => {
    if (!selected) return;
    commit(items.filter((it) => it.id !== selected));
    setSelected(null);
  };

  const duplicateSelected = () => {
    const it = items.find((i) => i.id === selected);
    if (!it) return;
    commit([...items, { ...it, id: uid(), x: Math.min(0.95, it.x + 0.05), y: Math.min(0.95, it.y + 0.05), z: items.length + 1 }]);
  };

  const startDrag = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setSelected(id);
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const it = items.find((i) => i.id === id)!;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = it.x;
    const origY = it.y;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / rect.width;
      const dy = (ev.clientY - startY) / rect.height;
      updateItem(id, { x: Math.max(0, Math.min(1, origX + dx)), y: Math.max(0, Math.min(1, origY + dy)) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setHistory((h) => [...h.slice(-30), items]);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const currentItem = items.find((i) => i.id === selected) ?? null;

  const renderDataUrl = async (): Promise<string | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const W = 1600;
    const H = Math.round((rect.height / rect.width) * W);
    const out = document.createElement("canvas");
    out.width = W;
    out.height = H;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = PAPERS[paper].bg;
    ctx.fillRect(0, 0, W, H);
    if (paper === "grid") {
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }
    const sorted = [...items].sort((a, b) => a.z - b.z);
    for (const it of sorted) {
      const cx = it.x * W;
      const cy = it.y * H;
      const w = it.w * W;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((it.rot * Math.PI) / 180);
      if (it.kind === "photo" && it.src) {
        const img = await loadImg(it.src);
        const ratio = img.height / img.width;
        const h = w * ratio;
        // paper border like polaroid
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 6;
        ctx.fillRect(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else if (it.kind === "text" && it.text) {
        const fontCss = FONTS.find((f) => f.id === it.font)?.css ?? "sans-serif";
        const fontSize = Math.round(w * 0.18);
        ctx.font = `${fontSize}px ${fontCss}`;
        ctx.fillStyle = it.color ?? "#111";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(it.text, 0, 0);
      } else if (it.kind === "sticker" && it.glyph) {
        ctx.font = `${Math.round(w)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(it.glyph, 0, 0);
      }
      ctx.restore();
    }
    return out.toDataURL("image/png");
  };

  const download = async () => {
    const url = await renderDataUrl();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `altcam-journal-${aesthetic}-${Date.now()}.png`;
    a.click();
  };

  const saveToCloud = async () => {
    if (!user) { setSaveState("error"); setSaveMsg("Sign in on the Profile tab to save to cloud."); return; }
    if (!items.length) { setSaveState("error"); setSaveMsg("Add something to the page first."); return; }
    setSaveState("saving"); setSaveMsg(null);
    try {
      const previewDataUrl = (await renderDataUrl()) ?? undefined;
      await saveJournalPage({
        title: title.trim() || null ? title.trim() : undefined,
        layout: { paper, items },
        previewDataUrl,
        aesthetic,
      });
      setSaveState("saved"); setSaveMsg("Page saved to your gallery.");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch (e) {
      setSaveState("error"); setSaveMsg(e instanceof Error ? e.message : "Save failed.");
    }
  };

  return (
    <div className="grid md:grid-cols-[1fr_280px] gap-6 max-w-5xl mx-auto">
      <div className="space-y-3">
        <div
          ref={canvasRef}
          onClick={() => setSelected(null)}
          className="relative aspect-[3/4] overflow-hidden border border-border shadow-xl select-none"
          style={{
            borderRadius: "var(--radius)",
            background: PAPERS[paper].bg,
            backgroundImage:
              paper === "grid"
                ? "linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)"
                : undefined,
            backgroundSize: paper === "grid" ? "24px 24px" : undefined,
          }}
        >
          {items.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none text-center px-8">
              <BookHeart className="h-8 w-8 opacity-40" />
              <p className="text-sm opacity-60">Add photos, stickers, and captions from the panel →</p>
            </div>
          )}
          {[...items].sort((a, b) => a.z - b.z).map((it) => {
            const style: React.CSSProperties = {
              left: `${it.x * 100}%`,
              top: `${it.y * 100}%`,
              width: `${it.w * 100}%`,
              transform: `translate(-50%, -50%) rotate(${it.rot}deg)`,
              zIndex: it.z,
            };
            const isSel = selected === it.id;
            const ring = isSel ? "outline outline-2 outline-primary outline-offset-2" : "";
            if (it.kind === "photo") {
              return (
                <div
                  key={it.id}
                  onPointerDown={(e) => startDrag(e, it.id)}
                  className={cn("absolute cursor-move bg-white p-2 shadow-lg", ring)}
                  style={style}
                >
                  <img src={it.src} alt="" className="w-full h-auto block pointer-events-none" draggable={false} />
                </div>
              );
            }
            if (it.kind === "text") {
              return (
                <div
                  key={it.id}
                  onPointerDown={(e) => startDrag(e, it.id)}
                  className={cn("absolute cursor-move whitespace-nowrap", ring)}
                  style={{ ...style, color: it.color, fontFamily: FONTS.find((f) => f.id === it.font)?.css, fontSize: `min(${it.w * 30}vw, 48px)` }}
                >
                  {it.text}
                </div>
              );
            }
            return (
              <div
                key={it.id}
                onPointerDown={(e) => startDrag(e, it.id)}
                className={cn("absolute cursor-move leading-none", ring)}
                style={{ ...style, fontSize: `min(${it.w * 60}vw, 120px)` }}
              >
                {it.glyph}
              </div>
            );
          })}
        </div>

        {/* Selected controls */}
        {currentItem && (
          <div className="border border-border bg-card p-3 flex flex-wrap gap-2 items-center text-sm" style={{ borderRadius: "var(--radius)" }}>
            <span className="text-xs uppercase tracking-widest text-muted-foreground mr-1">Selected</span>
            <label className="flex items-center gap-1">
              size
              <input
                type="range" min={0.05} max={0.9} step={0.01} value={currentItem.w}
                onChange={(e) => updateItem(currentItem.id, { w: parseFloat(e.target.value) })}
              />
            </label>
            <label className="flex items-center gap-1">
              rot
              <input
                type="range" min={-180} max={180} step={1} value={currentItem.rot}
                onChange={(e) => updateItem(currentItem.id, { rot: parseFloat(e.target.value) })}
              />
            </label>
            {currentItem.kind === "text" && (
              <input
                value={currentItem.text ?? ""}
                onChange={(e) => updateItem(currentItem.id, { text: e.target.value })}
                className="px-2 py-1 bg-background border border-border rounded text-sm min-w-[120px]"
              />
            )}
            {currentItem.kind === "text" && (
              <div className="flex gap-1">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => updateItem(currentItem.id, { color: c })}
                    className="h-5 w-5 rounded-full border border-border" style={{ background: c }} />
                ))}
              </div>
            )}
            <button onClick={duplicateSelected} className="ml-auto inline-flex items-center gap-1 px-2 py-1 border border-border rounded hover:bg-accent">
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            <button onClick={removeSelected} className="inline-flex items-center gap-1 px-2 py-1 border border-border rounded hover:bg-destructive hover:text-destructive-foreground">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="border border-border p-4 bg-card" style={{ borderRadius: "var(--radius)" }}>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Add</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md"
            >
              <ImagePlus className="h-4 w-4" /> Photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <button
              onClick={addText}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-md hover:bg-accent"
            >
              <Type className="h-4 w-4" /> Text
            </button>
          </div>
        </div>

        <div className="border border-border p-4 bg-card" style={{ borderRadius: "var(--radius)" }}>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Stickers
          </div>
          <div className="grid grid-cols-6 gap-1">
            {STICKERS.map((g) => (
              <button
                key={g}
                onClick={() => addSticker(g)}
                className="aspect-square text-xl hover:bg-accent rounded"
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-border p-4 bg-card" style={{ borderRadius: "var(--radius)" }}>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Paper</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PAPERS).map(([id, p]) => (
              <button
                key={id}
                onClick={() => setPaper(id as keyof typeof PAPERS)}
                className={cn(
                  "px-3 py-2 text-xs border rounded-md text-left",
                  paper === id ? "border-primary ring-1 ring-primary" : "border-border hover:bg-accent",
                )}
                style={{ background: p.bg, color: id === "dark" ? "#fff" : "#111" }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={download} className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md">
            <Download className="h-4 w-4" /> Download PNG
          </button>
          <button
            onClick={undo}
            disabled={!history.length}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm border border-border rounded-md hover:bg-accent disabled:opacity-40"
          >
            <Undo2 className="h-4 w-4" /> Undo
          </button>
        </div>
      </aside>
    </div>
  );
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}
