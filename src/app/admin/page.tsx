import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PageShell, StatusBadge } from "@/components/ui";
import { gradeLabel, modeLabels, statusLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "Admin" };

const tabs = ["submitted", "needs_info", "approved", "rejected"] as const;

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "Not submitted";

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase, profile } = await requireRole("admin");

  const { status: statusParam } = await searchParams;
  const status = (tabs as readonly string[]).includes(statusParam ?? "") ? (statusParam as string) : "submitted";

  const counts = await Promise.all(
    tabs.map(async (t) => {
      const { count } = await supabase
        .from("tutor_applications")
        .select("id", { count: "exact", head: true })
        .eq("status", t);
      return [t, count ?? 0] as const;
    })
  );

  const { data: applications } = await supabase
    .from("tutor_applications")
    .select("id, tutor_id, city, grade_min, grade_max, teaching_mode, submitted_at, reviewed_at")
    .eq("status", status)
    .order("submitted_at", { ascending: false, nullsFirst: false });

  const ids = (applications ?? []).map((a) => a.tutor_id as string);
  const names: Record<string, { full_name: string; phone: string | null }> = {};
  if (ids.length > 0) {
    const { data: people } = await supabase.from("profiles").select("id, full_name, phone").in("id", ids);
    for (const p of people ?? []) names[p.id] = { full_name: p.full_name, phone: p.phone };
  }

  return (
    <PageShell width="max-w-5xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Admin</h1>
      <p className="mt-2 text-muted">Signed in as {profile.full_name}. Review tutor applications below.</p>

      <nav aria-label="Application status" className="mt-8 flex flex-wrap gap-2">
        {counts.map(([t, n]) => (
          <Link
            key={t}
            href={`/admin?status=${t}`}
            aria-current={t === status ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              t === status
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-ink hover:border-brand"
            }`}
          >
            {statusLabels[t]} ({n})
          </Link>
        ))}
      </nav>

      <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        {(applications ?? []).length === 0 ? (
          <p className="px-6 py-12 text-center text-muted">
            No applications are {statusLabels[status].toLowerCase()} right now.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-line bg-paper text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Tutor</th>
                  <th scope="col" className="px-5 py-3 font-semibold">City</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Grades</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Teaching</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Submitted</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(applications ?? []).map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{names[a.tutor_id]?.full_name ?? "Unknown"}</p>
                      <p className="text-muted">{names[a.tutor_id]?.phone ?? ""}</p>
                    </td>
                    <td className="px-5 py-4">{a.city ?? ""}</td>
                    <td className="px-5 py-4">
                      {a.grade_min !== null && a.grade_max !== null
                        ? `${gradeLabel(a.grade_min)} to ${gradeLabel(a.grade_max)}`
                        : ""}
                    </td>
                    <td className="px-5 py-4">{a.teaching_mode ? modeLabels[a.teaching_mode] : ""}</td>
                    <td className="px-5 py-4">{formatDate(a.submitted_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/applications/${a.id}`} className="font-semibold text-brand-dark underline underline-offset-2">
                        {status === "submitted" ? "Review" : "View"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-4 text-sm text-muted">
        Current filter: <StatusBadge status={status} />
      </p>
    </PageShell>
  );
}
