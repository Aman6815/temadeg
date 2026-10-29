"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export type ChildState = { error?: string; ok?: boolean };

export async function addChild(_prev: ChildState, formData: FormData): Promise<ChildState> {
  const { supabase, user } = await requireRole("parent");

  const firstName = String(formData.get("firstName") ?? "").trim();
  const gradeRaw = String(formData.get("grade") ?? "");
  const grade = /^\d+$/.test(gradeRaw) ? Number(gradeRaw) : NaN;

  if (firstName.length < 1 || firstName.length > 50) {
    return { error: "Enter your child's first name." };
  }
  if (!Number.isInteger(grade) || grade < 0 || grade > 12) {
    return { error: "Choose your child's grade." };
  }

  const { error } = await supabase
    .from("students")
    .insert({ parent_id: user.id, first_name: firstName, grade });
  if (error) {
    console.error("add child failed:", error.message);
    return { error: "We could not add your child. Please try again." };
  }

  revalidatePath("/parent");
  return { ok: true };
}

export async function removeChild(formData: FormData): Promise<void> {
  const { supabase, user } = await requireRole("parent");
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase.from("students").delete().eq("id", id).eq("parent_id", user.id);
  if (error) {
    // A child with past requests or tutors cannot be removed.
    redirect("/parent?notice=child-in-use");
  }
  revalidatePath("/parent");
}

export async function cancelRequest(formData: FormData): Promise<void> {
  const { supabase, user } = await requireRole("parent");
  const id = String(formData.get("id") ?? "");

  await supabase
    .from("tutoring_requests")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("parent_id", user.id)
    .eq("status", "open");

  revalidatePath("/parent");
}
