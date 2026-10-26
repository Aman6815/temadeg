"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export type StepState = { error?: string };

const EDUCATION = ["high_school", "diploma", "bachelor", "master", "doctorate"];
const SAVE_ERROR = "ማስቀመጥ አልተቻለም። እንደገና ይሞክሩ (Could not save. Please try again).";

const text = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const optional = (v: FormDataEntryValue | null) => text(v) || null;
const toInt = (v: FormDataEntryValue | null) => {
  const s = text(v);
  return /^\d+$/.test(s) ? Number(s) : NaN;
};

export async function saveStep(
  _prev: StepState,
  formData: FormData
): Promise<StepState> {
  const { supabase, user } = await requireRole("tutor");
  const step = Number(formData.get("step"));

  let values: Record<string, string | number | boolean | null>;

  if (step === 1) {
    const phone = text(formData.get("phone"));
    const city = text(formData.get("city"));
    const subCity = optional(formData.get("subCity"));

    if (!/^\+?[0-9 ]{9,15}$/.test(phone)) {
      return { error: "ትክክለኛ ስልክ ቁጥር ያስገቡ (Please enter a valid phone number)." };
    }
    if (!city || city.length > 100 || (subCity && subCity.length > 100)) {
      return { error: "ከተማውን በትክክል ያስገቡ (Please enter your city correctly)." };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ phone })
      .eq("id", user.id);
    if (error) {
      console.error("save phone failed:", error.message);
      return { error: SAVE_ERROR };
    }

    values = {
      city,
      sub_city: subCity,
      is_student: formData.get("isStudent") === "on",
    };
  } else if (step === 2) {
    const level = text(formData.get("educationLevel"));
    const institution = optional(formData.get("institution"));
    const tutoring = optional(formData.get("tutoringExperience"));
    const children = optional(formData.get("childExperience"));

    if (!EDUCATION.includes(level)) {
      return { error: "የትምህርት ደረጃ ይምረጡ (Please choose your education level)." };
    }
    if (
      (institution && institution.length > 200) ||
      (tutoring && tutoring.length > 2000) ||
      (children && children.length > 2000)
    ) {
      return { error: "ጽሑፉ በጣም ረጅም ነው (The text is too long)." };
    }

    values = {
      education_level: level,
      institution,
      tutoring_experience: tutoring,
      child_teaching_experience: children,
    };
  } else if (step === 3) {
    const gradeMin = toInt(formData.get("gradeMin"));
    const gradeMax = toInt(formData.get("gradeMax"));
    const availability = text(formData.get("availability"));
    const feeRaw = text(formData.get("fee"));
    const fee = feeRaw === "" ? null : Number(feeRaw);

    if (
      !Number.isInteger(gradeMin) ||
      !Number.isInteger(gradeMax) ||
      gradeMin < 0 ||
      gradeMax > 12 ||
      gradeMin > gradeMax
    ) {
      return { error: "የክፍል ደረጃዎችን በትክክል ይምረጡ (Please choose a valid grade range)." };
    }
    if (!availability || availability.length > 1000) {
      return { error: "የሚመችዎትን ቀናትና ሰዓታት ያስገቡ (Please describe your availability)." };
    }
    if (fee !== null && (!Number.isFinite(fee) || fee < 0 || fee > 1000000)) {
      return { error: "ክፍያው ትክክል አይደለም (The fee is not valid)." };
    }

    values = {
      grade_min: gradeMin,
      grade_max: gradeMax,
      availability_note: availability,
      expected_monthly_fee: fee,
    };
  } else {
    return { error: SAVE_ERROR };
  }

  // The database rules only allow this while the application is open;
  // if nothing was updated, we treat it as an error.
  const { data, error } = await supabase
    .from("tutor_applications")
    .update(values)
    .eq("tutor_id", user.id)
    .select("id");

  if (error || !data || data.length === 0) {
    if (error) console.error("save step failed:", error.message);
    return { error: SAVE_ERROR };
  }

  // After step 3 we return to the dashboard for now.
  redirect(step < 3 ? `/tutor/apply?step=${step + 1}` : "/tutor");
}