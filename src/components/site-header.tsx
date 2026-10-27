import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/account/actions";
import { roleHome } from "@/lib/roles";
import { site } from "@/config/site";
import { buttonClass } from "./ui";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
      <Image src="/logo.png" alt="" width={40} height={40} priority className="h-10 w-10" />
      <span className="font-display text-xl font-bold tracking-tight">{site.name}</span>
    </Link>
  );
}

export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let firstName: string | null = null;
  let role: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle();
    firstName = data?.full_name?.split(" ")[0] ?? null;
    role = data?.role ?? null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <Link href="/#how-it-works" className={buttonClass("ghost")}>How it works</Link>
          <Link href="/#for-tutors" className={buttonClass("ghost")}>For tutors</Link>
          <Link href="/#safety" className={buttonClass("ghost")}>Safety</Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href={roleHome(role)} className={buttonClass("secondary")}>
                {firstName ? `${firstName}'s area` : "My area"}
              </Link>
              <form action={signOut}>
                <button type="submit" className={buttonClass("ghost")}>Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClass("ghost")}>Log in</Link>
              <Link href="/signup" className={buttonClass("primary")}>Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
