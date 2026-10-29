import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { buttonClass, PageShell, Panel, Pill } from "@/components/ui";
import { birr, isUuid } from "@/lib/format";
import { dayLabels, gradeLabel, hourLabel, languageLabels, modeLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "Tutor profile" };

export default async function TutorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireRole("parent");
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { data: tutor } = await supabase
    .from("tutor_public_profiles")
    .select("tutor_id, display_name, headline, bio, years_experience, teaching_languages, service_areas, teaching_mode, grade_min, grade_max, hourly_rate")
    .eq("tutor_id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (!tutor) notFound();

  const [{ data: links }, { data: subjects }, { data: slots }] = await Promise.all([
    supabase.from("tutor_subjects").select("subject_id").eq("tutor_id", id),
    supabase.from("subjects").select("id, name_en"),
    supabase.from("tutor_availability").select("day_of_week, start_hour, end_hour").eq("tutor_id", id).order("day_of_week"),
  ]);
  const subjectName: Record<number, string> = {};
  for (const s of subjects ?? []) subjectName[s.id] = s.name_en;

  return (
    <PageShell width="max-w-3xl">
      <Link href="/tutors" className="text-sm font-semibold text-brand-dark underline underline-offset-2">Back to tutors</Link>

      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">{tutor.display_name}</h1>
      <p className="mt-1 text-lg text-muted">{tutor.headline}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(links ?? []).map((l) => <Pill key={l.subject_id} tone="blue">{subjectName[l.subject_id]}</Pill>)}
      </div>

      <div className="mt-8 space-y-6">
        <Panel title="About">
          <p className="whitespace-pre-line leading-relaxed">{tutor.bio}</p>
        </Panel>

        <Panel title="Teaching details">
          <dl className="divide-y divide-line">
            {[
              ["Grades", `${gradeLabel(tutor.grade_min)} to ${gradeLabel(tutor.grade_max)}`],
              ["Lessons", modeLabels[tutor.teaching_mode]],
              ["Neighborhoods", (tutor.service_areas as string[]).join(", ")],
              ["Languages", (tutor.teaching_languages as string[]).map((l) => languageLabels[l] ?? l).join(", ")],
              ["Experience", tutor.years_experience !== null ? `${tutor.years_experience} years` : ""],
              ["Hourly rate", tutor.hourly_rate !== null ? birr(tutor.hourly_rate) : "Agreed when matched"],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
                  <dt className="text-sm font-semibold text-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
        </Panel>

        <Panel title="Usual availability">
          {(slots ?? []).length === 0 ? (
            <p className="text-muted">Availability will be confirmed when matched.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(slots ?? []).map((s) => (
                <li key={s.day_of_week} className="flex justify-between py-2">
                  <span className="font-semibold">{dayLabels[s.day_of_week - 1]}</span>
                  <span className="text-muted">{hourLabel(s.start_hour)} to {hourLabel(s.end_hour)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-8">
        <Link href={`/parent/request?tutor=${tutor.tutor_id}`} className={buttonClass("primary", "lg")}>
          Request {tutor.display_name.split(" ")[0]}
        </Link>
        <p className="mt-3 text-sm text-muted">We will confirm the match with you. Tutor contact details are shared through Temadeg.</p>
      </div>
    </PageShell>
  );
}
