// Suggests tutors for a family's request. The admin always makes the final choice.

export type MatchRequest = {
  grade: number;
  subjectIds: number[];
  mode: string; // online | in_person | either
  area: string | null;
  preferredDays: number[];
  timeOfDay: string; // any | morning | afternoon | evening
  maxHourlyRate: number | null;
  preferredTutorId: string | null;
};

export type MatchTutor = {
  tutor_id: string;
  grade_min: number;
  grade_max: number;
  teaching_mode: string; // online | in_person | both
  service_areas: string[];
  hourly_rate: number | null;
};

export type Slot = { day_of_week: number; start_hour: number; end_hour: number };

export type MatchResult = {
  eligible: boolean;
  score: number;
  reasons: string[];
  warnings: string[];
};

const windows: Record<string, [number, number]> = {
  any: [0, 24],
  morning: [6, 12],
  afternoon: [12, 17],
  evening: [17, 22],
};

export function matchTutor(
  req: MatchRequest,
  tutor: MatchTutor,
  tutorSubjectIds: number[],
  slots: Slot[]
): MatchResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  if (req.grade < tutor.grade_min || req.grade > tutor.grade_max) {
    return { eligible: false, score: 0, reasons, warnings: ["Does not teach this grade"] };
  }

  const overlap = req.subjectIds.filter((s) => tutorSubjectIds.includes(s)).length;
  if (overlap === 0) {
    return { eligible: false, score: 0, reasons, warnings: ["Does not teach the requested subjects"] };
  }
  score += overlap * 10;
  reasons.push(`Teaches ${overlap} of ${req.subjectIds.length} requested subjects`);

  if (req.mode === "online" && tutor.teaching_mode === "in_person") {
    return { eligible: false, score: 0, reasons, warnings: ["Teaches in person only"] };
  }
  if (req.mode === "in_person" && tutor.teaching_mode === "online") {
    return { eligible: false, score: 0, reasons, warnings: ["Teaches online only"] };
  }

  if (req.mode !== "online" && req.area) {
    const wanted = req.area.toLowerCase();
    const serves = tutor.service_areas.some(
      (a) => a.toLowerCase().includes(wanted) || wanted.includes(a.toLowerCase())
    );
    if (serves) {
      score += 5;
      reasons.push(`Serves ${req.area}`);
    } else if (req.mode === "in_person") {
      warnings.push(`Does not list ${req.area} as an area`);
    }
  }

  if (req.preferredDays.length > 0) {
    const [from, to] = windows[req.timeOfDay] ?? windows.any;
    const fits = req.preferredDays.filter((d) =>
      slots.some((s) => s.day_of_week === d && Math.min(s.end_hour, to) - Math.max(s.start_hour, from) >= 1)
    ).length;
    score += fits * 3;
    if (fits === req.preferredDays.length) reasons.push("Free on every preferred day and time");
    else if (fits > 0) reasons.push(`Free on ${fits} of ${req.preferredDays.length} preferred days`);
    else warnings.push("Not free on the preferred days and time");
  }

  if (req.maxHourlyRate !== null && tutor.hourly_rate !== null && tutor.hourly_rate > req.maxHourlyRate) {
    score -= 5;
    warnings.push("Hourly rate is above the family's budget");
  }

  if (req.preferredTutorId === tutor.tutor_id) {
    score += 15;
    reasons.push("Chosen by the family");
  }

  return { eligible: true, score, reasons, warnings };
}
