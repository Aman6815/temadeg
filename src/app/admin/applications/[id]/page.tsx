import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { PageShell, StatusBadge } from "@/components/ui";
import {
  dayLabels,
  docTypeLabels,
  educationLabels,
  gradeLabel,
  hourLabel,
  languageLabels,
  modeLabels,
} from "@/lib/labels";
import ReviewForm from "./review-form";

export const metadata: Metadata = { title: "Review application" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-muted">{label}</dt>
      <dd className="whitespace-pre-line">{children || <span className="text-muted">Not provided</span>}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <dl className="mt-2 divide-y divide-line">{children}</dl>
    </section>
  );
}

const formatDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

export default async function ReviewApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireRole("admin");

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: app } = await supabase.from("tutor_applications").select("*").eq("id", id).maybeSingle();
  if (!app) notFound();

  const { data: person } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", app.tutor_id)
    .maybeSingle();

  const { data: subjectRows } = await supabase
    .from("tutor_subjects")
    .select("subjects(name_en)")
    .eq("tutor_id", app.tutor_id);
  const subjectNames = (subjectRows ?? [])
    .map((r) => {
      const s = (r as { subjects: { name_en: string } | { name_en: string }[] | null }).subjects;
      return Array.isArray(s) ? s[0]?.name_en : s?.name_en;
    })
    .filter(Boolean) as string[];

  const { data: slots } = await supabase
    .from("tutor_availability")
    .select("day_of_week, start_hour, end_hour")
    .eq("tutor_id", app.tutor_id)
    .order("day_of_week");

  const { data: documents } = await supabase
    .from("documents")
    .select("id, doc_type, original_name, size_bytes, storage_path")
    .eq("tutor_id", app.tutor_id)
    .order("created_at");

  // Private files are opened through short-lived links created on the server.
  const docs = await Promise.all(
    (documents ?? []).map(async (d) => {
      const { data } = await supabase.storage.from("tutor-documents").createSignedUrl(d.storage_path, 120);
      return { ...d, url: data?.signedUrl ?? null };
    })
  );

  const reviewable = app.status === "submitted";

  return (
    <PageShell width="max-w-5xl">
      <Link href="/admin" className="text-sm font-semibold text-brand-dark underline underline-offset-2">
        Back to applications
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">{person?.full_name ?? "Applicant"}</h1>
        <StatusBadge status={app.status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Section title="Contact and location">
            <Row label="Phone">{person?.phone}</Row>
            <Row label="Telegram">{app.telegram_username ? `@${app.telegram_username}` : ""}</Row>
            <Row label="City">{[app.city, app.sub_city].filter(Boolean).join(", ")}</Row>
          </Section>

          <Section title="Education and experience">
            <Row label="Highest level">{app.education_level ? educationLabels[app.education_level] : ""}</Row>
            <Row label="Current student">{app.is_student ? "Yes" : "No"}</Row>
            <Row label="Institution">{app.institution}</Row>
            <Row label="Experience">{app.tutoring_experience}</Row>
          </Section>

          <Section title="Public profile">
            <Row label="Headline">{app.headline}</Row>
            <Row label="About">{app.bio}</Row>
            <Row label="Years teaching">{app.years_experience !== null ? String(app.years_experience) : ""}</Row>
            <Row label="Languages">
              {((app.teaching_languages ?? []) as string[]).map((l) => languageLabels[l] ?? l).join(", ")}
            </Row>
            <Row label="Subjects">{subjectNames.join(", ")}</Row>
          </Section>

          <Section title="Teaching preferences">
            <Row label="Grades">
              {app.grade_min !== null && app.grade_max !== null
                ? `${gradeLabel(app.grade_min)} to ${gradeLabel(app.grade_max)}`
                : ""}
            </Row>
            <Row label="Teaching mode">{app.teaching_mode ? modeLabels[app.teaching_mode] : ""}</Row>
            <Row label="Neighborhoods">{((app.service_areas ?? []) as string[]).join(", ")}</Row>
            <Row label="Hourly rate">
              {app.expected_hourly_fee !== null ? `${app.expected_hourly_fee} birr` : ""}
            </Row>
            <Row label="Availability">
              {(slots ?? [])
                .map((s) => `${dayLabels[s.day_of_week - 1]}: ${hourLabel(s.start_hour)} to ${hourLabel(s.end_hour)}`)
                .join("\n")}
            </Row>
            <Row label="Schedule note">{app.availability_note}</Row>
          </Section>

          <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-bold">Documents</h2>
            <p className="mt-1 text-sm text-muted">
              Links open the private file and expire after two minutes. Reload this page for a new link.
            </p>
            {docs.length === 0 ? (
              <p className="mt-4 text-muted">No documents uploaded.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{docTypeLabels[d.doc_type]}</p>
                      <p className="truncate text-sm text-muted">
                        {d.original_name}, {Math.max(1, Math.round(d.size_bytes / 1024))} KB
                      </p>
                    </div>
                    {d.url ? (
                      <a href={d.url} target="_blank" rel="noopener noreferrer"
                        className="shrink-0 font-semibold text-brand-dark underline underline-offset-2">
                        Open
                      </a>
                    ) : (
                      <span className="text-sm text-muted">Unavailable</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Section title="Agreement">
            <Row label="Accepted">{formatDateTime(app.agreed_at)}</Row>
            <Row label="Version">{app.agreement_version}</Row>
          </Section>
        </div>

        <aside className="rounded-2xl border border-line bg-white p-6 shadow-sm lg:sticky lg:top-24">
          {reviewable ? (
            <ReviewForm id={app.id} />
          ) : (
            <div>
              <h2 className="font-display text-lg font-bold">Decision recorded</h2>
              <p className="mt-2 text-muted">
                This application is {app.status.replace("_", " ")}. Only submitted applications can be reviewed.
              </p>
              {app.admin_feedback && (
                <p className="mt-4 whitespace-pre-line rounded-lg bg-paper p-3 text-sm">{app.admin_feedback}</p>
              )}
              {app.reviewed_at && (
                <p className="mt-3 text-sm text-muted">Reviewed on {formatDateTime(app.reviewed_at)}</p>
              )}
            </div>
          )}
        </aside>
      </div>
    </PageShell>
  );
}
