"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export async function startApplication() {
  const { supabase, user } = await requireRole("tutor");

  const { error } = await supabase
    .from("tutor_applications")
    .insert({ tutor_id: user.id });

  // 23505 means the application already exists, which is fine.
  if (error && error.code !== "23505") {
    console.error("start application failed:", error.message);
  }

  redirect("/tutor");
}
