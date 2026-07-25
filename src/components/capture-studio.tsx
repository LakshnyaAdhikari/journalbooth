import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, Download, Film, Timer, Sparkles } from "lucide-react";
import { useCamera } from "@/hooks/use-camera";
import { WebGLFilter } from "@/lib/webgl-filter";
import { AESTHETIC_PRESETS } from "@/lib/filters";
import { AESTHETICS, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type Mode = "single" | "strip3" | "strip4" | "polaroid";

const MODES: { id: Mode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "single", label: "Single", icon: Camera },
  { id: "strip3", label: "Strip x3", icon: Film },
  { id: "strip4", label: "Strip x4", icon: Film },
  { id: "polaroid", label: "Polaroid", icon: Sparkles },
];

export function CaptureStudio() {
  const { aesthetic, setAesthetic } = useTheme();
  const { videoRef, start, flip, ready, error } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const filterRef = useRef<WebGLFilter | null>(null);
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>("single");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shots, setShots] = useState<string[]>([]);
  const [flash, setFlash] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const preset = AESTHETIC_PRESETS[aesthetic];

  // Init WebGL once
  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      filterRef.current = new WebGLFilter(canvasRef.current);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Start camera on mount
  useEffect(() => { void start(); /* eslint-disable-next-line */ }, []);

  // Render loop
  useEffect(() => {
    const loop = () => {
      const video = videoRef.current;
      const filter = filterRef.current;
      const canvas = canvasRef.current;
      if (video && filter && canvas && video.readyState >= 2) {
        const vw = video.videoWidth || 1280;
        const vh = video.videoHeight || 960;
        if (canvas.width !== vw || canvas.height !== vh) filter.resize(vw, vh);
        filter.render(video, preset);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [preset, videoRef]);

  const captureFrame = () => {
    const filter = filterRef.current;
    if (!filter) return null;
    const shot = filter.snapshot();
    setFlash(true);
    setTimeout(() => setFlash(false), 140);
    return shot;
  };

  const runCountdown = (from: number) =>
    new Promise<void>((resolve) => {
      let n = from;
      setCountdown(n);
      const tick = () => {
        n -= 1;
        if (n <= 0) { setCountdown(null); resolve(); }
        else { setCountdown(n); setTimeout(tick, 1000); }
      };
      setTimeout(tick, 1000);
    });

  const shoot = async () => {
    if (!ready) return;
    setOutput(null);
    setShots([]);
    const count = mode === "strip3" ? 3 : mode === "strip4" ? 4 : 1;
    const collected: string[] = [];
    for (let i = 0; i < count; i++) {
      await runCountdown(3);
      const shot = captureFrame();
      if (shot) { collected.push(shot); setShots([...collected]); }
      if (i < count - 1) await new Promise((r) => setTimeout(r, 500));
    }
    const composed = await compose(collected, mode, AESTHETIC_PRESETS[aesthetic].label);
    setOutput(composed);
  };

  const download = () => {
    if (!output) return;
    const a = document.createElement("a");
    a.href = output;
    a.download = `altcam-${aesthetic}-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="grid md:grid-cols-[1fr_280px] gap-6 max-w-5xl mx-auto">
      <div className="space-y-4">
        <div
          className="relative aspect-[3/4] md:aspect-video bg-black overflow-hidden border border-border"
          style={{ borderRadius: "var(--radius)" }}
        >
          <video ref={videoRef} playsInline muted className="hidden" />
          <canvas ref={canvasRef} className="w-full h-full object-cover" />
          {flash && <div className="absolute inset-0 bg-white animate-flash pointer-events-none" />}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="font-display text-white text-[12rem] leading-none drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
                {countdown}
              </div>
            </div>
          )}
          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              Starting camera…
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
              <p className="text-sm text-foreground">{error}</p>
              <button onClick={() => start()} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">
                Try again
              </button>
            </div>
          )}

          {/* Shot preview strip */}
          {shots.length > 0 && !output && (
            <div className="absolute top-3 right-3 flex flex-col gap-1.5">
              {shots.map((s, i) => (
                <img key={i} src={s} className="w-16 h-16 object-cover border-2 border-white rounded" alt="" />
              ))}
            </div>
          )}
        </div>

        {/* Shutter row */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={flip}
            className="h-11 w-11 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent"
            aria-label="Flip camera"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={shoot}
            disabled={!ready || countdown !== null}
            className="h-20 w-20 rounded-full bg-primary border-[6px] border-background shadow-xl active:scale-95 transition-transform disabled:opacity-50"
            aria-label="Shutter"
          />
          <button
            onClick={() => runCountdown(3)}
            className="h-11 w-11 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent"
            aria-label="Timer"
          >
            <Timer className="h-4 w-4" />
          </button>
        </div>

        {output && (
          <div
            className="border border-border p-4 bg-card flex flex-col sm:flex-row gap-4 items-center"
            style={{ borderRadius: "var(--radius)" }}
          >
            <img src={output} alt="Result" className="max-h-80 object-contain" />
            <div className="flex-1 space-y-3">
              <div className="font-display text-lg">Looking good.</div>
              <p className="text-xs text-muted-foreground">
                Download the {mode === "single" ? "photo" : "strip"} or shoot another take.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={download}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md"
                >
                  <Download className="h-4 w-4" /> Download
                </button>
                <button
                  onClick={() => { setOutput(null); setShots([]); }}
                  className="px-3 py-2 text-sm border border-border rounded-md hover:bg-accent"
                >
                  Retake
                </button>
              </div>
            </div>
          </div>
        )}
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
          <div className="space-y-1">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={cn(
                  "w-full flex items-center gap-2 text-left px-3 py-2 text-sm border transition-colors text-card-foreground",
                  mode === id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background/40 border-border hover:border-foreground hover:bg-accent hover:text-accent-foreground",
                )}
                style={{ borderRadius: "var(--radius-sm)" }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

// Compose captured frames into a photobooth strip or polaroid card.
async function compose(shots: string[], mode: Mode, label: string): Promise<string> {
  const imgs = await Promise.all(shots.map((src) => new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  })));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const first = imgs[0];
  const ratio = first.height / first.width;

  if (mode === "single") {
    canvas.width = first.width;
    canvas.height = first.height;
    ctx.drawImage(first, 0, 0);
    return canvas.toDataURL("image/png");
  }

  if (mode === "polaroid") {
    const w = 900;
    const photoH = Math.round(w * ratio);
    const pad = 40;
    const captionH = 160;
    canvas.width = w + pad * 2;
    canvas.height = photoH + pad + captionH;
    ctx.fillStyle = "#f6f2e8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(first, pad, pad, w, photoH);
    ctx.fillStyle = "#333";
    ctx.font = "italic 42px 'Caveat', 'Comic Sans MS', cursive";
    ctx.textAlign = "center";
    ctx.fillText(label, canvas.width / 2, photoH + pad + captionH / 2 + 12);
    return canvas.toDataURL("image/png");
  }

  // Strip: vertical stack with a header + footer, glossy photobooth look.
  const w = 500;
  const photoH = Math.round(w * ratio);
  const gap = 12;
  const pad = 24;
  const headerH = 60;
  const footerH = 90;
  canvas.width = w + pad * 2;
  canvas.height = headerH + imgs.length * photoH + (imgs.length - 1) * gap + footerH + pad;

  // Background — dark strip
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Header
  ctx.fillStyle = "#fff";
  ctx.font = "bold 22px 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ALTCAM", canvas.width / 2, headerH / 2 + 8);

  imgs.forEach((img, i) => {
    const y = headerH + i * (photoH + gap);
    ctx.drawImage(img, pad, y, w, photoH);
  });

  ctx.fillStyle = "#fff";
  ctx.font = "italic 18px 'Space Grotesk', sans-serif";
  ctx.fillText(label, canvas.width / 2, canvas.height - footerH / 2);
  const date = new Date().toLocaleDateString();
  ctx.font = "14px 'Space Grotesk', sans-serif";
  ctx.fillStyle = "#888";
  ctx.fillText(date, canvas.width / 2, canvas.height - footerH / 2 + 24);

  return canvas.toDataURL("image/png");
}
