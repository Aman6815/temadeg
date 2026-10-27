import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { commissionPercent, site, tutorSharePercent } from "@/config/site";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const times = ["4 PM", "5 PM", "6 PM"];

// An example week: [day index, time index] -> lesson
const lessons: Record<string, { subject: string; tone: "brand" | "gold" | "soft" }> = {
  "0-0": { subject: "Maths", tone: "brand" },
  "2-0": { subject: "Maths", tone: "brand" },
  "1-1": { subject: "English", tone: "gold" },
  "3-1": { subject: "English", tone: "gold" },
  "5-0": { subject: "Science", tone: "soft" },
};

const toneClass = {
  brand: "bg-brand text-white",
  gold: "bg-marigold text-ink",
  soft: "bg-grow-soft text-grow",
};

function WeekExample() {
  return (
    <figure className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
      <figcaption className="mb-4">
        <p className="font-display text-lg font-bold">A Grade 6 student&apos;s week</p>
        <p className="text-sm text-muted">Example schedule. Lessons fit around school and family time.</p>
      </figcaption>

      <div className="grid grid-cols-[3rem_repeat(6,minmax(0,1fr))] gap-1.5 text-center text-xs sm:text-sm">
        <div />
        {weekdays.map((d) => (
          <div key={d} className="pb-1 font-semibold text-muted">{d}</div>
        ))}

        {times.map((t, ti) => (
          <div key={t} className="contents">
            <div className="flex items-center justify-end pr-1.5 text-muted">{t}</div>
            {weekdays.map((d, di) => {
              const lesson = lessons[`${di}-${ti}`];
              return lesson ? (
                <div key={d} className={`flex h-12 items-center justify-center rounded-lg font-semibold sm:h-14 ${toneClass[lesson.tone]}`}>
                  {lesson.subject}
                </div>
              ) : (
                <div key={d} className="h-12 rounded-lg border border-dashed border-line sm:h-14" />
              );
            })}
          </div>
        ))}
      </div>
    </figure>
  );
}

const steps = [
  {
    title: "Tell us what your child needs",
    body: "Share the grade, the subjects, the days and hours that suit your family, and whether you prefer online or in-person lessons.",
  },
  {
    title: "We match you with a verified tutor",
    body: "We look at the approved tutors who fit, and we confirm the match ourselves. You can also read the profiles of approved tutors.",
  },
  {
    title: "Lessons begin, and you get one monthly bill",
    body: "You pay Temadeg, not the tutor. We pay the tutor, and we are here to help if you need to change tutors.",
  },
];

const checks = [
  {
    title: "Identity",
    body: "Every tutor submits a national ID, Fayda ID or passport, and we review it ourselves.",
  },
  {
    title: "Education",
    body: "We review transcripts, national exam results and certificates before a tutor is approved.",
  },
  {
    title: "Experience",
    body: "Tutors describe their teaching experience, the grades they teach and their languages, and we read every application.",
  },
  {
    title: "Privacy",
    body: "Tutor documents stay private. Families see a profile summary, never IDs or transcripts. For children, we keep only a first name and grade.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
        <div>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            A tutor you can trust, for every grade from KG to 12
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            {site.name} checks every tutor&apos;s identity and qualifications, then matches your child with
            someone who fits their grade, subjects and weekly schedule.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup?role=parent" className={buttonClass("primary", "lg")}>
              Find a tutor
            </Link>
            <Link href="/signup?role=tutor" className={buttonClass("secondary", "lg")}>
              Apply as a tutor
            </Link>
          </div>
          <p className="mt-5 text-sm text-muted">
            Families pay one monthly bill to {site.name}, never to the tutor.
          </p>
        </div>

        <WeekExample />
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-line bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">How it works for families</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="relative border-t-2 border-brand pt-5">
                <span className="font-display text-4xl font-bold text-brand">{i + 1}</span>
                <h3 className="mt-3 text-xl font-bold leading-snug">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Safety */}
      <section id="safety" className="scroll-mt-20 mx-auto w-full max-w-6xl px-5 py-16 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Every tutor is checked before they teach
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted">
              Your child&apos;s safety comes first. Nobody becomes a {site.name} tutor without passing our review.
            </p>
          </div>
          <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {checks.map((c) => (
              <div key={c.title} className="border-l-2 border-grow pl-4">
                <dt className="text-lg font-bold">{c.title}</dt>
                <dd className="mt-1 leading-relaxed text-muted">{c.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* For tutors */}
      <section id="for-tutors" className="scroll-mt-20 bg-brand-dark text-white">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Teach the families who need you
            </h2>
            <ul className="mt-6 space-y-3 text-lg leading-relaxed text-white/90">
              <li>We match you by grade, subject and schedule, so you only get students you can help.</li>
              <li>You keep {tutorSharePercent}% of every lesson fee. {site.name} keeps {commissionPercent}% and handles billing.</li>
              <li>You choose the days and hours you are available.</li>
            </ul>
          </div>
          <div className="lg:justify-self-end">
            <Link href="/signup?role=tutor" className={buttonClass("accent", "lg")}>
              Start your application
            </Link>
            <p className="mt-3 text-sm text-white/75">It takes about 15 minutes, and you can save and come back.</p>
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 text-center lg:py-24">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Tell us what your child needs
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted">
          Create a free account, add your child&apos;s grade and subjects, and we will take it from there.
        </p>
        <Link href="/signup?role=parent" className={`${buttonClass("primary", "lg")} mt-8`}>
          Find a tutor
        </Link>
      </section>
    </>
  );
}
