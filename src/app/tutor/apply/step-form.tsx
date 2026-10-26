"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveStep, type StepState } from "./actions";

type Defaults = Record<string, string | boolean | string[]>;
type Availability = Record<number, { start: number; end: number }>;
type Subject = { id: number; name_en: string; name_am: string };

const initialState: StepState = {};
const input = "mt-1 w-full rounded border bg-transparent px-3 py-2";
const smallSelect = "rounded border bg-transparent px-2 py-1";

const educationOptions = [
  ["high_school", "ሁለተኛ ደረጃ (High school)"],
  ["diploma", "ዲፕሎማ (Diploma)"],
  ["bachelor", "የመጀመሪያ ዲግሪ (Bachelor's degree)"],
  ["master", "ሁለተኛ ዲግሪ (Master's degree)"],
  ["doctorate", "ዶክትሬት (Doctorate)"],
];

const languageOptions = [
  ["amharic", "አማርኛ (Amharic)"],
  ["english", "እንግሊዝኛ (English)"],
  ["oromo", "ኦሮምኛ (Afan Oromo)"],
  ["tigrinya", "ትግርኛ (Tigrinya)"],
  ["wolaita", "ወላይትኛ (Wolaytta)"],
  ["other", "ሌላ (Other)"],
];

const modeOptions = [
  ["online", "በበይነመረብ (Online)"],
  ["in_person", "በአካል (In person)"],
  ["both", "ሁለቱም (Both)"],
];

const gradeOptions = Array.from({ length: 13 }, (_, g) => [
  String(g),
  g === 0 ? "KG" : `ክፍል ${g} (Grade ${g})`,
]);

const days = [
  [1, "ሰኞ (Monday)"],
  [2, "ማክሰኞ (Tuesday)"],
  [3, "ረቡዕ (Wednesday)"],
  [4, "ሐሙስ (Thursday)"],
  [5, "ዓርብ (Friday)"],
  [6, "ቅዳሜ (Saturday)"],
  [7, "እሑድ (Sunday)"],
] as const;

const hourLabel = (h: number) => `${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}`;
const startHours = Array.from({ length: 16 }, (_, i) => i + 6);
const endHours = Array.from({ length: 16 }, (_, i) => i + 7);

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
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="step" value={step} />

      {step === 1 && (
        <>
          <Field label="ስልክ ቁጥር (Phone number)">
            <input name="phone" type="tel" required maxLength={20}
              autoComplete="tel" defaultValue={String(d.phone)} className={input} />
          </Field>
          <Field label="ቴሌግራም ተጠቃሚ ስም (Telegram username) · አማራጭ (optional)">
            <input name="telegram" maxLength={33}
              defaultValue={String(d.telegram_username)} className={input} />
          </Field>
          <Field label="ከተማ (City)">
            <input name="city" required maxLength={100}
              defaultValue={String(d.city)} className={input} />
          </Field>
          <Field label="ክፍለ ከተማ (Sub-city) · አማራጭ (optional)">
            <input name="subCity" maxLength={100}
              defaultValue={String(d.sub_city)} className={input} />
          </Field>
        </>
      )}

      {step === 2 && (
        <>
          <Field label="የጨረሱት ከፍተኛ የትምህርት ደረጃ (Highest level you have completed)">
            <select name="educationLevel" required
              defaultValue={String(d.education_level)} className={input}>
              <option value="">—</option>
              {educationOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2">
            <input name="isStudent" type="checkbox"
              defaultChecked={Boolean(d.is_student)} />
            በአሁኑ ጊዜ በዩኒቨርሲቲ ወይም በኮሌጅ እየተማርኩ ነው (I am currently studying at a university or college)
          </label>
          <Field label="ዩኒቨርሲቲ ወይም ኮሌጅ (University or college) · አማራጭ (optional)">
            <input name="institution" maxLength={200}
              defaultValue={String(d.institution)} className={input} />
          </Field>
          <Field label="ስለ ማስጠናት ወይም ማስተማር ልምድዎ ይጻፉ (Describe your tutoring or teaching experience) · አማራጭ (optional)">
            <textarea name="tutoringExperience" rows={5} maxLength={2000}
              defaultValue={String(d.tutoring_experience)} className={input} />
            <span className="text-sm opacity-70">
              ለምን ያህል ጊዜ፣ የትኞቹን ክፍሎችና ትምህርቶች፣ ልጆችን ጨምሮ (How long, which grades and subjects, including children)
            </span>
          </Field>
        </>
      )}

      {step === 3 && (
        <>
          <Field label="አጭር ርዕስ (Headline)">
            <input name="headline" required maxLength={100}
              defaultValue={String(d.headline)} className={input} />
            <span className="text-sm opacity-70">
              ለምሳሌ፦ የ5ኛ–8ኛ ክፍል የሒሳብ አስጠኚ (e.g. Mathematics tutor for Grades 5–8)
            </span>
          </Field>
          <Field label="ስለ እርስዎ (About you)">
            <textarea name="bio" required rows={5} maxLength={600}
              defaultValue={String(d.bio)} className={input} />
            <span className="text-sm opacity-70">
              ወላጆች ይህን ያያሉ። ስልክ ቁጥር ወይም ሌላ የመገናኛ መረጃ አይጻፉ (Parents will see this. Do not include phone numbers or other contact details)
            </span>
          </Field>
          <Field label="የማስጠናት ልምድ በዓመት (Years of experience) · አማራጭ (optional)">
            <input name="years" type="number" min={0} max={60} step="1"
              defaultValue={String(d.years_experience)} className={input} />
          </Field>
          <fieldset className="space-y-2">
            <legend className="font-medium">
              የሚያስተምሩባቸው ቋንቋዎች (Languages you teach in)
            </legend>
            {languageOptions.map(([value, label]) => (
              <label key={value} className="flex items-center gap-2">
                <input type="checkbox" name="languages" value={value}
                  defaultChecked={languages.includes(value)} />
                {label}
              </label>
            ))}
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="font-medium">
              የሚያስጠኑባቸው ትምህርቶች (Subjects you tutor)
            </legend>
            {subjects.map((s) => (
              <label key={s.id} className="flex items-center gap-2">
                <input type="checkbox" name="subjects" value={s.id}
                  defaultChecked={selectedSubjects.includes(s.id)} />
                {s.name_am} ({s.name_en})
              </label>
            ))}
          </fieldset>
        </>
      )}

      {step === 4 && (
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

          <fieldset className="space-y-2">
            <legend className="font-medium">
              የማስተማሪያ መንገድ (How you teach)
            </legend>
            {modeOptions.map(([value, label]) => (
              <label key={value} className="flex items-center gap-2">
                <input type="radio" name="mode" value={value} required
                  defaultChecked={d.teaching_mode === value} />
                {label}
              </label>
            ))}
          </fieldset>

          <Field label="በአካል የሚያስተምሩባቸው ሰፈሮች (Neighborhoods where you teach in person)">
            <input name="areas" maxLength={600}
              defaultValue={String(d.service_areas)} className={input} />
            <span className="text-sm opacity-70">
              በኮማ ይለዩ፣ ለምሳሌ፦ ቦሌ፣ ካዛንችስ (Separate with commas, e.g. Bole, Kazanchis)
            </span>
          </Field>

          <fieldset className="space-y-2">
            <legend className="font-medium">
              የሚመችዎ ቀናትና ሰዓታት (Days and hours you are available)
            </legend>
            <p className="text-sm opacity-70">
              የሚመችዎትን ቀን ምልክት ያድርጉ፣ ከዚያ ሰዓቱን ይምረጡ (Tick each day, then choose from and to)
            </p>
            {days.map(([day, label]) => {
              const slot = availability[day];
              return (
                <div key={day} className="flex flex-wrap items-center gap-2">
                  <label className="flex w-44 items-center gap-2">
                    <input type="checkbox" name={`day_${day}`}
                      defaultChecked={Boolean(slot)} />
                    {label}
                  </label>
                  <select name={`start_${day}`} aria-label="From"
                    defaultValue={String(slot?.start ?? 14)} className={smallSelect}>
                    {startHours.map((h) => (
                      <option key={h} value={h}>{hourLabel(h)}</option>
                    ))}
                  </select>
                  <span>—</span>
                  <select name={`end_${day}`} aria-label="To"
                    defaultValue={String(slot?.end ?? 18)} className={smallSelect}>
                    {endHours.map((h) => (
                      <option key={h} value={h}>{hourLabel(h)}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </fieldset>

          <Field label="ስለ ሰዓትዎ ተጨማሪ ማስታወሻ (Extra notes about your schedule) · አማራጭ (optional)">
            <textarea name="availabilityNote" rows={2} maxLength={1000}
              defaultValue={String(d.availability_note)} className={input} />
          </Field>
          <Field label="በሰዓት የሚፈልጉት ክፍያ በብር (Expected fee per hour in birr) · አማራጭ (optional)">
            <input name="fee" type="number" min={0} max={5000} step="1"
              defaultValue={String(d.expected_hourly_fee)} className={input} />
          </Field>
        </>
      )}

      {state.error && (
        <p role="alert" className="text-red-500">{state.error}</p>
      )}

      <div className="flex items-center justify-between pt-2">
        <Link
          href={step > 1 ? `/tutor/apply?step=${step - 1}` : "/tutor"}
          className="underline"
        >
          ተመለስ (Back)
        </Link>
        <button type="submit" disabled={pending}
          className="rounded bg-green-700 px-4 py-2 font-medium text-white disabled:opacity-50">
          ቀጥል (Next)
        </button>
      </div>
    </form>
  );
}