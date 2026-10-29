"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { detectFileType, isUuid } from "@/lib/format";

export type ProofState = { error?: string; ok?: boolean };

const METHODS = ["telebirr", "cbe", "bank_transfer", "cash", "other"];
const MAX_BYTES = 4 * 1024 * 1024; // hosting platforms limit request size to about 4.5 MB
const SAVE_ERROR = "We could not save your payment proof. Please try again.";

export async function submitPayment(_prev: ProofState, formData: FormData): Promise<ProofState> {
  const { supabase, user } = await requireRole("parent");

  const invoiceId = String(formData.get("invoiceId") ?? "");
  const method = String(formData.get("method") ?? "");
  const reference = String(formData.get("reference") ?? "").trim() || null;
  const amount = Number(String(formData.get("amount") ?? ""));
  const file = formData.get("file");

  if (!isUuid(invoiceId)) return { error: SAVE_ERROR };
  if (!METHODS.includes(method)) return { error: "Choose how you paid." };
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    return { error: "Enter the amount you paid, in birr." };
  }
  if (reference && reference.length > 100) return { error: "The reference is too long." };
  if (!(file instanceof File) || file.size === 0) return { error: "Attach a screenshot or receipt." };
  if (file.size > MAX_BYTES) return { error: "This file is larger than 4 MB. Choose a smaller file." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectFileType(bytes);
  if (!kind) return { error: "We can only accept PDF, JPG or PNG files." };

  // Checks that the invoice is yours and still unpaid, and that no other proof is waiting.
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status")
    .eq("id", invoiceId)
    .eq("parent_id", user.id)
    .maybeSingle();
  if (!invoice || invoice.status !== "unpaid") return { error: "This bill is not waiting for payment." };

  const { data: waiting } = await supabase
    .from("payments")
    .select("id")
    .eq("invoice_id", invoiceId)
    .eq("status", "pending")
    .limit(1);
  if (waiting && waiting.length > 0) return { error: "You already sent a proof for this bill. We are checking it." };

  const path = `${user.id}/${crypto.randomUUID()}.${kind.ext}`;
  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(path, bytes, { contentType: kind.mime });
  if (uploadError) {
    console.error("proof upload failed:", uploadError.message);
    return { error: SAVE_ERROR };
  }

  const { error: insertError } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    parent_id: user.id,
    amount,
    method,
    reference,
    proof_path: path,
  });
  if (insertError) {
    console.error("payment record failed:", insertError.message);
    await supabase.storage.from("payment-proofs").remove([path]);
    return { error: SAVE_ERROR };
  }

  revalidatePath("/parent/billing");
  return { ok: true };
}
