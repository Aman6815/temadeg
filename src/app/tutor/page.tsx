import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { startApplication } from "./actions";

const statusLabels: Record<string, string> = {
  draft: "ረቂቅ (Draft)",
  submitted: "ተልኳል፣ በግምገማ ላይ (Submitted, under review)",
  needs_info: "ተጨማሪ መረጃ ያስፈልጋል (More information needed)",
  approved: "ጸድቋል (Approved)",
  rejected: "አልተፈቀደም (Not approved)",
};

export default async function TutorHomePage() {
  const { supabase, user, profile } = await requireRole("tutor");

  const { data: application } = await supabase
    .from("tutor_applications")
    .select("status, admin_feedback")
    .eq("tutor_id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-3xl font-bold">ተማደግ</h1>
      <p className="mt-4 text-xl">{profile.full_name}</p>
      <p className="opacity-70">አስጠኚ (Tutor)</p>

      <section className="mt-6 rounded border p-4">
        <h2 className="font-medium">የማመልከቻዎ ሁኔታ (Your application)</h2>

        {!application ? (
          <form action={startApplication} className="mt-3">
            <p className="mb-3 opacity-70">
              ገና አላመለከቱም (You have not started an application yet).
            </p>
            <button type="submit" className="rounded bg-green-700 px-4 py-2 text-white">
              ማመልከቻ ጀምር (Start application)
            </button>
          </form>
        ) : (
          <div className="mt-3 space-y-3">
            <p>{statusLabels[application.status]}</p>
            {application.admin_feedback && (
              <p className="rounded border p-3 text-sm">{application.admin_feedback}</p>
            )}
            {(application.status === "draft" ||
              application.status === "needs_info") && (
              <Link href="/tutor/apply" className="inline-block rounded bg-green-700 px-4 py-2 text-white">
                ቀጥል (Continue)
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

