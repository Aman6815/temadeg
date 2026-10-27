"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveStep, type StepState } from "./actions";
import { Alert, buttonClass, Chip, Field, inputClass } from "@/components/ui";
import { dayLabels, educationLabels, gradeLabel, hourLabel, languageLabels, modeLabels } from "@/lib/labels";

type Defaults = Record<string, string | boolean | string[]>;
type Availability = Record<number, { start: number; end: number }>;
type Subject = { id: number; name_en: string };

const initialState: StepState = {};
const timeSelect =
  "rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

const startHours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM
const endHours = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM to 10 PM
const grades = Array.from({ length: 13 }, (_, g) => g);

export default function StepForm({
  step,
  defaults,
  availability,
  subjects,
  selectedSubjects,
}: {
  step: number;
  defaults: Defaults;
  availability: Availability;
  subjects: Subject[];
  selectedSubjects: number[];
}) {
  const [state, formAction, pending] = useActionState(saveStep, initialState);
  const d = defaults;
  const languages = d.teaching_languages as string[];

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="step" value={step} />

      {step === 1 && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone number">
            <input name="phone" type="tel" required maxLength={20} autoComplete="tel"
              defaultValue={String(d.phone)} className={inputClass} />
          </Field>
          <Field label="Telegram username" optional>
            <input name="telegram" maxLength={33} defaultValue={String(d.telegram_username)}
              className={inputClass} />
          </Field>
          <Field label="City">
            <input name="city" required maxLength={100} defaultValue={String(d.city)}
              className={inputClass} />
          </Field>
          <Field label="Sub-city" optional>
            <input name="subCity" maxLength={100} defaultValue={String(d.sub_city)}
              className={inputClass} />
          </Field>
        </div>
      )}

      {step === 2 && (
        <>
          <Field label="Highest level of education you have completed">
            <select name="educationLevel" required defaultValue={String(d.education_level)} className={inputClass}>
              <option value="">Choose a level</option>
              {Object.entries(educationLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <label className="flex items-start gap-3 rounded-lg border border-line bg-white p-4">
            <input name="isStudent" type="checkbox" defaultChecked={Boolean(d.is_student)}
              className="mt-1 h-4 w-4 accent-brand" />
            <span>
              <span className="block font-semibold">I am currently studying at a university or college</span>
              <span className="block text-sm text-muted">We will ask for your student ID.</span>
            </span>
          </label>
          <Field label="University or college" optional>
            <input name="institution" maxLength={200} defaultValue={String(d.institution)}
              className={inputClass} />
          </Field>
          <Field
            label="Your tutoring or teaching experience"
            optional
            hint="Say how long you have taught, which grades and subjects, and whether you have worked with children."
          >
            <textarea name="tutoringExperience" rows={5} maxLength={2000}
              defaultValue={String(d.tutoring_experience)} className={inputClass} />
          </Field>
        </>
      )}

      {step === 3 && (
        <>
          <Field label="Headline" hint="One line that families see first. For example: Maths tutor for Grades 5 to 8.">
            <input name="headline" required maxLength={100} defaultValue={String(d.headline)}
              className={inputClass} />
          </Field>
          <Field
            label="About you"
            hint="Families read this on your profile. Do not include phone numbers or other contact details."
          >
            <textarea name="bio" required rows={5} maxLength={600} defaultValue={String(d.bio)}
              className={inputClass} />
          </Field>
          <Field label="Years of teaching experience" optional>
            <input name="years" type="number" min={0} max={60} step="1"
              defaultValue={String(d.years_experience)} className={`${inputClass} sm:max-w-40`} />
          </Field>

          <fieldset>
            <legend className="text-sm font-semibold">Languages you can teach in</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(languageLabels).map(([value, label]) => (
                <Chip key={value} name="languages" value={value} defaultChecked={languages.includes(value)}>
                  {label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold">Subjects you can tutor</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {subjects.map((s) => (
                <Chip key={s.id} name="subjects" value={s.id} defaultChecked={selectedSubjects.includes(s.id)}>
                  {s.name_en}
                </Chip>
              ))}
            </div>
          </fieldset>
        </>
      )}

      {step === 4 && (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Lowest grade you teach">
              <select name="gradeMin" required defaultValue={String(d.grade_min)} className={inputClass}>
                <option value="">Choose a grade</option>
                {grades.map((g) => <option key={g} value={g}>{gradeLabel(g)}</option>)}
              </select>
            </Field>
            <Field label="Highest grade you teach">
              <select name="gradeMax" required defaultValue={String(d.grade_max)} className={inputClass}>
                <option value="">Choose a grade</option>
                {grades.map((g) => <option key={g} value={g}>{gradeLabel(g)}</option>)}
              </select>
            </Field>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold">How do you teach?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(modeLabels).map(([value, label]) => (
                <Chip key={value} type="radio" name="mode" value={value} required
                  defaultChecked={d.teaching_mode === value}>
                  {label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <Field
            label="Neighborhoods where you can teach in person"
            hint="Separate them with commas, for example: Bole, Kazanchis. Leave empty if you only teach online."
          >
            <input name="areas" maxLength={600} defaultValue={String(d.service_areas)} className={inputClass} />
          </Field>

          <fieldset>
            <legend className="text-sm font-semibold">Days and hours you are available</legend>
            <p className="mt-1 text-sm text-muted">Tick each day you can teach, then choose your start and end time.</p>
            <div className="mt-3 divide-y divide-line rounded-xl border border-line bg-white">
              {dayLabels.map((label, i) => {
                const day = i + 1;
                const slot = availability[day];
                return (
                  <div key={day} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                    <label className="flex w-32 items-center gap-3 font-semibold">
                      <input type="checkbox" name={`day_${day}`} defaultChecked={Boolean(slot)}
                        className="h-4 w-4 accent-brand" />
                      {label}
                    </label>
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <select name={`start_${day}`} aria-label={`${label} start time`}
                        defaultValue={String(slot?.start ?? 14)} className={timeSelect}>
                        {startHours.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                      </select>
                      <span>to</span>
                      <select name={`end_${day}`} aria-label={`${label} end time`}
                        defaultValue={String(slot?.end ?? 18)} className={timeSelect}>
                        {endHours.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <Field label="Anything else about your schedule" optional>
            <textarea name="availabilityNote" rows={2} maxLength={1000}
              defaultValue={String(d.availability_note)} className={inputClass} />
          </Field>
          <Field label="Your hourly rate in birr" optional hint="You can leave this empty and agree on a rate with us later.">
            <input name="fee" type="number" min={0} max={5000} step="1"
              defaultValue={String(d.expected_hourly_fee)} className={`${inputClass} sm:max-w-40`} />
          </Field>
        </>
      )}

      {state.error && <Alert>{state.error}</Alert>}

      <div className="flex items-center justify-between border-t border-line pt-6">
        <Link href={step > 1 ? `/tutor/apply?step=${step - 1}` : "/tutor"} className={buttonClass("ghost")}>
          Back
        </Link>
        <button type="submit" disabled={pending} className={buttonClass("primary", "lg")}>
          {pending ? "Saving..." : "Save and continue"}
        </button>
      </div>
    </form>
  );
}
