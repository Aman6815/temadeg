import Link from "next/link";
import { docTypeLabels } from "@/lib/labels";
import { deleteDocument } from "./document-actions";
import UploadForm from "./upload-form";
import { buttonClass, CheckIcon } from "@/components/ui";

type Doc = {
  id: string;
  doc_type: string;
  original_name: string;
  size_bytes: number;
};

export default function DocumentsStep({
  documents,
  isStudent,
}: {
  documents: Doc[];
  isStudent: boolean;
}) {
  const has = (...types: string[]) => documents.some((d) => types.includes(d.doc_type));

  const checklist: { done: boolean; label: string }[] = [
    { done: has("national_id"), label: "National ID, Fayda ID or passport" },
    { done: has("transcript", "grade12_result", "degree"), label: "Proof of education: transcript, Grade 12 result or degree" },
  ];
  if (isStudent) {
    checklist.push({ done: has("student_id"), label: "Student ID" });
  }

  return (
    <div className="space-y-6">
      <p className="text-muted">
        Only you and the Temadeg team can see your documents. Families never see them.
      </p>

      <div>
        <h3 className="text-sm font-semibold">Required</h3>
        <ul className="mt-2 space-y-2">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-3">
              <CheckIcon done={item.done} />
              <span className={item.done ? "text-muted line-through" : ""}>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {documents.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">Uploaded</h3>
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-white">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold">{docTypeLabels[doc.doc_type]}</p>
                  <p className="truncate text-sm text-muted">
                    {doc.original_name}, {Math.max(1, Math.round(doc.size_bytes / 1024))} KB
                  </p>
                </div>
                <form action={deleteDocument}>
                  <input type="hidden" name="id" value={doc.id} />
                  <button type="submit" className={buttonClass("ghost")}>Remove</button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      <UploadForm />

      <div className="flex items-center justify-between border-t border-line pt-6">
        <Link href="/tutor/apply?step=4" className={buttonClass("ghost")}>Back</Link>
        <Link href="/tutor/apply?step=6" className={buttonClass("primary", "lg")}>Continue</Link>
      </div>
    </div>
  );
}
