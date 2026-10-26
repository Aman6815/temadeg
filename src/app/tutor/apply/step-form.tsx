"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveStep, type StepState } from "./actions";

type Defaults = Record<string, string | boolean>;

const initialState: StepState = {};
const input = "mt-1 w-full rounded border bg-transparent px-3 py-2";

const educationOptions = [
  ["high_school", "ሁለተኛ ደረጃ (High school)"],
  ["diploma", "ዲፕሎማ (Diploma)"],
  ["bachelor", "የመጀመሪያ ዲግሪ (Bachelor's degree)"],
  ["master", "ሁለተኛ ዲግሪ (Master's degree)"],
  ["doctorate", "ዶክትሬት (Doctorate)"],
];

const gradeOptions = Array.from({ length: 13 }, (_, g) => [
  String(g),
  g === 0 ? "KG" : `ክፍል ${g} (Grade ${g})`,
]);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

export default function StepForm({
  step,
  totalSteps,
  defaults,
}: {
  step: number;
  totalSteps: number;
  defaults: Defaults;
}) {
  const [state, formAction, pending] = useActionState(saveStep, initialState);
  const d = defaults;

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="step" value={step} />

      {step === 1 && (
        <>
          <Field label="ስልክ ቁጥር (Phone number)">
            <input name="phone" type="tel" required maxLength={20}
              autoComplete="tel" defaultValue={String(d.phone)} className={input} />
          </Field>
          <Field label="ከተማ (City)">
            <input name="city" required maxLength={100}
              defaultValue={String(d.city)} className={input} />
          </Field>
          <Field label="ክፍለ ከተማ (Sub-city) · አማራጭ (optional)">
            <input name="subCity" maxLength={100}
              defaultValue={String(d.sub_city)} className={input} />
          </Field>
          <label className="flex items-center gap-2">
            <input name="isStudent" type="checkbox"
              defaultChecked={Boolean(d.is_student)} />
            በአሁኑ ጊዜ ተማሪ ነኝ (I am currently a student)
          </label>
        </>
      )}

      {step === 2 && (
        <>
          <Field label="የትምህርት ደረጃ (Education level)">
            <select name="educationLevel" required
              defaultValue={String(d.education_level)} className={input}>
              <option value="">—</option>
              {educationOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="ትምህርት ተቋም (Institution) · አማራጭ (optional)">
            <input name="institution" maxLength={200}
              defaultValue={String(d.institution)} className={input} />
          </Field>
          <Field label="የማስጠናት ልምድ (Tutoring experience) · አማራጭ (optional)">
            <textarea name="tutoringExperience" rows={4} maxLength={2000}
              defaultValue={String(d.tutoring_experience)} className={input} />
          </Field>
          <Field label="ልጆችን የማስተማር ልምድ (Experience teaching children) · አማራጭ (optional)">
            <textarea name="childExperience" rows={4} maxLength={2000}
              defaultValue={String(d.child_teaching_experience)} className={input} />
          </Field>
        </>
      )}

      {step === 3 && (
        <>
          <Field label="ከክፍል (From grade)">
            <select name="gradeMin" required defaultValue={String(d.grade_min)} className={input}>
              <option value="">—</option>
              {gradeOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="እስከ ክፍል (To grade)">
            <select name="gradeMax" required defaultValue={String(d.grade_max)} className={input}>
              <option value="">—</option>
              {gradeOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="የሚመችዎ ቀናትና ሰዓታት (Days and hours you are available)">
            <textarea name="availability" required rows={3} maxLength={1000}
              defaultValue={String(d.availability_note)} className={input} />
          </Field>
          <Field label="የሚፈልጉት ወርሃዊ ክፍያ በብር (Expected monthly fee in birr) · አማራጭ (optional)">
            <input name="fee" type="number" min={0} max={1000000} step="1"
              defaultValue={String(d.expected_monthly_fee)} className={input} />
          </Field>
        </>
      )}

      {state.error && (
        <p role="alert" className="text-red-500">{state.error}</p>
      )}

      <div className="flex items-center justify-between pt-2">
        {step > 1 ? (
          <Link href={`/tutor/apply?step=${step - 1}`} className="underline">
            ተመለስ (Back)
          </Link>
        ) : (
          <Link href="/tutor" className="underline">ተመለስ (Back)</Link>
        )}
        <button type="submit" disabled={pending}
          className="rounded bg-green-700 px-4 py-2 font-medium text-white disabled:opacity-50">
          {step === totalSteps ? "አስቀምጥ (Save)" : "ቀጥል (Next)"}
        </button>
      </div>
    </form>
  );
}