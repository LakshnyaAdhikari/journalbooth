
# AltCam — Build Plan

This is a large spec. I'll build it in phases so each milestone is usable on its own and reviewable before moving on. All processing stays client-side (Canvas/WebGL); Lovable Cloud handles auth + storage.

## Phase 0 — Foundation (this turn if approved)
- Design system: 4 aesthetic themes (Y2K, Kawaii, Goth/Punk, Chaotic) + Neutral shell, swapped via `data-theme` on root, using CSS custom properties in `src/styles.css`.
- App shell + responsive nav: desktop left sidebar / mobile bottom tab bar, collapsible, 5 routes:
  - `/` Capture, `/edit`, `/journal`, `/gallery`, `/profile`
- Theme scoping rule wired in: Capture/Edit adopt selected aesthetic; Journal/Gallery/Profile force neutral.
- Placeholder screens for each route so navigation and theming are demoable end-to-end.

## Phase 1 — Capture (photobooth)
- `getUserMedia` live preview with real-time WebGL filter shaders per aesthetic (Y2K grade + grain, Kawaii pastel, Goth crush, Chaotic deep-fry).
- Photobooth strip mode: 3–4 sequential shots, downloadable strip PNG.
- Customizable frames/props: Polaroid, film strip, digicam border; sticker overlay on strips.
- Shutter, timer, front/rear camera toggle (mobile).

## Phase 2 — Editor
- Same shaders reused for post-capture editing (identical for uploaded photos).
- Preset filters per aesthetic tab + manual sliders: saturation, contrast, shadows, warmth, grain, vignette, gradient overlay.
- Client-side compression/resize before saving.

## Phase 3 — Auth + persistence (Lovable Cloud)
- Email/password + Google OAuth.
- Tables: `photos` (metadata + storage path), `journal_pages` (layout JSON), `stickers` (user uploads).
- Storage buckets: `photos` (private, per-user), `stickers` (private).
- RLS scoped to `auth.uid()`.

## Phase 4 — Journal / scrapbook
- Canvas page builder (drag/resize/rotate photos, stickers, text w/ multiple fonts, layering).
- Layout stored as JSON; photos referenced by storage path.
- Gallery grid of saved photos + journal pages.

## Phase 5 — Polish
- PWA manifest + install prompt.
- Keep-alive GitHub Action snippet in README (Supabase inactivity ping) — user runs this themselves.

## Technical notes
- Stack: TanStack Start (fixed), Tailwind v4 tokens in `src/styles.css`, WebGL via raw shaders (no heavy deps) with 2D canvas fallback.
- Themes: each aesthetic = a `[data-theme="y2k"]` block redefining `--background`, `--foreground`, `--primary`, `--accent`, `--font-display`, `--bg-texture`, `--radius`. Neutral = default `:root`.
- Fonts: loaded via `<link>` in `__root.tsx` head (VT323/Orbitron for Y2K, Fredoka/Bubblegum Sans for Kawaii, Nosifer/Metal Mania for Goth, Bungee/Impact for Chaotic, Inter for Neutral).
- Nav: single `<AppNav>` component, `useMediaQuery` swaps sidebar ↔ bottom bar; collapsed state persisted in `localStorage`.

## Question before I start
This is 4–5 phases of work. Do you want me to:
- **(A)** Ship Phase 0 now (themes + nav + all route shells, fully clickable, no camera/backend yet) so you can validate the aesthetic direction, then continue phase by phase; or
- **(B)** Go straight through Phase 0 → Phase 2 (themes + nav + working camera + editor, still no backend) in one long build; or
- **(C)** Different scope — tell me where to cut or expand.

I recommend **A** — the theme direction is the biggest subjective call and cheapest to iterate on before the camera/editor code depends on it.
