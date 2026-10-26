"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitApplication, type StepState } from "./actions";

const initialState: StepState = {};

const missingLabels: Record<string, string> = {
  phone: "ስልክ ቁጥር (Phone number) · ደረጃ 1 (step 1)",
  city: "ከተማ (City) · ደረጃ 1 (step 1)",
  education: "የትምህርት ደረጃ (Education level) · ደረጃ 2 (step 2)",
  profile: "አጭር ርዕስና መግለጫ (Headline and bio) · ደረጃ 3 (step 3)",
  languages: "ቋንቋዎች (Languages) · ደረጃ 3 (step 3)",
  subjects: "ትምህርቶች (Subjects) · ደረጃ 3 (step 3)",
  grades: "የክፍል ደረጃ (Grade range) · ደረጃ 4 (step 4)",
  teaching_mode: "የማስተማሪያ መንገድ (Teaching mode) · ደረጃ 4 (step 4)",
  availability: "የሚመችዎ ቀናትና ሰዓታት (Availability) · ደረጃ 4 (step 4)",
  national_id: "መታወቂያ (ID document) · ደረጃ 5 (step 5)",
  education_document: "የትምህርት ማስረጃ (Academic proof) · ደረጃ 5 (step 5)",
  student_id: "የተማሪ መታወቂያ (Student ID) · ደረጃ 5 (step 5)",
  agreement: "ስምምነት (Agreement)",
};

export default function ReviewStep() {
  const [state, formAction, pending] = useActionState(submitApplication, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <section className="space-y-3 rounded border p-4">
        <h3 className="font-medium">የአስጠኚ ስምምነት (Tutor agreement)</h3>
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            የወላጆች ክፍያ ለድርጅቱ ይከፈላል። አስጠኚው ከተስማማው የማስጠኛ ክፍያ 80% ያገኛል፤ ድርጅቱ 20% ኮሚሽን ይይዛል።
            <br />
            <span className="text-sm opacity-70">
              Parents pay the organization. The tutor receives 80% of the agreed tutoring fee and the organization keeps a 20% commission.
            </span>
          </li>
          <li>
            በዚህ መድረክ በኩል በተሰጠ ሥራ ከቤተሰቦች ቀጥታ ክፍያ መቀበል አይፈቀድም።
            <br />
            <span className="text-sm opacity-70">
              Accepting payments directly from families for work assigned through this platform is not allowed.
            </span>
          </li>
          <li>
            ያቀረብኳቸው መረጃዎችና ሰነዶች እውነተኛና የራሴ መሆናቸውን አረጋግጣለሁ።
            <br />
            <span className="text-sm opacity-70">
              I confirm that the information and documents I provided are true and my own.
            </span>
          </li>
          <li>
            የልጆችን ደህንነት ጨምሮ የድርጅቱን የሥነ ምግባር ደንቦች ለመከተል እስማማለሁ።
            <br />
            <span className="text-sm opacity-70">
              I agree to follow the organization&apos;s code of conduct, including child safety.
            </span>
          </li>
        </ol>
      </section>

      <label className="flex items-start gap-2">
        <input type="checkbox" name="agree" className="mt-1" />
        <span>
          ስምምነቱን አንብቤ ተስማምቻለሁ (I have read and agree to the tutor agreement)
        </span>
      </label>

      {state.error && <p role="alert" className="text-red-500">{state.error}</p>}

      {state.missing && (
        <div role="alert" className="rounded border border-red-500 p-3">
          <p className="font-medium text-red-500">
            የሚከተሉት ይጎድላሉ (Please complete these first):
          </p>
          <ul className="mt-2 list-disc pl-5">
            {state.missing.map((key) => (
              <li key={key}>{missingLabels[key] ?? key}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Link href="/tutor/apply?step=5" className="underline">ተመለስ (Back)</Link>
        <button type="submit" disabled={pending}
          className="rounded bg-green-700 px-4 py-2 font-medium text-white disabled:opacity-50">
          {pending ? "በመላክ ላይ… (Submitting…)" : "ማመልከቻውን ላክ (Submit application)"}
        </button>
      </div>
    </form>
  );
}