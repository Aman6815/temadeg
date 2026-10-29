export const birr = (n: number | string | null | undefined) =>
  `${Number(n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} birr`;

export const monthLabel = (period: string) =>
  new Date(`${period}T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export const dateLabel = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "";

export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

// Phone numbers, @handles and links are not allowed in free text that others will read.
export const hasContactInfo = (s: string) =>
  /\d{7,}|@|t\.me|https?:|www\./i.test(s.replace(/[\s-]/g, ""));

// Identify the real file type from its first bytes, not from its name.
export function detectFileType(bytes: Uint8Array): { mime: string; ext: string } | null {
  const starts = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts([0x25, 0x50, 0x44, 0x46])) return { mime: "application/pdf", ext: "pdf" };
  if (starts([0x89, 0x50, 0x4e, 0x47])) return { mime: "image/png", ext: "png" };
  if (starts([0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
  return null;
}
