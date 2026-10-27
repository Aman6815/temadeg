// All public-facing business details live here.
// Replace every value marked REPLACE with your real information before launch.
export const site = {
  name: "Temadeg",
  nameAmharic: "ተማደግ", // used later, when the Amharic language option is added
  tagline: "Trusted tutors for every child, from KG to Grade 12",

  contact: {
    email: "amanuelalemayehuseta@gmail.com",
    phone: "0949057474 / 0968157594",
    address: "Akaki-Kality",
    hours: "Monday to Saturday, 9:00 AM to 6:00 PM",
    telegram: "https://t.me/temadegtutor", // optional, e.g. "https://t.me/yourchannel"
  },

  // Share of each tutoring fee kept by the organization (0.2 = 20%).
  commissionRate: 0.2,

  // Change this text version whenever the tutor agreement wording changes.
  agreementVersion: "2026-11-v1",
};

export const tutorSharePercent = Math.round((1 - site.commissionRate) * 100);
export const commissionPercent = Math.round(site.commissionRate * 100);
