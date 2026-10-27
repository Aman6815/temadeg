"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export type ReviewState = { error?: string };

const DECISIONS = ["approved", "needs_info", "rejected"];

export async function reviewApplication(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const { supabase } = await requireRole("admin");

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim();

  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "This application could not be found." };
  if (!DECISIONS.includes(decision)) return { error: "Choose a decision." };
  if (feedback.length > 2000) return { error: "Your note is too long. Keep it under 2,000 characters." };
  if (decision !== "approved" && feedback.length < 5) {
    return { error: "Write a short note so the tutor knows what to fix or why they were not approved." };
  }

  // The database function checks that the caller is an admin and records the action.
  const { error } = await supabase.rpc("review_application", {
    p_application_id: id,
    p_status: decision,
    p_feedback: feedback || null,
  });
  if (error) {
    console.error("review failed:", error.message);
    return { error: "We could not save your decision. The application may already have been reviewed." };
  }

  revalidatePath("/admin");
  redirect(`/admin?status=${decision}`);
}
