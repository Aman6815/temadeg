"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { hasContactInfo, isUuid } from "@/lib/format";

export type RequestState = { error?: string };

const MODES = ["online", "in_person", "either"];
const TIMES = ["any", "morning", "afternoon", "evening"];

const text = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const toInt = (v: FormDataEntryValue | null) => {
  const s = text(v);
  return /^\d+$/.test(s) ? Number(s) : NaN;
};

export async function createRequest(
  _prev: RequestState,
  formData: FormData
): Promise<RequestState> {
  const { supabase, user } = await requireRole("parent");

  const studentId = text(formData.get("studentId"));
  const subjectIds = [...new Set(formData.getAll("subjects").map((v) => toInt(v)))];
  const mode = text(formData.get("mode"));
  const area = text(formData.get("area")) || null;
  const days = [...new Set(formData.getAll("days").map((v) => toInt(v)))];
  const timeOfDay = text(formData.get("timeOfDay")) || "any";
  const rateRaw = text(formData.get("maxRate"));
  const maxRate = rateRaw === "" ? null : Number(rateRaw);
  const note = text(formData.get("note")) || null;
  const preferredTutor = text(formData.get("preferredTutor"));

  if (!isUuid(studentId)) return { error: "Choose which child the tutor is for." };
  if (subjectIds.length === 0 || subjectIds.some((n) => !Number.isInteger(n))) {
    return { error: "Choose at least one subject." };
  }
  if (!MODES.includes(mode)) return { error: "Choose online, in person, or either." };
  if (mode !== "online" && !area) {
    return { error: "Tell us your neighborhood so we can find a tutor nearby." };
  }
  if (area && area.length > 100) return { error: "The neighborhood name is too long." };
  if (days.some((d) => !Number.isInteger(d) || d < 1 || d > 7)) return { error: "Choose valid days." };
  if (!TIMES.includes(timeOfDay)) return { error: "Choose a time of day." };
  if (maxRate !== null && (!Number.isFinite(maxRate) || maxRate < 0 || maxRate > 5000)) {
    return { error: "Enter a budget between 0 and 5,000 birr per hour, or leave it empty." };
  }
  if (note && (note.length > 1000 || hasContactInfo(note))) {
    return { error: "Keep your note under 1,000 characters and do not include phone numbers or links." };
  }

  let preferredTutorId: string | null = null;
  if (isUuid(preferredTutor)) {
    const { data: tutor } = await supabase
      .from("tutor_public_profiles")
      .select("tutor_id")
      .eq("tutor_id", preferredTutor)
      .eq("is_active", true)
      .maybeSingle();
    preferredTutorId = tutor?.tutor_id ?? null;
  }

  const { error } = await supabase.from("tutoring_requests").insert({
    parent_id: user.id,
    student_id: studentId,
    subject_ids: subjectIds,
    mode,
    area,
    preferred_days: days,
    time_of_day: timeOfDay,
    max_hourly_rate: maxRate,
    preferred_tutor_id: preferredTutorId,
    note,
  });
  if (error) {
    console.error("create request failed:", error.message);
    return { error: "We could not send your request. Please try again." };
  }

  redirect("/parent?notice=request-sent");
}
