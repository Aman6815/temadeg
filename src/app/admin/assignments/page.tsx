import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { Alert, buttonClass, PageShell, Pill } from "@/components/ui";
import { birr, dateLabel } from "@/lib/format";
import { gradeLabel } from "@/lib/labels";
import { commissionPercent } from "@/config/site";
import { createInvoice, endAssignment } from "./actions";

export const metadata: Metadata = { title: "Admin: assignments" };

const notices: Record<string, { tone: "success" | "error"; text: string }> = {
  assigned: { tone: "success", text: "Tutor assigned. Create the first monthly bill when the lessons start." },
  "invoice-created": { tone: "success", text: "This month's bill was created. The family can now see it." },
  "invoice-exists": { tone: "error", text: "A bill for this month already exists for that assignment." },
  ended: { tone: "success", text: "The assignment was ended." },
  "end-failed": { tone: "error", text: "The assignment could not be ended." },
};

export default async function AdminAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; notice?: string }>;
}) {
  const { supabase } = await requireRole("admin");
  const { status: s, notice } = await searchParams;
  const status = s === "ended" ? "ended" : "active";

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, parent_id, student_id, tutor_id, monthly_fee, commission_rate, start_date, end_date")
    .eq("status", status)
    .order("created_at", { ascending: false });

  const personIds = [...new Set((assignments ?? []).flatMap((a) => [a.parent_id as string, a.tutor_id as string]))];
  const studentIds = [...new Set((assignments ?? []).map((a) => a.student_id as string))];
  const names: Record<string, string> = {};
  const kids: Record<string, string> = {};
  if (personIds.length > 0) {
    const { data } = await supabase.from("profiles").select("id, full_name").in("id", personIds);
    for (const p of data ?? []) names[p.id] = p.full_name;
  }
  if (studentIds.length > 0) {
    const { data } = await supabase.from("students").select("id, first_name, grade").in("id", studentIds);
    for (const k of data ?? []) kids[k.id] = `${k.first_name}, ${gradeLabel(k.grade)}`;
  }

  const n = notice ? notices[notice] : undefined;

  return (
    <PageShell width="max-w-5xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Assignments</h1>
      <p className="mt-2 text-muted">Tutors matched with families. Create one bill per month for each active assignment.</p>

      {n && <div className="mt-6"><Alert tone={n.tone}>{n.text}</Alert></div>}

      <nav aria-label="Assignment status" className="mt-6 flex gap-2">
        {[["active", "Active"], ["ended", "Ended"]].map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/assignments?status=${key}`}
            aria-current={key === status ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              key === status ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 space-y-4">
        {(assignments ?? []).length === 0 && (
          <p className="rounded-2xl border border-line bg-white px-6 py-12 text-center text-muted">No {status} assignments.</p>
        )}
        {(assignments ?? []).map((a) => {
          const fee = Number(a.monthly_fee);
          const commission = Math.round(fee * Number(a.commission_rate) * 100) / 100;
          return (
            <section key={a.id} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold">{kids[a.student_id] ?? "Student"}</h2>
                  <p className="mt-1 text-muted">
                    Family: {names[a.parent_id] ?? "Unknown"}. Tutor: {names[a.tutor_id] ?? "Unknown"}.
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Started {dateLabel(a.start_date)}
                    {a.end_date ? `, ended ${dateLabel(a.end_date)}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{birr(fee)}</p>
                  <p className="text-sm text-muted">
                    Temadeg {birr(commission)} ({Math.round(Number(a.commission_rate) * 100) || commissionPercent}%), tutor {birr(fee - commission)}
                  </p>
                </div>
              </div>

              {status === "active" && (
                <div className="mt-5 flex flex-wrap gap-3">
                  <form action={createInvoice}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className={buttonClass("primary")}>Create this month&apos;s bill</button>
                  </form>
                  <form action={endAssignment}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className={buttonClass("secondary")}>End assignment</button>
                  </form>
                </div>
              )}
              {status === "ended" && <div className="mt-4"><Pill>Ended</Pill></div>}
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}
