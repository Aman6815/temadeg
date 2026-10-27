import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { Alert, buttonClass, PageShell, StatusBadge } from "@/components/ui";
import { startApplication } from "./actions";
import { applySteps } from "./apply/steps";

export const metadata: Metadata = { title: "Tutor area" };

export default async function TutorHomePage() {
  const { supabase, user, profile } = await requireRole("tutor");

  const { data: application } = await supabase
    .from("tutor_applications")
    .select("status, admin_feedback")
    .eq("tutor_id", user.id)
    .maybeSingle();

  const status: string | null = application?.status ?? null;
  const editable = status === "draft" || status === "needs_info";

  return (
    <PageShell>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Welcome, {profile.full_name.split(" ")[0]}
      </h1>
      <p className="mt-2 text-muted">This is where you manage your tutor application.</p>

      <section className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">Your application</h2>
          {status && <StatusBadge status={status} />}
        </div>

        {!status && (
          <div className="mt-4">
            <p className="max-w-xl text-muted">
              Start your application to become a Temadeg tutor. It takes about 15 minutes, and you can
              save your progress and come back at any time.
            </p>
            <form action={startApplication} className="mt-5">
              <button type="submit" className={buttonClass("primary", "lg")}>Start application</button>
            </form>
          </div>
        )}

        {status === "draft" && (
          <p className="mt-4 max-w-xl text-muted">
            Your application is saved as a draft. Complete all six steps and submit it for review.
          </p>
        )}
        {status === "submitted" && (
          <p className="mt-4 max-w-xl text-muted">
            Thank you. We are reviewing your application and will update this page when we have a decision.
          </p>
        )}
        {status === "needs_info" && (
          <p className="mt-4 max-w-xl text-muted">
            We need a little more information before we can approve you. Please read our note, update
            your application and submit it again.
          </p>
        )}
        {status === "approved" && (
          <p className="mt-4 max-w-xl text-muted">
            You are approved. Families can now see your profile, and we will contact you when we match
            you with a student.
          </p>
        )}
        {status === "rejected" && (
          <p className="mt-4 max-w-xl text-muted">
            We were not able to approve your application at this time.
          </p>
        )}

        {application?.admin_feedback && (
          <div className="mt-5">
            <Alert tone="info">
              <p className="font-semibold">Note from the Temadeg team</p>
              <p className="mt-1 whitespace-pre-line">{application.admin_feedback}</p>
            </Alert>
          </div>
        )}

        {editable && (
          <>
            <ol className="mt-6 divide-y divide-line rounded-xl border border-line">
              {applySteps.map((s, i) => (
                <li key={s.title}>
                  <Link
                    href={`/tutor/apply?step=${i + 1}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-brand-soft/60"
                  >
                    <span>
                      <span className="block font-semibold">{i + 1}. {s.title}</span>
                      <span className="block text-sm text-muted">{s.description}</span>
                    </span>
                    <span className="text-sm font-semibold text-brand-dark">Edit</span>
                  </Link>
                </li>
              ))}
            </ol>
            <div className="mt-6">
              <Link href="/tutor/apply" className={buttonClass("primary", "lg")}>
                {status === "draft" ? "Continue application" : "Update application"}
              </Link>
            </div>
          </>
        )}
      </section>
    </PageShell>
  );
}
