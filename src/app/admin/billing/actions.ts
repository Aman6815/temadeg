"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { isUuid } from "@/lib/format";

const METHODS = ["telebirr", "cbe", "bank_transfer", "cash", "other"];

function back(invoiceId: string, notice: string): never {
  revalidatePath("/admin/billing");
  redirect(`/admin/billing/invoices/${invoiceId}?notice=${notice}`);
}

export async function confirmPayment(formData: FormData): Promise<void> {
  const { supabase } = await requireRole("admin");
  const paymentId = String(formData.get("paymentId") ?? "");
  const invoiceId = String(formData.get("invoiceId") ?? "");
  if (!isUuid(paymentId) || !isUuid(invoiceId)) redirect("/admin/billing");

  const { error } = await supabase.rpc("confirm_payment", { p_payment_id: paymentId });
  if (error) console.error("confirm failed:", error.message);
  back(invoiceId, error ? "failed" : "confirmed");
}

export async function rejectPayment(formData: FormData): Promise<void> {
  const { supabase } = await requireRole("admin");
  const paymentId = String(formData.get("paymentId") ?? "");
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!isUuid(paymentId) || !isUuid(invoiceId)) redirect("/admin/billing");
  if (note.length < 3 || note.length > 500) back(invoiceId, "note-needed");

  const { error } = await supabase.rpc("reject_payment", { p_payment_id: paymentId, p_note: note });
  if (error) console.error("reject failed:", error.message);
  back(invoiceId, error ? "failed" : "rejected");
}

export async function recordPayout(formData: FormData): Promise<void> {
  const { supabase } = await requireRole("admin");
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const method = String(formData.get("method") ?? "");
  const reference = String(formData.get("reference") ?? "").trim() || null;
  if (!isUuid(invoiceId)) redirect("/admin/billing");
  if (!METHODS.includes(method) || (reference && reference.length > 100)) back(invoiceId, "failed");

  const { error } = await supabase.rpc("record_payout", {
    p_invoice_id: invoiceId,
    p_method: method,
    p_reference: reference,
  });
  if (error) console.error("payout failed:", error.message);
  back(invoiceId, error ? "failed" : "paid-out");
}
