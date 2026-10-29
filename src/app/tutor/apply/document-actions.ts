"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";

export type UploadState = { error?: string; ok?: boolean };

const DOC_TYPES = [
  "national_id", "student_id", "transcript", "grade8_result",
  "grade12_result", "degree", "certificate", "other",
];
const MAX_BYTES = 4 * 1024 * 1024; // hosting platforms limit request size to about 4.5 MB
const SAVE_ERROR = "We could not save your document. Please try again.";

// Identify the real file type from its first bytes, not from its name.
function detectType(bytes: Uint8Array): { mime: string; ext: string } | null {
  const starts = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts([0x25, 0x50, 0x44, 0x46])) return { mime: "application/pdf", ext: "pdf" };
  if (starts([0x89, 0x50, 0x4e, 0x47])) return { mime: "image/png", ext: "png" };
  if (starts([0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
  return null;
}

export async function uploadDocument(
  _prev: UploadState,
  formData: FormData
): Promise<UploadState> {
  const { supabase, user } = await requireRole("tutor");

  const docType = String(formData.get("docType") ?? "");
  const file = formData.get("file");

  if (!DOC_TYPES.includes(docType)) {
    return { error: "Choose what type of document this is." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "This file is larger than 4 MB. Choose a smaller file or compress it." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectType(bytes);
  if (!kind) {
    return { error: "We can only accept PDF, JPG or PNG files." };
  }

  const { data: app } = await supabase
    .from("tutor_applications")
    .select("id")
    .eq("tutor_id", user.id)
    .maybeSingle();
  if (!app) return { error: SAVE_ERROR };

  // The folder is the tutor's own id; the file name is random.
  const path = `${user.id}/${crypto.randomUUID()}.${kind.ext}`;
  const { error: uploadError } = await supabase.storage
    .from("tutor-documents")
    .upload(path, bytes, { contentType: kind.mime });
  if (uploadError) {
    console.error("upload failed:", uploadError.message);
    return { error: SAVE_ERROR };
  }

  const originalName = file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 200) || "document";
  const { error: insertError } = await supabase.from("documents").insert({
    application_id: app.id,
    tutor_id: user.id,
    doc_type: docType,
    storage_path: path,
    original_name: originalName,
    mime_type: kind.mime,
    size_bytes: bytes.length,
  });
  if (insertError) {
    console.error("document record failed:", insertError.message);
    await supabase.storage.from("tutor-documents").remove([path]);
    return { error: SAVE_ERROR };
  }

  revalidatePath("/tutor/apply");
  return { ok: true };
}

export async function deleteDocument(formData: FormData): Promise<void> {
  const { supabase, user } = await requireRole("tutor");
  const id = String(formData.get("id") ?? "");

  const { data: doc } = await supabase
    .from("documents")
    .select("id, storage_path")
    .eq("id", id)
    .eq("tutor_id", user.id)
    .maybeSingle();
  if (!doc) return;

  // Only remove the file if the database row was really deleted.
  const { data: deleted } = await supabase
    .from("documents")
    .delete()
    .eq("id", doc.id)
    .select("id");
  if (deleted && deleted.length > 0) {
    await supabase.storage.from("tutor-documents").remove([doc.storage_path]);
  }

  revalidatePath("/tutor/apply");
}
