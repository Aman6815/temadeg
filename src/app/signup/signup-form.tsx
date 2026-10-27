"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type SignupState } from "./actions";
import { Alert, buttonClass, ChoiceCard, Field, inputClass } from "@/components/ui";

const initialState: SignupState = {};

export default function SignupForm({ defaultRole }: { defaultRole: "parent" | "tutor" }) {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <>
      <form action={formAction} className="mt-8 space-y-5 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <fieldset>
          <legend className="text-sm font-semibold">I am signing up as</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <ChoiceCard
              name="role"
              value="parent"
              defaultChecked={defaultRole === "parent"}
              title="A parent or guardian"
              description="I want a tutor for my child."
            />
            <ChoiceCard
              name="role"
              value="tutor"
              defaultChecked={defaultRole === "tutor"}
              title="A tutor"
              description="I want to teach students."
            />
          </div>
        </fieldset>

        <Field label="Full name">
          <input name="fullName" required maxLength={100} autoComplete="name" className={inputClass} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </Field>
        <Field label="Password" hint="At least 8 characters, with letters and numbers.">
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        </Field>

        {state.error && <Alert>{state.error}</Alert>}

        <button type="submit" disabled={pending} className={`${buttonClass("primary", "lg")} w-full`}>
          {pending ? "Creating your account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-dark underline underline-offset-2">
          Log in
        </Link>
      </p>
    </>
  );
}
