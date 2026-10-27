"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitApplication, type StepState } from "./actions";
import { Alert, buttonClass } from "@/components/ui";
import { commissionPercent, site, tutorSharePercent } from "@/config/site";

const initialState: StepState = {};

const missingLabels: Record<string, string> = {
  phone: "Your phone number (step 1)",
  city: "Your city (step 1)",
  education: "Your education level (step 2)",
  profile: "Your headline and bio (step 3)",
  languages: "At least one language (step 3)",
  subjects: "At least one subject (step 3)",
  grades: "Your grade range (step 4)",
  teaching_mode: "How you teach (step 4)",
  availability: "Your days and hours (step 4)",
  national_id: "A national ID, Fayda ID or passport (step 5)",
  education_document: "Proof of education (step 5)",
  student_id: "Your student ID (step 5)",
  agreement: "Your acceptance of the agreement",
};

export default function ReviewStep() {
  const [state, formAction, pending] = useActionState(submitApplication, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <section className="rounded-xl border border-line bg-white p-5">
        <h3 className="font-display text-lg font-bold">Tutor agreement</h3>
        <ol className="mt-3 list-decimal space-y-3 pl-5 leading-relaxed">
          <li>
            Families pay {site.name}. You receive {tutorSharePercent}% of the agreed tutoring fee, and
            {" "}{site.name} keeps a {commissionPercent}% commission.
          </li>
          <li>
            You will not accept payments directly from families for work assigned through {site.name}.
          </li>
          <li>The information and documents you provided are true and your own.</li>
          <li>You will follow our code of conduct, including our child safety rules.</li>
        </ol>
      </section>

      <label className="flex items-start gap-3">
        <input type="checkbox" name="agree" className="mt-1 h-4 w-4 accent-brand" />
        <span>I have read and agree to the tutor agreement.</span>
      </label>

      {state.error && <Alert>{state.error}</Alert>}

      {state.missing && (
        <Alert>
          <p className="font-semibold">Please complete these before submitting:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {state.missing.map((key) => (
              <li key={key}>{missingLabels[key] ?? key}</li>
            ))}
          </ul>
        </Alert>
      )}

      <div className="flex items-center justify-between border-t border-line pt-6">
        <Link href="/tutor/apply?step=5" className={buttonClass("ghost")}>Back</Link>
        <button type="submit" disabled={pending} className={buttonClass("primary", "lg")}>
          {pending ? "Submitting..." : "Submit application"}
        </button>
      </div>
    </form>
  );
}
