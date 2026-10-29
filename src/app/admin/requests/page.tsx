import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PageShell } from "@/components/ui";
import { dateLabel } from "@/lib/format";
import { dayLabels, gradeLabel, requestModeLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "Admin: requests" };

const tabs = [
  { key: "open", label: "Open" },
  { key: "matched", label: "Matched" },
  { key: "cancelled", label: "Cancelled" },
];

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase } = await requireRole("admin");
  const { status: s } = await searchParams;
  const status = tabs.some((t) => t.key === s) ? (s as string) : "open";

  const [{ data: requests }, { data: subjects }] = await Promise.all([
    supabase
      .from("tutoring_requests")
      .select("id, parent_id, student_id, subject_ids, mode, area, preferred_days, created_at")
      .eq("status", status)
      .order("created_at", { ascending: false }),
    supabase.from("subjects").select("id, name_en"),
  ]);

  const subjectName: Record<number, string> = {};
  for (const x of subjects ?? []) subjectName[x.id] = x.name_en;

  const parentIds = [...new Set((requests ?? []).map((r) => r.parent_id as string))];
  const studentIds = [...new Set((requests ?? []).map((r) => r.student_id as string))];
  const parents: Record<string, string> = {};
  const students: Record<string, { first_name: string; grade: number }> = {};
  if (parentIds.length > 0) {
    const { data } = await supabase.from("profiles").select("id, full_name").in("id", parentIds);
    for (const p of data ?? []) parents[p.id] = p.full_name;
  }
  if (studentIds.length > 0) {
    const { data } = await supabase.from("students").select("id, first_name, grade").in("id", studentIds);
    for (const x of data ?? []) students[x.id] = x;
  }

  return (
    <PageShell width="max-w-5xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Tutor requests</h1>
      <p className="mt-2 text-muted">Open a request to see suggested tutors and assign one.</p>

      <nav aria-label="Request status" className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/requests?status=${t.key}`}
            aria-current={t.key === status ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              t.key === status ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        {(requests ?? []).length === 0 ? (
          <p className="px-6 py-12 text-center text-muted">No {status} requests right now.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-line bg-paper text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Family</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Child</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Subjects</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Lessons</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Sent</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(requests ?? []).map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-4 font-semibold">{parents[r.parent_id] ?? "Unknown"}</td>
                    <td className="px-5 py-4">
                      {students[r.student_id] ? `${students[r.student_id].first_name}, ${gradeLabel(students[r.student_id].grade)}` : ""}
                    </td>
                    <td className="px-5 py-4">{(r.subject_ids as number[]).map((id) => subjectName[id]).filter(Boolean).join(", ")}</td>
                    <td className="px-5 py-4">
                      {requestModeLabels[r.mode]}
                      {r.area ? `, ${r.area}` : ""}
                      {(r.preferred_days as number[]).length > 0 && (
                        <span className="block text-muted">{(r.preferred_days as number[]).map((d) => dayLabels[d - 1].slice(0, 3)).join(", ")}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">{dateLabel(r.created_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/requests/${r.id}`} className="font-semibold text-brand-dark underline underline-offset-2">
                        {status === "open" ? "Match" : "View"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageShell>
  );
}
