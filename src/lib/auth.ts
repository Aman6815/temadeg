import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Role = "parent" | "tutor" | "admin";

// Use at the top of any protected page or server action.
// Sends logged-out users to /login and users with the wrong role to /account.
export async function requireRole(role: Role) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== role) redirect("/account");

  return { supabase, user, profile };
}