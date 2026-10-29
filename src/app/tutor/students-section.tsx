import { createClient } from "@/lib/supabase/server";
import { Panel, Pill } from "@/components/ui";
import { birr, dateLabel } from "@/lib/format";
import { dayLabels, gradeLabel, requestModeLabels, timeOfDayLabels } from "@/lib/labels";

// Shown to approved tutors: their current students and what they have been paid.
export default async function StudentsSection({ tutorId }: { tutorId: string }) {
  const supabase = await createClient();

  const [{ data: assignments }, { data: payouts }, { data: subjects }] = await Promise.all([
    supabase
      .from("assignments")
      .select("id, request_id, student_id, status, start_date, end_date")
      .eq("tutor_id", tutorId)
      .order("created_at", { ascending: false }),
    supabase
      .from("tutor_payouts")
      .select("id, amount, method, paid_at")
      .eq("tutor_id", tutorId)
      .order("paid_at", { ascending: false }),
    supabase.from("subjects").select("id, name_en"),
  ]);

  const studentIds = [...new Set((assignments ?? []).map((a) => a.student_id as string))];
  const requestIds = [...new Set((assignments ?? []).map((a) => a.request_id as string))];

  const students: Record<string, { first_name: string; grade: number }> = {};
  if (studentIds.length > 0) {
    const { data } = await supabase.from("students").select("id, first_name, grade").in("id", studentIds);
    for (const s of data ?? []) students[s.id] = s;
  }
  const requests: Record<string, { subject_ids: number[]; mode: string; area: string | null; preferred_days: number[]; time_of_day: string }> = {};
  if (requestIds.length > 0) {
    const { data } = await supabase
      .from("tutoring_requests")
      .select("id, subject_ids, mode, area, preferred_days, time_of_day")
      .in("id", requestIds);
    for (const r of data ?? []) requests[r.id] = r;
  }
  const subjectName: Record<number, string> = {};
  for (const s of subjects ?? []) subjectName[s.id] = s.name_en;

  const total = (payouts ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="mt-8 space-y-6">
      <Panel title="Your students">
        {(assignments ?? []).length === 0 ? (
          <p className="text-muted">
            No students yet. We will contact you when we match you with a family.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {(assignments ?? []).map((a) => {
              const s = students[a.student_id];
              const r = requests[a.request_id];
              return (
                <li key={a.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      {s ? `${s.first_name}, ${gradeLabel(s.grade)}` : "Student"}
                    </p>
                    <Pill tone={a.status === "active" ? "green" : "neutral"}>
                      {a.status === "active" ? "Active" : "Ended"}
                    </Pill>
                  </div>
                  {r && (
                    <p className="mt-1 text-sm text-muted">
                      {r.subject_ids.map((id) => subjectName[id]).filter(Boolean).join(", ")}.{" "}
                      {requestModeLabels[r.mode]}
                      {r.area ? ` in ${r.area}` : ""}.{" "}
                      {r.preferred_days.length > 0
                        ? `Preferred: ${r.preferred_days.map((d) => dayLabels[d - 1]).join(", ")}, ${timeOfDayLabels[r.time_of_day].split(" (")[0].toLowerCase()}.`
                        : ""}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-muted">Started {dateLabel(a.start_date)}</p>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-sm text-muted">
          Family contact details are shared by the Temadeg team when a lesson plan is arranged.
        </p>
      </Panel>

      <Panel title="Your earnings">
        <p className="text-sm text-muted">Total paid to you so far</p>
        <p className="text-2xl font-bold">{birr(total)}</p>
        {(payouts ?? []).length > 0 && (
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
            {(payouts ?? []).map((p) => (
              <li key={p.id} className="flex justify-between px-4 py-3 text-sm">
                <span>{dateLabel(p.paid_at)}</span>
                <span className="font-semibold">{birr(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
