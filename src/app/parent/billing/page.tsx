import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PageShell, Panel, Pill } from "@/components/ui";
import { birr, dateLabel, monthLabel } from "@/lib/format";
import { invoiceStatusLabels, paymentMethodLabels, paymentStatusLabels } from "@/lib/labels";
import ProofForm from "./proof-form";

export const metadata: Metadata = { title: "Bills and payments" };

export default async function ParentBillingPage() {
  const { supabase, user } = await requireRole("parent");

  const [{ data: invoices }, { data: payments }, { data: students }, { data: assignments }] = await Promise.all([
    supabase.from("invoices").select("id, assignment_id, period, amount_due, status").eq("parent_id", user.id).order("period", { ascending: false }),
    supabase.from("payments").select("id, invoice_id, amount, method, reference, status, review_note, created_at").eq("parent_id", user.id).order("created_at", { ascending: false }),
    supabase.from("students").select("id, first_name"),
    supabase.from("assignments").select("id, student_id").eq("parent_id", user.id),
  ]);

  const childOfAssignment: Record<string, string> = {};
  const childName: Record<string, string> = {};
  for (const s of students ?? []) childName[s.id] = s.first_name;
  for (const a of assignments ?? []) childOfAssignment[a.id] = childName[a.student_id] ?? "Your child";

  return (
    <PageShell>
      <Link href="/parent" className="text-sm font-semibold text-brand-dark underline underline-offset-2">Back to your area</Link>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Bills and payments</h1>
      <p className="mt-2 max-w-xl text-muted">
        Pay each monthly bill to Temadeg, then send us a screenshot or receipt. We confirm it and pay your tutor.
      </p>

      <div className="mt-8 space-y-6">
        {(invoices ?? []).length === 0 && (
          <Panel title="No bills yet">
            <p className="text-muted">Your first bill will appear here after your tutor is assigned.</p>
          </Panel>
        )}

        {(invoices ?? []).map((inv) => {
          const mine = (payments ?? []).filter((p) => p.invoice_id === inv.id);
          const waiting = mine.some((p) => p.status === "pending");
          return (
            <Panel
              key={inv.id}
              title={`${monthLabel(inv.period)}: ${childOfAssignment[inv.assignment_id] ?? "Your child"}`}
              action={
                <Pill tone={inv.status === "paid" ? "green" : waiting ? "gold" : "neutral"}>
                  {inv.status === "unpaid" && waiting ? "Payment being checked" : invoiceStatusLabels[inv.status]}
                </Pill>
              }
            >
              <p className="text-2xl font-bold">{birr(inv.amount_due)}</p>

              {mine.length > 0 && (
                <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
                  {mine.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                      <span>
                        {birr(p.amount)} by {paymentMethodLabels[p.method]}
                        {p.reference ? `, ref ${p.reference}` : ""}, sent {dateLabel(p.created_at)}
                        {p.review_note ? `. Note: ${p.review_note}` : ""}
                      </span>
                      <Pill tone={p.status === "confirmed" ? "green" : p.status === "rejected" ? "red" : "gold"}>
                        {paymentStatusLabels[p.status]}
                      </Pill>
                    </li>
                  ))}
                </ul>
              )}

              {inv.status === "unpaid" && !waiting && (
                <ProofForm invoiceId={inv.id} amountDue={Number(inv.amount_due)} />
              )}
            </Panel>
          );
        })}
      </div>
    </PageShell>
  );
}
