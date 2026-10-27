import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { PageShell } from "@/components/ui";
import DocumentsStep from "./documents-step";
import ReviewStep from "./review-step";
import StepForm from "./step-form";
import Stepper from "./stepper";
import { applySteps } from "./steps";

export const metadata: Metadata = { title: "Tutor application" };

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { supabase, user } = await requireRole("tutor");

  const total = applySteps.length;
  const { step: stepParam } = await searchParams;
  const step = Math.min(Math.max(Number(stepParam) || 1, 1), total);

  const { data: application } = await supabase
    .from("tutor_applications")
    .select(
      "status, city, sub_city, telegram_username, is_student, education_level, institution, tutoring_experience, headline, bio, years_experience, teaching_languages, grade_min, grade_max, teaching_mode, service_areas, availability_note, expected_hourly_fee"
    )
    .eq("tutor_id", user.id)
    .maybeSingle();

  // No application yet, or it is no longer editable: back to the dashboard.
  if (!application) redirect("/tutor");
  if (application.status !== "draft" && application.status !== "needs_info") {
    redirect("/tutor");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", user.id)
    .single();

  const defaults = {
    phone: profile?.phone ?? "",
    telegram_username: application.telegram_username ?? "",
    city: application.city ?? "",
    sub_city: application.sub_city ?? "",
    is_student: application.is_student,
    education_level: application.education_level ?? "",
    institution: application.institution ?? "",
    tutoring_experience: application.tutoring_experience ?? "",
    headline: application.headline ?? "",
    bio: application.bio ?? "",
    years_experience: String(application.years_experience ?? ""),
    teaching_languages: (application.teaching_languages ?? []) as string[],
    grade_min: String(application.grade_min ?? ""),
    grade_max: String(application.grade_max ?? ""),
    teaching_mode: application.teaching_mode ?? "",
    service_areas: ((application.service_areas ?? []) as string[]).join(", "),
    availability_note: application.availability_note ?? "",
    expected_hourly_fee: String(application.expected_hourly_fee ?? ""),
  };

  let body: React.ReactNode;

  if (step <= 4) {
    const { data: slots } = await supabase
      .from("tutor_availability")
      .select("day_of_week, start_hour, end_hour")
      .eq("tutor_id", user.id);

    const availability: Record<number, { start: number; end: number }> = {};
    for (const s of slots ?? []) {
      availability[s.day_of_week] = { start: s.start_hour, end: s.end_hour };
    }

    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, name_en")
      .order("sort_order");

    const { data: mine } = await supabase
      .from("tutor_subjects")
      .select("subject_id")
      .eq("tutor_id", user.id);

    body = (
      <StepForm
        key={step}
        step={step}
        defaults={defaults}
        availability={availability}
        subjects={subjects ?? []}
        selectedSubjects={(mine ?? []).map((m) => m.subject_id as number)}
      />
    );
  } else if (step === 5) {
    const { data: documents } = await supabase
      .from("documents")
      .select("id, doc_type, original_name, size_bytes")
      .eq("tutor_id", user.id)
      .order("created_at");

    body = <DocumentsStep documents={documents ?? []} isStudent={application.is_student} />;
  } else {
    body = <ReviewStep />;
  }

  const current = applySteps[step - 1];

  return (
    <PageShell>
      <h1 className="font-display text-3xl font-bold tracking-tight">Tutor application</h1>
      <div className="mt-6">
        <Stepper step={step} />
      </div>

      <section className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-display text-2xl font-bold">{current.title}</h2>
        <p className="mt-1 mb-6 text-muted">{current.description}</p>
        {body}
      </section>
    </PageShell>
  );
}
