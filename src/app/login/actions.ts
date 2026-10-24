"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "ኢሜይልና የይለፍ ቃል ያስገቡ (Please enter your email and password)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Same message for a wrong email or a wrong password, so attackers
    // can't discover which emails are registered.
    return { error: "ኢሜይሉ ወይም የይለፍ ቃሉ ትክክል አይደለም (Incorrect email or password)." };
  }

  redirect("/account");
}