"use client";

import { useActionState, useEffect, useRef } from "react";
import { addChild, type ChildState } from "./actions";
import { Alert, buttonClass, inputClass } from "@/components/ui";
import { gradeLabel } from "@/lib/labels";

const initialState: ChildState = {};
const grades = Array.from({ length: 13 }, (_, g) => g);

export default function AddChildForm() {
  const [state, formAction, pending] = useActionState(addChild, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-4 space-y-4 rounded-xl border border-dashed border-brand/40 bg-brand-soft/40 p-4">
      <p className="text-sm font-semibold">Add a child</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-muted">First name</span>
          <input name="firstName" required maxLength={50} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-muted">Grade</span>
          <select name="grade" required defaultValue="" className={inputClass}>
            <option value="">Choose a grade</option>
            {grades.map((g) => <option key={g} value={g}>{gradeLabel(g)}</option>)}
          </select>
        </label>
      </div>
      <p className="text-sm text-muted">We only ask for a first name and a grade.</p>
      {state.error && <Alert>{state.error}</Alert>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Adding..." : "Add child"}
      </button>
    </form>
  );
}
