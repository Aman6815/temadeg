"use client";

import { useActionState, useEffect, useRef } from "react";
import { docTypeLabels } from "@/lib/labels";
import { uploadDocument, type UploadState } from "./document-actions";
import { Alert, buttonClass, inputClass } from "@/components/ui";

const initialState: UploadState = {};

export default function UploadForm() {
  const [state, formAction, pending] = useActionState(uploadDocument, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4 rounded-xl border border-dashed border-brand/50 bg-brand-soft/40 p-5">
      <h3 className="font-display text-lg font-bold">Add a document</h3>

      <label className="block">
        <span className="text-sm font-semibold">Document type</span>
        <select name="docType" required defaultValue="" className={inputClass}>
          <option value="">Choose a type</option>
          {Object.entries(docTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-semibold">File</span>
        <input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png"
          className={`${inputClass} file:mr-4 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white`} />
        <span className="mt-1.5 block text-sm text-muted">PDF, JPG or PNG, up to 4 MB.</span>
      </label>

      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert tone="success">Document uploaded.</Alert>}

      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Uploading..." : "Upload document"}
      </button>
    </form>
  );
}
