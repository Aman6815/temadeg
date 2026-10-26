import Link from "next/link";
import { docTypeLabels } from "@/lib/labels";
import { deleteDocument } from "./document-actions";
import UploadForm from "./upload-form";

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
    {
      done: has("national_id"),
      label: "ብሔራዊ መታወቂያ፣ ፋይዳ ወይም ፓስፖርት (National ID, Fayda or passport)",
    },
    {
      done: has("transcript", "grade12_result", "degree"),
      label: "የትምህርት ማስረጃ፦ ትራንስክሪፕት፣ የ12ኛ ክፍል ውጤት ወይም ዲግሪ (Academic proof: transcript, Grade 12 result or degree)",
    },
  ];
  if (isStudent) {
    checklist.push({ done: has("student_id"), label: "የተማሪ መታወቂያ (Student ID)" });
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm opacity-70">
        ሰነዶችዎ ለእርስዎና ለድርጅቱ ብቻ ይታያሉ፤ ወላጆች አያዩም (Your documents are visible only to you and the organization, never to parents)
      </p>

      <ul className="space-y-1">
        {checklist.map((item) => (
          <li key={item.label}>
            {item.done ? "✅" : "⬜"} {item.label}
          </li>
        ))}
      </ul>

      {documents.length > 0 && (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-2 rounded border p-3">
              <div>
                <p className="font-medium">{docTypeLabels[doc.doc_type]}</p>
                <p className="text-sm opacity-70">
                  {doc.original_name} · {Math.round(doc.size_bytes / 1024)} KB
                </p>
              </div>
              <form action={deleteDocument}>
                <input type="hidden" name="id" value={doc.id} />
                <button type="submit" className="underline">ሰርዝ (Delete)</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <UploadForm />

      <div className="flex items-center justify-between pt-2">
        <Link href="/tutor/apply?step=4" className="underline">ተመለስ (Back)</Link>
        <Link href="/tutor/apply?step=6"
          className="rounded bg-green-700 px-4 py-2 font-medium text-white">
          ቀጥል (Next)
        </Link>
      </div>
    </div>
  );
}