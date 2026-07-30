import { supabase } from "./supabase";

export type StickerRow = { name: string; path: string; url: string };

async function requireUid() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("You need to be signed in.");
  return data.user.id;
}

/** Upload a custom sticker image (PNG with transparency works best). */
export async function uploadSticker(file: File) {
  const uid = await requireUid();
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error } = await supabase.storage.from("stickers").upload(path, file, {
    contentType: file.type || "image/png",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** List the signed-in user's stickers with signed URLs. */
export async function listStickers(): Promise<StickerRow[]> {
  const uid = await requireUid();
  const { data, error } = await supabase.storage.from("stickers").list(uid, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw error;
  const files = (data ?? []).filter((f) => f.id !== null);
  if (!files.length) return [];
  const paths = files.map((f) => `${uid}/${f.name}`);
  const { data: signed, error: sErr } = await supabase.storage
    .from("stickers")
    .createSignedUrls(paths, 3600);
  if (sErr) throw sErr;
  return (signed ?? [])
    .filter((s) => s.signedUrl)
    .map((s, i) => ({ name: files[i].name, path: paths[i], url: s.signedUrl! }));
}

export async function deleteSticker(path: string) {
  const { error } = await supabase.storage.from("stickers").remove([path]);
  if (error) throw error;
}
