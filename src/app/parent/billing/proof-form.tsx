"use client";

import { useActionState } from "react";
import { submitPayment, type ProofState } from "./actions";
import { Alert, buttonClass, inputClass } from "@/components/ui";
import { paymentMethodLabels } from "@/lib/labels";

const initialState: ProofState = {};

export default function ProofForm({ invoiceId, amountDue }: { invoiceId: string; amountDue: number }) {
  const [state, formAction, pending] = useActionState(submitPayment, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-4 rounded-xl border border-dashed border-brand/40 bg-brand-soft/40 p-4">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <p className="text-sm font-semibold">I have paid. Send proof of payment.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-muted">How did you pay?</span>
          <select name="method" required defaultValue="" className={inputClass}>
            <option value="">Choose a method</option>
            {Object.entries(paymentMethodLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-muted">Amount paid (birr)</span>
          <input name="amount" type="number" min={1} step="0.01" required defaultValue={amountDue} className={inputClass} />
        </label>
      </div>

      <label className="block">
        <span className="text-sm text-muted">Reference or transaction number (optional)</span>
        <input name="reference" maxLength={100} className={inputClass} />
      </label>

      <label className="block">
        <span className="text-sm text-muted">Screenshot or receipt (PDF, JPG or PNG, up to 4 MB)</span>
        <input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png"
          className={`${inputClass} file:mr-4 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white`} />
      </label>

      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert tone="success">Thank you. We will confirm your payment soon.</Alert>}

      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Sending..." : "Send proof of payment"}
      </button>
    </form>
  );
}
