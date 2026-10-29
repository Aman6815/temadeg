import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { buttonClass, inputClass, PageShell, Pill } from "@/components/ui";
import { birr } from "@/lib/format";
import { gradeLabel, languageLabels, modeLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "Browse tutors" };

type Params = { subject?: string; grade?: string; mode?: string; area?: string; maxRate?: string };

export default async function BrowseTutorsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { supabase } = await requireRole("parent");
  const p = await searchParams;

  const [{ data: tutors }, { data: subjects }, { data: links }] = await Promise.all([
    supabase
      .from("tutor_public_profiles")
      .select("tutor_id, display_name, headline, years_experience, teaching_languages, service_areas, teaching_mode, grade_min, grade_max, hourly_rate")
      .eq("is_active", true)
      .order("display_name"),
    supabase.from("subjects").select("id, name_en").order("sort_order"),
    supabase.from("tutor_subjects").select("tutor_id, subject_id"),
  ]);

  const subjectName: Record<number, string> = {};
  for (const s of subjects ?? []) subjectName[s.id] = s.name_en;
  const subjectsOf: Record<string, number[]> = {};
  for (const l of links ?? []) (subjectsOf[l.tutor_id] ??= []).push(l.subject_id);

  const subjectFilter = /^\d+$/.test(p.subject ?? "") ? Number(p.subject) : null;
  const gradeFilter = /^\d+$/.test(p.grade ?? "") ? Number(p.grade) : null;
  const modeFilter = p.mode === "online" || p.mode === "in_person" ? p.mode : null;
  const areaFilter = (p.area ?? "").trim().toLowerCase();
  const rateFilter = /^\d+$/.test(p.maxRate ?? "") ? Number(p.maxRate) : null;

  const shown = (tutors ?? []).filter((t) => {
    if (subjectFilter !== null && !(subjectsOf[t.tutor_id] ?? []).includes(subjectFilter)) return false;
    if (gradeFilter !== null && (gradeFilter < t.grade_min || gradeFilter > t.grade_max)) return false;
    if (modeFilter === "online" && t.teaching_mode === "in_person") return false;
    if (modeFilter === "in_person" && t.teaching_mode === "online") return false;
    if (areaFilter && !(t.service_areas as string[]).some((a) => a.toLowerCase().includes(areaFilter))) return false;
    if (rateFilter !== null && t.hourly_rate !== null && Number(t.hourly_rate) > rateFilter) return false;
    return true;
  });

  return (
    <PageShell width="max-w-5xl">
      <Link href="/parent" className="text-sm font-semibold text-brand-dark underline underline-offset-2">Back to your area</Link>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Browse tutors</h1>
      <p className="mt-2 max-w-xl text-muted">Every tutor here has been verified by Temadeg.</p>

      <form className="mt-6 grid gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5" method="get">
        <label className="block">
          <span className="text-sm font-semibold">Subject</span>
          <select name="subject" defaultValue={p.subject ?? ""} className={inputClass}>
            <option value="">Any</option>
            {(subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.name_en}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Grade</span>
          <select name="grade" defaultValue={p.grade ?? ""} className={inputClass}>
            <option value="">Any</option>
            {Array.from({ length: 13 }, (_, g) => <option key={g} value={g}>{gradeLabel(g)}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Lessons</span>
          <select name="mode" defaultValue={p.mode ?? ""} className={inputClass}>
            <option value="">Any</option>
            <option value="online">Online</option>
            <option value="in_person">In person</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Neighborhood</span>
          <input name="area" defaultValue={p.area ?? ""} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Max birr per hour</span>
          <input name="maxRate" type="number" min={0} defaultValue={p.maxRate ?? ""} className={inputClass} />
        </label>
        <div className="flex gap-3 sm:col-span-2 lg:col-span-5">
          <button type="submit" className={buttonClass("primary")}>Apply filters</button>
          <Link href="/tutors" className={buttonClass("ghost")}>Clear</Link>
        </div>
      </form>

      <p className="mt-6 text-sm text-muted">
        {shown.length} {shown.length === 1 ? "tutor" : "tutors"} found
      </p>

      {shown.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-line bg-white px-6 py-12 text-center text-muted">
          No tutors match yet. Try fewer filters, or send a request and we will find someone for you.
        </p>
      ) : (
        <ul className="mt-4 grid gap-5 md:grid-cols-2">
          {shown.map((t) => (
            <li key={t.tutor_id} className="flex flex-col rounded-2xl border border-line bg-white p-6 shadow-sm">
              <h2 className="font-display text-xl font-bold">{t.display_name}</h2>
              <p className="mt-1 text-muted">{t.headline}</p>
              <p className="mt-3 text-sm">
                {gradeLabel(t.grade_min)} to {gradeLabel(t.grade_max)}, {modeLabels[t.teaching_mode].toLowerCase()}
                {t.hourly_rate !== null ? `, ${birr(t.hourly_rate)} per hour` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(subjectsOf[t.tutor_id] ?? []).map((id) => <Pill key={id} tone="blue">{subjectName[id]}</Pill>)}
              </div>
              <p className="mt-3 text-sm text-muted">
                Languages: {(t.teaching_languages as string[]).map((l) => languageLabels[l] ?? l).join(", ")}
              </p>
              <div className="mt-5 pt-1">
                <Link href={`/tutors/${t.tutor_id}`} className={buttonClass("secondary")}>View profile</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
