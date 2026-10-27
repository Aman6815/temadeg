"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/roles";

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
    return { error: "Enter your full name." };
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Your password must be at least 8 characters." };
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
      return { error: "That password is too easy to guess. Use at least 8 characters with letters and numbers." };
    }
    // Generic message: do not reveal whether an email is already registered.
    return { error: "We could not create your account. Check your details and try again." };
  }

  redirect(roleHome(role));
}
