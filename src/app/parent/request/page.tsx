import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { buttonClass, PageShell } from "@/components/ui";
import { isUuid } from "@/lib/format";
import RequestForm from "./request-form";

export const metadata: Metadata = { title: "Request a tutor" };

export default async function RequestTutorPage({
  searchParams,
}: {
  searchParams: Promise<{ tutor?: string }>;
}) {
  const { supabase } = await requireRole("parent");
  const { tutor } = await searchParams;

  const [{ data: students }, { data: subjects }] = await Promise.all([
    supabase.from("students").select("id, first_name, grade").order("created_at"),
    supabase.from("subjects").select("id, name_en").order("sort_order"),
  ]);

  let preferredTutor: { id: string; name: string } | null = null;
  if (tutor && isUuid(tutor)) {
    const { data } = await supabase
      .from("tutor_public_profiles")
      .select("tutor_id, display_name")
      .eq("tutor_id", tutor)
      .eq("is_active", true)
      .maybeSingle();
    if (data) preferredTutor = { id: data.tutor_id, name: data.display_name };
  }

  return (
    <PageShell>
      <h1 className="font-display text-3xl font-bold tracking-tight">Request a tutor</h1>
      <p className="mt-2 max-w-xl text-muted">
        Tell us what your child needs. We review verified tutors and confirm the match ourselves.
      </p>

      <section className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        {(students ?? []).length === 0 ? (
          <div>
            <p className="text-muted">Add your child first, so we know their grade.</p>
            <Link href="/parent" className={`${buttonClass("primary")} mt-4`}>Add a child</Link>
          </div>
        ) : (
          <RequestForm students={students ?? []} subjects={subjects ?? []} preferredTutor={preferredTutor} />
        )}
      </section>
    </PageShell>
  );
}
