import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { Alert, buttonClass, inputClass, PageShell, Panel, Pill } from "@/components/ui";
import { birr, dateLabel, isUuid, monthLabel } from "@/lib/format";
import { invoiceStatusLabels, paymentMethodLabels, paymentStatusLabels } from "@/lib/labels";
import { confirmPayment, recordPayout, rejectPayment } from "../../actions";

export const metadata: Metadata = { title: "Admin: invoice" };

const notices: Record<string, { tone: "success" | "error"; text: string }> = {
  confirmed: { tone: "success", text: "Payment confirmed." },
  rejected: { tone: "success", text: "Payment marked as not accepted. The family can send a new proof." },
  "paid-out": { tone: "success", text: "Payout recorded." },
  "note-needed": { tone: "error", text: "Write a short reason before rejecting a payment." },
  failed: { tone: "error", text: "That action could not be completed. Reload the page and check the status." },
};

export default async function AdminInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { supabase } = await requireRole("admin");
  const { id } = await params;
  const { notice } = await searchParams;
  if (!isUuid(id)) notFound();

  const { data: inv } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
  if (!inv) notFound();

  const [{ data: parent }, { data: tutor }, { data: payments }, { data: payout }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", inv.parent_id).maybeSingle(),
    supabase.from("profiles").select("full_name, phone").eq("id", inv.tutor_id).maybeSingle(),
    supabase.from("payments").select("id, amount, method, reference, proof_path, status, review_note, created_at").eq("invoice_id", id).order("created_at", { ascending: false }),
    supabase.from("tutor_payouts").select("amount, method, reference, paid_at").eq("invoice_id", id).maybeSingle(),
  ]);

  // Proofs are private files, opened through links that expire after two minutes.
  const proofs = await Promise.all(
    (payments ?? []).map(async (p) => {
      const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(p.proof_path, 120);
      return { ...p, url: data?.signedUrl ?? null };
    })
  );

  const n = notice ? notices[notice] : undefined;

  return (
    <PageShell width="max-w-3xl">
      <Link href="/admin/billing" className="text-sm font-semibold text-brand-dark underline underline-offset-2">Back to billing</Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">{monthLabel(inv.period)}</h1>
        <Pill tone={inv.status === "paid" ? "green" : "gold"}>{invoiceStatusLabels[inv.status]}</Pill>
      </div>

      {n && <div className="mt-6"><Alert tone={n.tone}>{n.text}</Alert></div>}

      <div className="mt-6 space-y-6">
        <Panel title="The bill">
          <dl className="divide-y divide-line">
            {[
              ["Family", `${parent?.full_name ?? ""}${parent?.phone ? `, ${parent.phone}` : ""}`],
              ["Tutor", `${tutor?.full_name ?? ""}${tutor?.phone ? `, ${tutor.phone}` : ""}`],
              ["Amount due", birr(inv.amount_due)],
              ["Temadeg commission", birr(inv.commission_amount)],
              ["Tutor share", birr(inv.tutor_amount)],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr]">
                <dt className="text-sm font-semibold text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Payments from the family">
          {proofs.length === 0 ? (
            <p className="text-muted">The family has not sent a payment proof yet.</p>
          ) : (
            <ul className="space-y-4">
              {proofs.map((p) => (
                <li key={p.id} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      {birr(p.amount)} by {paymentMethodLabels[p.method]}
                    </p>
                    <Pill tone={p.status === "confirmed" ? "green" : p.status === "rejected" ? "red" : "gold"}>
                      {paymentStatusLabels[p.status]}
                    </Pill>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    Sent {dateLabel(p.created_at)}
                    {p.reference ? `, reference ${p.reference}` : ""}
                  </p>
                  {p.review_note && <p className="mt-1 text-sm">Note: {p.review_note}</p>}
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-brand-dark underline underline-offset-2">
                      Open proof
                    </a>
                  ) : (
                    <p className="mt-2 text-sm text-muted">Proof file unavailable.</p>
                  )}

                  {p.status === "pending" && (
                    <div className="mt-4 space-y-3 border-t border-line pt-4">
                      <form action={confirmPayment}>
                        <input type="hidden" name="paymentId" value={p.id} />
                        <input type="hidden" name="invoiceId" value={inv.id} />
                        <button type="submit" className={buttonClass("primary")}>Confirm: money received</button>
                      </form>
                      <form action={rejectPayment} className="flex flex-wrap items-end gap-3">
                        <input type="hidden" name="paymentId" value={p.id} />
                        <input type="hidden" name="invoiceId" value={inv.id} />
                        <label className="block min-w-48 flex-1">
                          <span className="text-sm font-semibold">Reason if not accepted</span>
                          <input name="note" maxLength={500} className={inputClass} />
                        </label>
                        <button type="submit" className={buttonClass("secondary")}>Reject</button>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Pay the tutor">
          {payout ? (
            <p>
              Paid {birr(payout.amount)} on {dateLabel(payout.paid_at)} by {paymentMethodLabels[payout.method]}
              {payout.reference ? `, reference ${payout.reference}` : ""}.
            </p>
          ) : inv.status !== "paid" ? (
            <p className="text-muted">You can pay the tutor after the family&apos;s payment is confirmed.</p>
          ) : (
            <form action={recordPayout} className="space-y-4">
              <input type="hidden" name="invoiceId" value={inv.id} />
              <p className="text-muted">
                Send {birr(inv.tutor_amount)} to {tutor?.full_name}, then record it here.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold">How you paid</span>
                  <select name="method" required defaultValue="" className={inputClass}>
                    <option value="">Choose a method</option>
                    {Object.entries(paymentMethodLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">Reference (optional)</span>
                  <input name="reference" maxLength={100} className={inputClass} />
                </label>
              </div>
              <button type="submit" className={buttonClass("primary")}>Record payout</button>
            </form>
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
