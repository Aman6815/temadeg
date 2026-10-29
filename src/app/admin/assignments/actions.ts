"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { isUuid } from "@/lib/format";

export async function createInvoice(formData: FormData): Promise<void> {
  const { supabase } = await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) redirect("/admin/assignments");

  const period = new Date().toISOString().slice(0, 10); // the database uses the month of this date
  const { error } = await supabase.rpc("create_invoice", { p_assignment_id: id, p_period: period });

  revalidatePath("/admin/assignments");
  redirect(`/admin/assignments?notice=${error ? "invoice-exists" : "invoice-created"}`);
}

export async function endAssignment(formData: FormData): Promise<void> {
  const { supabase } = await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) redirect("/admin/assignments");

  const { error } = await supabase.rpc("end_assignment", {
    p_assignment_id: id,
    p_end_date: new Date().toISOString().slice(0, 10),
  });

  revalidatePath("/admin/assignments");
  redirect(`/admin/assignments?notice=${error ? "end-failed" : "ended"}`);
}
