import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/roles";

type Role = "parent" | "tutor" | "admin";

// Use at the top of any protected page or server action.
// Logged-out users go to /login; users with the wrong role go to their own area.
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

  if (!profile) redirect("/login");
  if (profile.role !== role) redirect(roleHome(profile.role));

  return { supabase, user, profile };
}
