"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { isUuid } from "@/lib/format";
import { site } from "@/config/site";

export type AssignState = { error?: string };

export async function assignTutor(_prev: AssignState, formData: FormData): Promise<AssignState> {
  const { supabase } = await requireRole("admin");

  const requestId = String(formData.get("requestId") ?? "");
  const tutorId = String(formData.get("tutorId") ?? "");
  const fee = Number(String(formData.get("monthlyFee") ?? ""));
  const startDate = String(formData.get("startDate") ?? "");

  if (!isUuid(requestId)) return { error: "This request could not be found." };
  if (!isUuid(tutorId)) return { error: "Choose a tutor." };
  if (!Number.isFinite(fee) || fee <= 0 || fee > 1_000_000) {
    return { error: "Enter the monthly fee in birr." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return { error: "Choose a start date." };

  const { error } = await supabase.rpc("assign_tutor", {
    p_request_id: requestId,
    p_tutor_id: tutorId,
    p_monthly_fee: fee,
    p_commission_rate: site.commissionRate,
    p_start_date: startDate,
  });
  if (error) {
    console.error("assign failed:", error.message);
    return { error: "We could not assign this tutor. The request may already be matched." };
  }

  redirect("/admin/assignments?notice=assigned");
}
