"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { Alert, buttonClass, Field, inputClass, PageShell } from "@/components/ui";
import PasswordInput from "@/components/password-input";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <PageShell width="max-w-md">
      <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-muted">Log in to continue to your Temadeg account.</p>

      <form action={formAction} className="mt-8 space-y-5 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </Field>
        <Field label="Password">
          <PasswordInput name="password" autoComplete="current-password" />
        </Field>

        {state.error && <Alert>{state.error}</Alert>}

        <button type="submit" disabled={pending} className={`${buttonClass("primary", "lg")} w-full`}>
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New to Temadeg?{" "}
        <Link href="/signup" className="font-semibold text-brand-dark underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </PageShell>
  );
}
