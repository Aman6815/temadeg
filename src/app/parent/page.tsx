import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { Alert, PageShell } from "@/components/ui";

export const metadata: Metadata = { title: "Your family area" };

export default async function ParentHomePage() {
  const { profile } = await requireRole("parent");

  return (
    <PageShell>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Welcome, {profile.full_name.split(" ")[0]}
      </h1>
      <p className="mt-2 max-w-xl text-muted">
        Your account is ready. Soon you will be able to add your child, tell us what they need,
        and see the tutors we recommend, right here.
      </p>
      <div className="mt-8">
        <Alert tone="info">Tutor requests are the next feature we are adding to this page.</Alert>
      </div>
    </PageShell>
  );
}
