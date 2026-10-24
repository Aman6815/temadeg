import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

const roleLabels: Record<string, string> = {
  parent: "ወላጅ (Parent)",
  tutor: "አስጠኚ (Tutor)",
  admin: "አስተዳዳሪ (Administrator)",
};

export default async function AccountPage() {
  const supabase = await createClient();

  // getUser() asks Supabase to verify the login. It is safer than trusting
  // the cookie alone, so we always use it for access checks.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-3xl font-bold">ተማደግ</h1>
      <p className="mt-4 text-xl">{profile?.full_name}</p>
      <p className="opacity-70">{roleLabels[profile?.role ?? ""] ?? ""}</p>

      <form action={signOut} className="mt-6">
        <button type="submit" className="rounded border px-4 py-2">
          ውጣ (Sign out)
        </button>
      </form>
    </main>
  );
}