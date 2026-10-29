"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createRequest, type RequestState } from "./actions";
import { Alert, buttonClass, Chip, Field, inputClass } from "@/components/ui";
import { dayLabels, gradeLabel, requestModeLabels, timeOfDayLabels } from "@/lib/labels";

const initialState: RequestState = {};

export default function RequestForm({
  students,
  subjects,
  preferredTutor,
}: {
  students: { id: string; first_name: string; grade: number }[];
  subjects: { id: number; name_en: string }[];
  preferredTutor: { id: string; name: string } | null;
}) {
  const [state, formAction, pending] = useActionState(createRequest, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {preferredTutor && (
        <>
          <input type="hidden" name="preferredTutor" value={preferredTutor.id} />
          <Alert tone="info">
            You are asking for <strong>{preferredTutor.name}</strong>. We will check that they fit and confirm with you.
          </Alert>
        </>
      )}

      <Field label="Which child is this for?">
        <select name="studentId" required defaultValue={students.length === 1 ? students[0].id : ""} className={inputClass}>
          <option value="">Choose a child</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.first_name}, {gradeLabel(s.grade)}</option>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="text-sm font-semibold">Subjects</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {subjects.map((s) => (
            <Chip key={s.id} name="subjects" value={s.id}>{s.name_en}</Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">How would you like lessons?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(requestModeLabels).map(([value, label]) => (
            <Chip key={value} type="radio" name="mode" value={value} required>{label}</Chip>
          ))}
        </div>
      </fieldset>

      <Field label="Your neighborhood" optional hint="Needed for in-person lessons, for example: Bole or Akaki-Kality.">
        <input name="area" maxLength={100} className={inputClass} />
      </Field>

      <fieldset>
        <legend className="text-sm font-semibold">Preferred days</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {dayLabels.map((label, i) => (
            <Chip key={label} name="days" value={i + 1}>{label}</Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">Preferred time of day</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(timeOfDayLabels).map(([value, label]) => (
            <Chip key={value} type="radio" name="timeOfDay" value={value} defaultChecked={value === "any"}>
              {label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <Field label="Budget per hour in birr" optional hint="This helps us suggest tutors in your range.">
        <input name="maxRate" type="number" min={0} max={5000} step="1" className={`${inputClass} sm:max-w-40`} />
      </Field>

      <Field label="Anything else we should know?" optional hint="Please do not include phone numbers or links. We contact you through your account.">
        <textarea name="note" rows={4} maxLength={1000} className={inputClass} />
      </Field>

      {state.error && <Alert>{state.error}</Alert>}

      <div className="flex items-center justify-between border-t border-line pt-6">
        <Link href="/parent" className={buttonClass("ghost")}>Cancel</Link>
        <button type="submit" disabled={pending} className={buttonClass("primary", "lg")}>
          {pending ? "Sending..." : "Send request"}
        </button>
      </div>
    </form>
  );
}
