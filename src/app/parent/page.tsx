import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { Alert, buttonClass, PageShell, Panel, Pill } from "@/components/ui";
import { birr, dateLabel } from "@/lib/format";
import { gradeLabel, requestModeLabels } from "@/lib/labels";
import AddChildForm from "./children-section";
import { cancelRequest, removeChild } from "./actions";

export const metadata: Metadata = { title: "Your family area" };

const notices: Record<string, { tone: "info" | "success" | "error"; text: string }> = {
  "request-sent": { tone: "success", text: "Your request was sent. We will find a verified tutor and update this page." },
  "child-in-use": { tone: "error", text: "This child has tutor requests or lessons on record, so they cannot be removed." },
};

export default async function ParentHomePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { supabase, user, profile } = await requireRole("parent");
  const { notice } = await searchParams;

  const [{ data: students }, { data: requests }, { data: assignments }, { data: subjects }] = await Promise.all([
    supabase.from("students").select("id, first_name, grade").order("created_at"),
    supabase
      .from("tutoring_requests")
      .select("id, student_id, subject_ids, mode, status, created_at")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("assignments")
      .select("id, student_id, tutor_id, monthly_fee, status, start_date")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("subjects").select("id, name_en"),
  ]);

  const childName: Record<string, string> = {};
  for (const s of students ?? []) childName[s.id] = s.first_name;
  const subjectName: Record<number, string> = {};
  for (const s of subjects ?? []) subjectName[s.id] = s.name_en;

  const tutorIds = [...new Set((assignments ?? []).map((a) => a.tutor_id as string))];
  const tutorName: Record<string, string> = {};
  if (tutorIds.length > 0) {
    const { data: tutors } = await supabase
      .from("tutor_public_profiles")
      .select("tutor_id, display_name")
      .in("tutor_id", tutorIds);
    for (const t of tutors ?? []) tutorName[t.tutor_id] = t.display_name;
  }

  const hasChildren = (students ?? []).length > 0;
  const n = notice ? notices[notice] : undefined;

  return (
    <PageShell width="max-w-5xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Welcome, {profile.full_name.split(" ")[0]}
      </h1>
      <p className="mt-2 text-muted">Manage your children, tutor requests and monthly bills here.</p>

      {n && <div className="mt-6"><Alert tone={n.tone}>{n.text}</Alert></div>}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/parent/request" className={buttonClass("primary", "lg")}>Request a tutor</Link>
        <Link href="/tutors" className={buttonClass("secondary", "lg")}>Browse tutors</Link>
        <Link href="/parent/billing" className={buttonClass("secondary", "lg")}>Bills and payments</Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Panel title="Your tutors">
            {(assignments ?? []).length === 0 ? (
              <p className="text-muted">No tutor is assigned yet. Send a request and we will find the right match.</p>
            ) : (
              <ul className="divide-y divide-line">
                {(assignments ?? []).map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-semibold">
                        {childName[a.student_id] ?? "Your child"} with {tutorName[a.tutor_id] ?? "your tutor"}
                      </p>
                      <p className="text-sm text-muted">
                        {birr(a.monthly_fee)} per month, started {dateLabel(a.start_date)}
                      </p>
                    </div>
                    <Pill tone={a.status === "active" ? "green" : "neutral"}>
                      {a.status === "active" ? "Active" : "Ended"}
                    </Pill>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Your requests">
            {(requests ?? []).length === 0 ? (
              <p className="text-muted">You have not sent a request yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {(requests ?? []).map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-semibold">
                        {childName[r.student_id] ?? "Your child"}:{" "}
                        {(r.subject_ids as number[]).map((id) => subjectName[id]).filter(Boolean).join(", ")}
                      </p>
                      <p className="text-sm text-muted">
                        {requestModeLabels[r.mode]}, sent {dateLabel(r.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Pill tone={r.status === "matched" ? "green" : r.status === "open" ? "gold" : "neutral"}>
                        {r.status === "open" ? "Finding a tutor" : r.status === "matched" ? "Tutor assigned" : "Cancelled"}
                      </Pill>
                      {r.status === "open" && (
                        <form action={cancelRequest}>
                          <input type="hidden" name="id" value={r.id} />
                          <button type="submit" className="text-sm font-semibold text-muted underline underline-offset-2 hover:text-ink">
                            Cancel
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel title="Your children">
          {hasChildren ? (
            <ul className="divide-y divide-line">
              {(students ?? []).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold">{s.first_name}</p>
                    <p className="text-sm text-muted">{gradeLabel(s.grade)}</p>
                  </div>
                  <form action={removeChild}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="text-sm font-semibold text-muted underline underline-offset-2 hover:text-ink">
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">Add your child to start. You need at least one child to request a tutor.</p>
          )}
          <AddChildForm />
        </Panel>
      </div>
    </PageShell>
  );
}
