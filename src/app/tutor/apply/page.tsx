import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import StepForm from "./step-form";

const TOTAL_STEPS = 3; // will grow when we add documents and review

const stepTitles = [
  "የግል መረጃ (Personal information)",
  "ትምህርትና ልምድ (Education and experience)",
  "የማስጠናት ምርጫ (Teaching preferences)",
];

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { supabase, user } = await requireRole("tutor");

  const { step: stepParam } = await searchParams;
  const step = Math.min(Math.max(Number(stepParam) || 1, 1), TOTAL_STEPS);

  const { data: application } = await supabase
    .from("tutor_applications")
    .select(
      "status, city, sub_city, is_student, education_level, institution, tutoring_experience, child_teaching_experience, grade_min, grade_max, availability_note, expected_monthly_fee"
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
    city: application.city ?? "",
    sub_city: application.sub_city ?? "",
    is_student: application.is_student,
    education_level: application.education_level ?? "",
    institution: application.institution ?? "",
    tutoring_experience: application.tutoring_experience ?? "",
    child_teaching_experience: application.child_teaching_experience ?? "",
    grade_min: String(application.grade_min ?? ""),
    grade_max: String(application.grade_max ?? ""),
    availability_note: application.availability_note ?? "",
    expected_monthly_fee: String(application.expected_monthly_fee ?? ""),
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-3xl font-bold">ተማደግ</h1>
      <p className="mt-1 opacity-70">
        ደረጃ {step} ከ {TOTAL_STEPS} (Step {step} of {TOTAL_STEPS})
      </p>

      <div className="mt-2 h-2 rounded bg-gray-500/30">
        <div
          className="h-2 rounded bg-green-700"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <h2 className="mt-4 text-xl font-medium">{stepTitles[step - 1]}</h2>

      <StepForm key={step} step={step} totalSteps={TOTAL_STEPS} defaults={defaults} />
    </main>
  );
}