import type { Metadata } from "next";
import { PageShell } from "@/components/ui";
import SignupForm from "./signup-form";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const defaultRole = role === "tutor" ? "tutor" : "parent";

  return (
    <PageShell width="max-w-lg">
      <h1 className="font-display text-3xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-2 text-muted">It takes a minute. You can finish the rest later.</p>
      <SignupForm defaultRole={defaultRole} />
    </PageShell>
  );
}
