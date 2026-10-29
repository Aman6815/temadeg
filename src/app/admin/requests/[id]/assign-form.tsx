"use client";

import { useActionState } from "react";
import { assignTutor, type AssignState } from "./actions";
import { Alert, buttonClass, inputClass } from "@/components/ui";

const initialState: AssignState = {};

export type Candidate = {
  tutorId: string;
  name: string;
  headline: string;
  rate: string;
  score: number;
  reasons: string[];
  warnings: string[];
  chosenByFamily: boolean;
};

export default function AssignForm({
  requestId,
  candidates,
  today,
  commissionPercent,
}: {
  requestId: string;
  candidates: Candidate[];
  today: string;
  commissionPercent: number;
}) {
  const [state, formAction, pending] = useActionState(assignTutor, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="requestId" value={requestId} />

      <fieldset>
        <legend className="font-display text-lg font-bold">Choose a tutor</legend>
        <div className="mt-3 space-y-2">
          {candidates.map((c, i) => (
            <label key={c.tutorId} className="block cursor-pointer">
              <input type="radio" name="tutorId" value={c.tutorId} required defaultChecked={i === 0} className="peer sr-only" />
              <span className="block rounded-xl border border-line bg-white p-4 transition-colors hover:border-brand peer-checked:border-brand peer-checked:bg-brand-soft peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">
                    {c.name}
                    {c.chosenByFamily && <span className="ml-2 rounded-full bg-marigold-soft px-2 py-0.5 text-xs text-[#7a5800]">Chosen by family</span>}
                  </span>
                  <span className="text-sm text-muted">Match score {c.score}{c.rate ? `, ${c.rate}` : ""}</span>
                </span>
                <span className="mt-1 block text-sm text-muted">{c.headline}</span>
                {c.reasons.length > 0 && (
                  <span className="mt-2 block text-sm text-grow">{c.reasons.join(". ")}.</span>
                )}
                {c.warnings.length > 0 && (
                  <span className="mt-1 block text-sm text-[#9a4b00]">{c.warnings.join(". ")}.</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold">Monthly fee the family pays (birr)</span>
          <input name="monthlyFee" type="number" min={1} step="1" required className={inputClass} />
          <span className="mt-1.5 block text-sm text-muted">
            Temadeg keeps {commissionPercent}% and the tutor receives {100 - commissionPercent}%.
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Start date</span>
          <input name="startDate" type="date" required defaultValue={today} className={inputClass} />
        </label>
      </div>

      {state.error && <Alert>{state.error}</Alert>}

      <button type="submit" disabled={pending} className={`${buttonClass("primary", "lg")} w-full sm:w-auto`}>
        {pending ? "Assigning..." : "Assign this tutor"}
      </button>
    </form>
  );
}
