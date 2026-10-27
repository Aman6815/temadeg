import Link from "next/link";
import { applySteps } from "./steps";

export default function Stepper({ step }: { step: number }) {
  const total = applySteps.length;
  return (
    <div>
      <p className="text-sm font-semibold text-muted sm:hidden">
        Step {step} of {total}: {applySteps[step - 1].title}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-line sm:hidden">
        <div className="h-full rounded-full bg-brand" style={{ width: `${(step / total) * 100}%` }} />
      </div>

      <ol className="hidden items-start sm:flex">
        {applySteps.map((s, i) => {
          const n = i + 1;
          const done = n < step;
          const current = n === step;
          return (
            <li key={s.short} className="flex flex-1 flex-col items-center text-center">
              <div className="flex w-full items-center">
                <span className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : n <= step ? "bg-brand" : "bg-line"}`} />
                <Link
                  href={`/tutor/apply?step=${n}`}
                  aria-current={current ? "step" : undefined}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                    current
                      ? "border-brand bg-brand text-white"
                      : done
                        ? "border-brand bg-brand-soft text-brand-dark"
                        : "border-line bg-white text-muted hover:border-brand"
                  }`}
                >
                  {done ? "✓" : n}
                </Link>
                <span className={`h-0.5 flex-1 ${i === total - 1 ? "bg-transparent" : n < step ? "bg-brand" : "bg-line"}`} />
              </div>
              <span className={`mt-2 text-xs font-semibold ${current ? "text-ink" : "text-muted"}`}>{s.short}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
