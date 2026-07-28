import { supabase } from "./supabase";

/** Convert a data URL / object URL to a Blob. */
async function toBlob(src: string): Promise<Blob> {
  const r = await fetch(src);
  return await r.blob();
}

export type SavePhotoInput = {
  dataUrl: string;
  aesthetic?: string;
  folder?: "captures" | "edits" | "journal";
};

/** Uploads a PNG to the private `photos` bucket at <uid>/<folder>/<ts>.png
 *  and inserts a metadata row in `public.photos`. Requires signed-in user. */
export async function savePhotoToCloud({ dataUrl, aesthetic, folder = "captures" }: SavePhotoInput) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("You need to be signed in.");
  const uid = userData.user.id;
  const blob = await toBlob(dataUrl);
  const path = `${uid}/${folder}/${Date.now()}.png`;

  const { error: upErr } = await supabase.storage.from("photos").upload(path, blob, {
    contentType: "image/png",
    upsert: false,
  });
  if (upErr) throw upErr;

  const { data: row, error: insErr } = await supabase
    .from("photos")
    .insert({ user_id: uid, storage_path: path, aesthetic: aesthetic ?? null })
    .select()
    .single();
  if (insErr) throw insErr;
  return row;
}

/** Signed URL for a private storage path (default: 1 hour). */
export async function signedUrlFor(path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from("photos").createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export type PhotoRow = {
  id: string;
  user_id: string;
  storage_path: string;
  aesthetic: string | null;
  created_at: string;
};

/** All photos for the signed-in user, newest first (RLS scopes this). */
export async function listPhotos() {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PhotoRow[];
}

/** Removes the storage object and the metadata row. */
export async function deletePhoto(row: PhotoRow) {
  const { error: rmErr } = await supabase.storage.from("photos").remove([row.storage_path]);
  if (rmErr) throw rmErr;
  const { error } = await supabase.from("photos").delete().eq("id", row.id);
  if (error) throw error;
}
