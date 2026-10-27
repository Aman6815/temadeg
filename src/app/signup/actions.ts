"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignupState = { error?: string };

export async function signup(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  // Only parent or tutor can be chosen. Admin is never possible here.
  const role = formData.get("role") === "tutor" ? "tutor" : "parent";

  if (fullName.length < 1 || fullName.length > 100) {
    return { error: "ሙሉ ስምዎን ያስገቡ (Please enter your full name)." };
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "ትክክለኛ ኢሜይል ያስገቡ (Please enter a valid email)." };
  }
  if (password.length < 8) {
    return { error: "የይለፍ ቃል ቢያንስ 8 ቁምፊዎች መሆን አለበት (Password must be at least 8 characters)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  });

  if (error) {
    console.error("signup failed:", error.message);
    if (error.code === "weak_password") {
      return { error: "የይለፍ ቃሉ ደካማ ነው። ፊደላትንና ቁጥሮችን ይጠቀሙ (Password too weak: use letters and digits)." };
    }
    // Generic message: don't reveal whether an email is already registered.
    return { error: "አካውንቱን መፍጠር አልተቻለም። እንደገና ይሞክሩ (Could not create the account. Please try again)." };
  }

  redirect(role === "tutor" ? "/tutor" : "/account");
}