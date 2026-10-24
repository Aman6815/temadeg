"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-3xl font-bold">ተማደግ</h1>
      <p className="mt-1 opacity-70">መግቢያ · Log in</p>

      <form action={formAction} className="mt-6 space-y-4">
        <label className="block">
          <span className="font-medium">ኢሜይል (Email)</span>
          <input name="email" type="email" required autoComplete="email"
            className="mt-1 w-full rounded border bg-transparent px-3 py-2" />
        </label>

        <label className="block">
          <span className="font-medium">የይለፍ ቃል (Password)</span>
          <input name="password" type="password" required
            autoComplete="current-password"
            className="mt-1 w-full rounded border bg-transparent px-3 py-2" />
        </label>

        {state.error && (
          <p role="alert" className="text-red-500">{state.error}</p>
        )}

        <button type="submit" disabled={pending}
          className="w-full rounded bg-green-700 px-4 py-2 font-medium text-white disabled:opacity-50">
          {pending ? "በመግባት ላይ… (Logging in…)" : "ይግቡ (Log in)"}
        </button>
      </form>

      <p className="mt-4 text-sm">
        አካውንት የለዎትም?{" "}
        <Link href="/signup" className="underline">ይመዝገቡ (Sign up)</Link>
      </p>
    </main>
  );
}