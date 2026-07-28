import { supabase } from "./supabase";
import { savePhotoToCloud, signedUrlFor } from "./cloud-photos";

export type JournalRow = {
  id: string;
  user_id: string;
  title: string | null;
  layout: unknown;
  preview_path: string | null;
  created_at: string;
};

export async function saveJournalPage(opts: {
  title?: string;
  layout: unknown;
  previewDataUrl?: string;
  aesthetic?: string;
}) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("You need to be signed in.");
  const uid = userData.user.id;

  let preview_path: string | null = null;
  if (opts.previewDataUrl) {
    const photo = await savePhotoToCloud({
      dataUrl: opts.previewDataUrl,
      aesthetic: opts.aesthetic,
      folder: "journal",
    });
    preview_path = (photo as { storage_path: string }).storage_path;
  }

  const { data, error } = await supabase
    .from("journal_pages")
    .insert({ user_id: uid, title: opts.title ?? null, layout: opts.layout, preview_path })
    .select()
    .single();
  if (error) throw error;
  return data as JournalRow;
}

export async function listJournalPages() {
  const { data, error } = await supabase
    .from("journal_pages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as JournalRow[];
}

export async function deleteJournalPage(row: JournalRow) {
  if (row.preview_path) {
    await supabase.storage.from("photos").remove([row.preview_path]);
  }
  const { error } = await supabase.from("journal_pages").delete().eq("id", row.id);
  if (error) throw error;
}

export { signedUrlFor };
