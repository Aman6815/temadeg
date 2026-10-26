"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export type StepState = { error?: string; missing?: string[] };

const EDUCATION = ["high_school", "diploma", "bachelor", "master", "doctorate"];
const LANGUAGES = ["amharic", "english", "oromo", "tigrinya", "wolaita", "other"];
const MODES = ["online", "in_person", "both"];
const AGREEMENT_VERSION = "2026-11-v1";
const SAVE_ERROR = "ማስቀመጥ አልተቻለም። እንደገና ይሞክሩ (Could not save. Please try again).";

const text = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const optional = (v: FormDataEntryValue | null) => text(v) || null;
const toInt = (v: FormDataEntryValue | null) => {
  const s = text(v);
  return /^\d+$/.test(s) ? Number(s) : NaN;
};
// Phone numbers, @handles and links are not allowed in public text.
const hasContactInfo = (s: string) => /\d{7,}|@|t\.me|https?:|www\./i.test(s.replace(/[\s-]/g, ""));

export async function saveStep(
  _prev: StepState,
  formData: FormData
): Promise<StepState> {
  const { supabase, user } = await requireRole("tutor");
  const step = Number(formData.get("step"));

  let values: Record<string, string | number | boolean | string[] | null>;

  if (step === 1) {
    const phone = text(formData.get("phone"));
    const city = text(formData.get("city"));
    const subCity = optional(formData.get("subCity"));
    const telegram = optional(formData.get("telegram"));

    if (!/^\+?[0-9 ]{9,15}$/.test(phone)) {
      return { error: "ትክክለኛ ስልክ ቁጥር ያስገቡ (Please enter a valid phone number)." };
    }
    if (!city || city.length > 100 || (subCity && subCity.length > 100)) {
      return { error: "ከተማውን በትክክል ያስገቡ (Please enter your city correctly)." };
    }
    if (telegram && !/^@?[A-Za-z0-9_]{3,32}$/.test(telegram)) {
      return { error: "የቴሌግራም ስም ትክክል አይደለም (The Telegram username is not valid)." };
    }

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ phone })
      .eq("id", user.id)
      .select("id");
    if (error || !updated || updated.length === 0) {
      console.error("save phone failed:", error?.message ?? "no row updated");
      return { error: SAVE_ERROR };
    }

    values = {
      city,
      sub_city: subCity,
      telegram_username: telegram ? telegram.replace(/^@/, "") : null,
    };
  } else if (step === 2) {
    const level = text(formData.get("educationLevel"));
    const institution = optional(formData.get("institution"));
    const experience = optional(formData.get("tutoringExperience"));

    if (!EDUCATION.includes(level)) {
      return { error: "የትምህርት ደረጃ ይምረጡ (Please choose your education level)." };
    }
    if (
      (institution && institution.length > 200) ||
      (experience && experience.length > 2000)
    ) {
      return { error: "ጽሑፉ በጣም ረጅም ነው (The text is too long)." };
    }

    values = {
      education_level: level,
      is_student: formData.get("isStudent") === "on",
      institution,
      tutoring_experience: experience,
    };
  } else if (step === 3) {
    const headline = text(formData.get("headline"));
    const bio = text(formData.get("bio"));
    const yearsRaw = text(formData.get("years"));
    const years = yearsRaw === "" ? null : toInt(formData.get("years"));
    const languages = formData
      .getAll("languages")
      .map(String)
      .filter((l) => LANGUAGES.includes(l));
    const subjectIds = [...new Set(formData.getAll("subjects").map((v) => toInt(v)))];

    if (!headline || headline.length > 100 || !bio || bio.length > 600) {
      return { error: "አጭር ርዕስና መግለጫ ያስገቡ (Please enter a headline and a short bio)." };
    }
    if (hasContactInfo(headline) || hasContactInfo(bio)) {
      return { error: "ስልክ ቁጥር፣ @ ወይም አገናኝ አይጻፉ (Please remove phone numbers, @handles and links)." };
    }
    if (years !== null && (!Number.isInteger(years) || years > 60)) {
      return { error: "የልምድ ዓመት ትክክል አይደለም (The years of experience are not valid)." };
    }
    if (languages.length === 0) {
      return { error: "ቢያንስ አንድ ቋንቋ ይምረጡ (Please choose at least one language)." };
    }
    if (subjectIds.length === 0 || subjectIds.some((n) => !Number.isInteger(n))) {
      return { error: "ቢያንስ አንድ ትምህርት ይምረጡ (Please choose at least one subject)." };
    }

    const { error: subjectsError } = await supabase.rpc("set_my_subjects", {
      p_subject_ids: subjectIds,
    });
    if (subjectsError) {
      console.error("save subjects failed:", subjectsError.message);
      return { error: SAVE_ERROR };
    }

    values = {
      headline,
      bio,
      years_experience: years,
      teaching_languages: languages,
    };
  } else if (step === 4) {
    const gradeMin = toInt(formData.get("gradeMin"));
    const gradeMax = toInt(formData.get("gradeMax"));
    const mode = text(formData.get("mode"));
    const areas = [
      ...new Set(
        text(formData.get("areas"))
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean)
      ),
    ];
    const note = optional(formData.get("availabilityNote"));
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
    if (!MODES.includes(mode)) {
      return { error: "የማስተማሪያ መንገድ ይምረጡ (Please choose how you teach)." };
    }
    if (areas.length > 10 || areas.some((a) => a.length > 60)) {
      return { error: "ሰፈሮቹ ከ10 መብለጥ የለባቸውም (Please list at most 10 neighborhoods)." };
    }
    if (mode !== "online" && areas.length === 0) {
      return { error: "በአካል ለማስተማር ሰፈሮችን ያስገቡ (Please list the neighborhoods where you teach in person)." };
    }
    if (note && note.length > 1000) {
      return { error: "ማስታወሻው በጣም ረጅም ነው (The note is too long)." };
    }
    if (fee !== null && (!Number.isFinite(fee) || fee < 0 || fee > 5000)) {
      return { error: "ክፍያው ትክክል አይደለም (The fee is not valid)." };
    }

    const slots: { day: number; start: number; end: number }[] = [];
    for (let day = 1; day <= 7; day++) {
      if (formData.get(`day_${day}`) !== "on") continue;
      const start = toInt(formData.get(`start_${day}`));
      const end = toInt(formData.get(`end_${day}`));
      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 0 ||
        end > 24 ||
        start >= end
      ) {
        return { error: "የሰዓት ክልሉ ትክክል አይደለም፤ መጀመሪያው ከመጨረሻው መቅደም አለበት (Each day's start time must be before its end time)." };
      }
      slots.push({ day, start, end });
    }
    if (slots.length === 0) {
      return { error: "ቢያንስ አንድ ቀን ይምረጡ (Please choose at least one day)." };
    }

    const { error: slotsError } = await supabase.rpc("set_my_availability", {
      p_slots: slots,
    });
    if (slotsError) {
      console.error("save availability failed:", slotsError.message);
      return { error: SAVE_ERROR };
    }

    values = {
      grade_min: gradeMin,
      grade_max: gradeMax,
      teaching_mode: mode,
      service_areas: areas,
      availability_note: note,
      expected_hourly_fee: fee,
    };
  } else {
    return { error: SAVE_ERROR };
  }

  const { data, error } = await supabase
    .from("tutor_applications")
    .update(values)
    .eq("tutor_id", user.id)
    .select("id");

  if (error || !data || data.length === 0) {
    if (error) console.error("save step failed:", error.message);
    return { error: SAVE_ERROR };
  }

  redirect(`/tutor/apply?step=${step + 1}`);
}

export async function submitApplication(
  _prev: StepState,
  formData: FormData
): Promise<StepState> {
  const { supabase } = await requireRole("tutor");

  if (formData.get("agree") !== "on") {
    return { error: "ስምምነቱን ያረጋግጡ (Please accept the agreement)." };
  }

  const { data, error } = await supabase.rpc("submit_application", {
    p_agreement_version: AGREEMENT_VERSION,
  });
  if (error) {
    console.error("submit failed:", error.message);
    return { error: SAVE_ERROR };
  }

  const missing = (data ?? []) as string[];
  if (missing.length > 0) return { missing };

  redirect("/tutor");
}