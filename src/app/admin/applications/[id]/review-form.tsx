"use client";

import { useActionState } from "react";
import { reviewApplication, type ReviewState } from "./actions";
import { Alert, buttonClass, inputClass } from "@/components/ui";

const initialState: ReviewState = {};

const options = [
  { value: "approved", title: "Approve", description: "The tutor's profile becomes visible to families." },
  { value: "needs_info", title: "Ask for more information", description: "The tutor can edit and submit again." },
  { value: "rejected", title: "Do not approve", description: "The tutor sees your note and cannot edit." },
];

export default function ReviewForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(reviewApplication, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={id} />

      <fieldset>
        <legend className="font-display text-lg font-bold">Your decision</legend>
        <div className="mt-3 space-y-2">
          {options.map((o) => (
            <label key={o.value} className="block cursor-pointer">
              <input type="radio" name="decision" value={o.value} required className="peer sr-only" />
              <span className="block rounded-xl border border-line bg-white p-4 transition-colors hover:border-brand peer-checked:border-brand peer-checked:bg-brand-soft peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
                <span className="block font-semibold">{o.title}</span>
                <span className="block text-sm text-muted">{o.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-sm font-semibold">
          Note to the tutor <span className="font-normal text-muted">required unless you approve</span>
        </span>
        <textarea name="feedback" rows={4} maxLength={2000} className={inputClass} />
      </label>

      {state.error && <Alert>{state.error}</Alert>}

      <button type="submit" disabled={pending} className={`${buttonClass("primary", "lg")} w-full`}>
        {pending ? "Saving..." : "Save decision"}
      </button>
    </form>
  );
}
