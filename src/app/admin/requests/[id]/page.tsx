import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { PageShell, Panel, Pill } from "@/components/ui";
import { birr, dateLabel, isUuid } from "@/lib/format";
import { dayLabels, gradeLabel, requestModeLabels, requestStatusLabels, timeOfDayLabels } from "@/lib/labels";
import { matchTutor } from "@/lib/matching";
import { commissionPercent } from "@/config/site";
import AssignForm, { type Candidate } from "./assign-form";

export const metadata: Metadata = { title: "Admin: match a request" };

export default async function AdminRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireRole("admin");
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { data: req } = await supabase.from("tutoring_requests").select("*").eq("id", id).maybeSingle();
  if (!req) notFound();

  const [{ data: parent }, { data: student }, { data: subjects }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", req.parent_id).maybeSingle(),
    supabase.from("students").select("first_name, grade").eq("id", req.student_id).maybeSingle(),
    supabase.from("subjects").select("id, name_en"),
  ]);
  const subjectName: Record<number, string> = {};
  for (const s of subjects ?? []) subjectName[s.id] = s.name_en;

  const open = req.status === "open";
  let candidates: Candidate[] = [];
  let excluded = 0;

  if (open && student) {
    const { data: tutors } = await supabase
      .from("tutor_public_profiles")
      .select("tutor_id, display_name, headline, grade_min, grade_max, teaching_mode, service_areas, hourly_rate")
      .eq("is_active", true);
    const tutorIds = (tutors ?? []).map((t) => t.tutor_id as string);

    const [{ data: links }, { data: slots }] = tutorIds.length
      ? await Promise.all([
          supabase.from("tutor_subjects").select("tutor_id, subject_id").in("tutor_id", tutorIds),
          supabase.from("tutor_availability").select("tutor_id, day_of_week, start_hour, end_hour").in("tutor_id", tutorIds),
        ])
      : [{ data: [] }, { data: [] }];

    const scored = (tutors ?? []).map((t) => {
      const result = matchTutor(
        {
          grade: student.grade,
          subjectIds: req.subject_ids as number[],
          mode: req.mode,
          area: req.area,
          preferredDays: req.preferred_days as number[],
          timeOfDay: req.time_of_day,
          maxHourlyRate: req.max_hourly_rate !== null ? Number(req.max_hourly_rate) : null,
          preferredTutorId: req.preferred_tutor_id,
        },
        {
          tutor_id: t.tutor_id,
          grade_min: t.grade_min,
          grade_max: t.grade_max,
          teaching_mode: t.teaching_mode,
          service_areas: t.service_areas as string[],
          hourly_rate: t.hourly_rate !== null ? Number(t.hourly_rate) : null,
        },
        (links ?? []).filter((l) => l.tutor_id === t.tutor_id).map((l) => l.subject_id as number),
        (slots ?? []).filter((s) => s.tutor_id === t.tutor_id)
      );
      return { t, result };
    });

    excluded = scored.filter((x) => !x.result.eligible).length;
    candidates = scored
      .filter((x) => x.result.eligible)
      .sort((a, b) => b.result.score - a.result.score)
      .map(({ t, result }) => ({
        tutorId: t.tutor_id,
        name: t.display_name,
        headline: t.headline ?? "",
        rate: t.hourly_rate !== null ? `${birr(t.hourly_rate)} per hour` : "",
        score: result.score,
        reasons: result.reasons,
        warnings: result.warnings,
        chosenByFamily: req.preferred_tutor_id === t.tutor_id,
      }));
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <PageShell width="max-w-4xl">
      <Link href="/admin/requests" className="text-sm font-semibold text-brand-dark underline underline-offset-2">Back to requests</Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {student ? `${student.first_name}, ${gradeLabel(student.grade)}` : "Request"}
        </h1>
        <Pill tone={open ? "gold" : req.status === "matched" ? "green" : "neutral"}>{requestStatusLabels[req.status]}</Pill>
      </div>

      <div className="mt-6">
        <Panel title="The request">
          <dl className="divide-y divide-line">
            {[
              ["Family", parent ? `${parent.full_name}${parent.phone ? `, ${parent.phone}` : ""}` : ""],
              ["Subjects", (req.subject_ids as number[]).map((s) => subjectName[s]).filter(Boolean).join(", ")],
              ["Lessons", `${requestModeLabels[req.mode]}${req.area ? `, ${req.area}` : ""}`],
              ["Preferred days", (req.preferred_days as number[]).map((d) => dayLabels[d - 1]).join(", ") || "No preference"],
              ["Time of day", timeOfDayLabels[req.time_of_day]],
              ["Budget", req.max_hourly_rate !== null ? `${birr(req.max_hourly_rate)} per hour` : "Not given"],
              ["Note", req.note ?? ""],
              ["Sent", dateLabel(req.created_at)],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
                  <dt className="text-sm font-semibold text-muted">{k}</dt>
                  <dd className="whitespace-pre-line">{v}</dd>
                </div>
              ))}
          </dl>
        </Panel>
      </div>

      {open && (
        <div className="mt-6">
          <Panel title="Suggested tutors">
            {candidates.length === 0 ? (
              <p className="text-muted">
                No approved tutor fits this request yet{excluded > 0 ? ` (${excluded} did not match grade, subjects or lesson type)` : ""}.
                Approve more tutors, or ask the family to adjust the request.
              </p>
            ) : (
              <>
                <p className="mb-5 text-sm text-muted">
                  Ranked by grade, subjects, lesson type, area, schedule and budget. {excluded > 0 ? `${excluded} other tutors were left out because they do not fit. ` : ""}You make the final choice.
                </p>
                <AssignForm requestId={req.id} candidates={candidates} today={today} commissionPercent={commissionPercent} />
              </>
            )}
          </Panel>
        </div>
      )}
    </PageShell>
  );
}
