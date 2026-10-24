"use client";

import { useActionState } from "react";
import { signup, type SignupState } from "./actions";

const initialState: SignupState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-3xl font-bold">ተማደግ</h1>
      <p className="mt-1 opacity-70">መመዝገቢያ · Create your account</p>

      <form action={formAction} className="mt-6 space-y-4">
        <fieldset className="space-y-2">
          <legend className="font-medium">እኔ... (I am a...)</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="role" value="parent" defaultChecked />
            ወላጅ (Parent)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="role" value="tutor" />
            አስጠኚ (Tutor)
          </label>
        </fieldset>

        <label className="block">
          <span className="font-medium">ሙሉ ስም (Full name)</span>
          <input name="fullName" required maxLength={100} autoComplete="name"
            className="mt-1 w-full rounded border bg-transparent px-3 py-2" />
        </label>

        <label className="block">
          <span className="font-medium">ኢሜይል (Email)</span>
          <input name="email" type="email" required autoComplete="email"
            className="mt-1 w-full rounded border bg-transparent px-3 py-2" />
        </label>

        <label className="block">
          <span className="font-medium">የይለፍ ቃል (Password)</span>
          <input name="password" type="password" required minLength={8}
            autoComplete="new-password"
            className="mt-1 w-full rounded border bg-transparent px-3 py-2" />
          <span className="text-sm opacity-70">
            ቢያንስ 8 ቁምፊዎች፣ ፊደላትና ቁጥሮች (At least 8 characters, letters and digits)
          </span>
        </label>

        {state.error && (
          <p role="alert" className="text-red-500">{state.error}</p>
        )}

        <button type="submit" disabled={pending}
          className="w-full rounded bg-green-700 px-4 py-2 font-medium text-white disabled:opacity-50">
          {pending ? "በመመዝገብ ላይ… (Signing up…)" : "ይመዝገቡ (Sign up)"}
        </button>
      </form>
    </main>
  );
}