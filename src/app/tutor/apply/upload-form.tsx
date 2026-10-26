"use client";

import { useActionState, useEffect, useRef } from "react";
import { docTypeLabels } from "@/lib/labels";
import { uploadDocument, type UploadState } from "./document-actions";

const initialState: UploadState = {};
const input = "mt-1 w-full rounded border bg-transparent px-3 py-2";

export default function UploadForm() {
  const [state, formAction, pending] = useActionState(uploadDocument, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded border p-4">
      <h3 className="font-medium">ሰነድ ያክሉ (Add a document)</h3>

      <label className="block">
        <span>የሰነድ ዓይነት (Document type)</span>
        <select name="docType" required defaultValue="" className={input}>
          <option value="">—</option>
          {Object.entries(docTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span>ፋይል (File)</span>
        <input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png"
          className={input} />
        <span className="text-sm opacity-70">
          PDF፣ JPG ወይም PNG፣ ከ5 MB ያልበለጠ (PDF, JPG or PNG, up to 5 MB)
        </span>
      </label>

      {state.error && <p role="alert" className="text-red-500">{state.error}</p>}
      {state.ok && <p className="text-green-600">ተጭኗል (Uploaded)</p>}

      <button type="submit" disabled={pending}
        className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50">
        {pending ? "በመጫን ላይ… (Uploading…)" : "ጫን (Upload)"}
      </button>
    </form>
  );
}