export const docTypeLabels: Record<string, string> = {
  national_id: "National ID, Fayda ID or passport",
  student_id: "Student ID",
  transcript: "Academic transcript",
  grade8_result: "Grade 8 Ministry exam result",
  grade12_result: "Grade 12 national exam result",
  degree: "Degree or diploma certificate",
  certificate: "Other certificate",
  other: "Other document",
};

export const educationLabels: Record<string, string> = {
  high_school: "High school",
  diploma: "Diploma",
  bachelor: "Bachelor's degree",
  master: "Master's degree",
  doctorate: "Doctorate",
};

export const languageLabels: Record<string, string> = {
  amharic: "Amharic",
  english: "English",
  oromo: "Afan Oromo",
  tigrinya: "Tigrinya",
  wolaita: "Wolaytta",
  other: "Other",
};

export const modeLabels: Record<string, string> = {
  online: "Online",
  in_person: "In person",
  both: "Online and in person",
};

export const dayLabels = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const hourLabel = (h: number) => `${h % 12 || 12}:00 ${h < 12 || h === 24 ? "AM" : "PM"}`;

export const gradeLabel = (g: number) => (g === 0 ? "KG" : `Grade ${g}`);

export const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Under review",
  needs_info: "More information needed",
  approved: "Approved",
  rejected: "Not approved",
};

export const timeOfDayLabels: Record<string, string> = {
  any: "Any time",
  morning: "Morning (6 AM to 12 PM)",
  afternoon: "Afternoon (12 PM to 5 PM)",
  evening: "Evening (5 PM to 10 PM)",
};

export const requestModeLabels: Record<string, string> = {
  online: "Online",
  in_person: "In person",
  either: "Online or in person",
};

export const requestStatusLabels: Record<string, string> = {
  open: "Finding a tutor",
  matched: "Tutor assigned",
  cancelled: "Cancelled",
};

export const paymentMethodLabels: Record<string, string> = {
  telebirr: "Telebirr",
  cbe: "Commercial Bank of Ethiopia",
  bank_transfer: "Other bank transfer",
  cash: "Cash",
  other: "Other",
};

export const invoiceStatusLabels: Record<string, string> = {
  unpaid: "Awaiting payment",
  paid: "Paid",
  cancelled: "Cancelled",
};

export const paymentStatusLabels: Record<string, string> = {
  pending: "Waiting for confirmation",
  confirmed: "Confirmed",
  rejected: "Not accepted",
};
