import type { ReactNode } from "react";
import { statusLabels } from "@/lib/labels";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "border border-line bg-white text-ink hover:border-brand hover:text-brand-dark",
  ghost: "text-ink hover:bg-brand-soft",
  danger: "bg-red-700 text-white hover:bg-red-800",
  accent: "bg-marigold text-ink hover:bg-[#ffc93d]",
};

const sizes: Record<Size, string> = {
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md") {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

export const inputClass =
  "mt-1.5 block w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

export const selectClass = inputClass;

export function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">
        {label}
        {optional && <span className="ml-1.5 font-normal text-muted">optional</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-sm text-muted">{hint}</span>}
    </label>
  );
}

export function Alert({
  tone = "error",
  children,
}: {
  tone?: "error" | "info" | "success";
  children: ReactNode;
}) {
  const tones = {
    error: "border-red-200 bg-red-50 text-red-900",
    info: "border-line bg-brand-soft text-brand-dark",
    success: "border-grow/30 bg-grow-soft text-grow",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tones: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    submitted: "bg-marigold-soft text-[#7a5800]",
    needs_info: "bg-orange-100 text-orange-900",
    approved: "bg-grow-soft text-grow",
    rejected: "bg-red-100 text-red-900",
  };
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${tones[status] ?? tones.draft}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}

// A pill-shaped checkbox or radio. Selection is shown by colour and a check mark.
export function Chip({
  type = "checkbox",
  name,
  value,
  defaultChecked,
  required,
  children,
}: {
  type?: "checkbox" | "radio";
  name: string;
  value: string | number;
  defaultChecked?: boolean;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type={type}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        required={required}
        className="peer sr-only"
      />
      <span className="inline-flex items-center rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-brand peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
        {children}
      </span>
    </label>
  );
}

// A larger selectable card with a title and description (used for choosing a role).
export function ChoiceCard({
  name,
  value,
  defaultChecked,
  title,
  description,
}: {
  name: string;
  value: string;
  defaultChecked?: boolean;
  title: string;
  description: string;
}) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} required className="peer sr-only" />
      <span className="block h-full rounded-xl border border-line bg-white p-4 transition-colors hover:border-brand peer-checked:border-brand peer-checked:bg-brand-soft peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
        <span className="block font-semibold text-ink">{title}</span>
        <span className="mt-1 block text-sm text-muted">{description}</span>
      </span>
    </label>
  );
}

export function CheckIcon({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
        done ? "border-brand bg-brand text-white" : "border-line bg-white text-transparent"
      }`}
    >
      ✓
    </span>
  );
}

export function PageShell({ children, width = "max-w-3xl" }: { children: ReactNode; width?: string }) {
  return <main className={`mx-auto w-full ${width} px-5 py-10 sm:py-14`}>{children}</main>;
}

export function Pill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "gold" | "green" | "red" | "blue";
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700",
    gold: "bg-marigold-soft text-[#7a5800]",
    green: "bg-grow-soft text-grow",
    red: "bg-red-100 text-red-900",
    blue: "bg-brand-soft text-brand-dark",
  };
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${tones[tone]}`}>{children}</span>
  );
}

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
