import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PageShell, Pill } from "@/components/ui";
import { birr, monthLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Admin: billing" };

const tabs = [
  { key: "review", label: "Payment to check" },
  { key: "unpaid", label: "Awaiting payment" },
  { key: "payout", label: "Tutor to be paid" },
  { key: "done", label: "Completed" },
];

export default async function AdminBillingPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { supabase } = await requireRole("admin");
  const { tab: t } = await searchParams;
  const tab = tabs.some((x) => x.key === t) ? (t as string) : "review";

  const [{ data: invoices }, { data: payments }, { data: payouts }] = await Promise.all([
    supabase.from("invoices").select("id, parent_id, tutor_id, period, amount_due, commission_amount, tutor_amount, status").order("period", { ascending: false }),
    supabase.from("payments").select("invoice_id, amount, status"),
    supabase.from("tutor_payouts").select("invoice_id, amount"),
  ]);

  const all = invoices ?? [];
  const pendingFor = new Set((payments ?? []).filter((p) => p.status === "pending").map((p) => p.invoice_id));
  const paidOut = new Set((payouts ?? []).map((p) => p.invoice_id));

  const live = all.filter((i) => i.status !== "cancelled");
  const billed = live.reduce((s, i) => s + Number(i.amount_due), 0);
  // Only confirmed payments count as money received. Pending payments do not.
  const received = (payments ?? []).filter((p) => p.status === "confirmed").reduce((s, p) => s + Number(p.amount), 0);
  const commission = all.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.commission_amount), 0);
  const owed = all.filter((i) => i.status === "paid" && !paidOut.has(i.id)).reduce((s, i) => s + Number(i.tutor_amount), 0);
  const paidToTutors = (payouts ?? []).reduce((s, p) => s + Number(p.amount), 0);

  const rows = all.filter((i) => {
    if (tab === "review") return i.status === "unpaid" && pendingFor.has(i.id);
    if (tab === "unpaid") return i.status === "unpaid" && !pendingFor.has(i.id);
    if (tab === "payout") return i.status === "paid" && !paidOut.has(i.id);
    return i.status === "paid" && paidOut.has(i.id);
  });

  const ids = [...new Set(rows.flatMap((i) => [i.parent_id as string, i.tutor_id as string]))];
  const names: Record<string, string> = {};
  if (ids.length > 0) {
    const { data } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    for (const p of data ?? []) names[p.id] = p.full_name;
  }

  const stats = [
    ["Billed", birr(billed), "All bills created"],
    ["Received", birr(received), "Confirmed payments only"],
    ["Outstanding", birr(Math.max(billed - received, 0)), "Billed minus received"],
    ["Commission earned", birr(commission), "From fully paid bills"],
    ["Owed to tutors", birr(owed), "Paid bills not yet paid out"],
    ["Paid to tutors", birr(paidToTutors), "Recorded payouts"],
  ];

  return (
    <PageShell width="max-w-5xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Billing</h1>
      <p className="mt-2 text-muted">A payment counts as received only after you confirm it.</p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(([label, value, note]) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <dt className="text-sm font-semibold text-muted">{label}</dt>
            <dd className="mt-1 text-2xl font-bold">{value}</dd>
            <dd className="text-sm text-muted">{note}</dd>
          </div>
        ))}
      </dl>

      <nav aria-label="Bill status" className="mt-8 flex flex-wrap gap-2">
        {tabs.map((x) => (
          <Link
            key={x.key}
            href={`/admin/billing?tab=${x.key}`}
            aria-current={x.key === tab ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              x.key === tab ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand"
            }`}
          >
            {x.label}
          </Link>
        ))}
      </nav>

      <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        {rows.length === 0 ? (
          <p className="px-6 py-12 text-center text-muted">Nothing here right now.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-semibold">{monthLabel(i.period)}: {names[i.parent_id] ?? "Family"}</p>
                  <p className="text-sm text-muted">Tutor: {names[i.tutor_id] ?? "Unknown"}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">{birr(i.amount_due)}</span>
                  {pendingFor.has(i.id) && <Pill tone="gold">Proof sent</Pill>}
                  <Link href={`/admin/billing/invoices/${i.id}`} className="font-semibold text-brand-dark underline underline-offset-2">
                    Open
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
