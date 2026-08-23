import { useState } from "react";
import { useStore } from "../lib/store";
import { COURSES, fmtNaira, courseLessons, courseMinutes } from "../data/courses";
import { Reveal, SectionHead } from "../components/ui";
import { IconArrowRight, IconBars, IconCheck, IconDoc, IconMegaphone, IconPlane, IconSeal, IconShield } from "../components/Icons";
import type { Course } from "../data/courses";
import type { SVGProps } from "react";

const COURSE_ICON: Record<Course["icon"], (p: SVGProps<SVGSVGElement>) => React.JSX.Element> = {
  python: IconBars,
  business: IconDoc,
  shield: IconShield,
};

const LEVELS = ["All", "Beginner", "Intermediate"] as const;

export default function Catalog() {
  const { go, isEnrolled, progressOf } = useStore();
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("All");

  const filtered = COURSES.filter((c) => level === "All" || c.level === level);

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <SectionHead
          kicker="Course catalogue"
          title="Pick your track."
          body="Every enrolment includes a private Telegram channel, bot reminders, graded assignments and a verifiable certificate."
        />
        <Reveal delay={150}>
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`rounded-md px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                  level === l ? "bg-amber font-bold text-ink" : "border border-bone/15 text-smoke hover:border-amber hover:text-amber"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      <p className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.2em] text-smoke/70">
        {filtered.length} course{filtered.length === 1 ? "" : "s"} · next cohort March 3
      </p>

      <div className="mt-4 space-y-6">
        {filtered.map((c, i) => {
          const Icon = COURSE_ICON[c.icon];
          const lessons = courseLessons(c);
          const enrolled = isEnrolled(c.id);
          const prog = Math.round(progressOf(c.id) * 100);
          return (
            <Reveal key={c.id} delay={i * 90}>
              <article
                className="card-lift group relative overflow-hidden rounded-lg border border-bone/12 bg-coal hover:border-bone/25"
                style={{ borderLeftWidth: 4, borderLeftColor: c.hue }}
              >
                <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
                  <div className="flex items-start gap-5 lg:col-span-7">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border bg-ink" style={{ borderColor: c.hue + "55", color: c.hue }}>
                      <Icon className="h-8 w-8" />
                    </span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-smoke">
                        {c.code} · {c.path}
                      </p>
                      <h2 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-bone transition-colors group-hover:text-amber">
                        {c.title}
                      </h2>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-smoke">{c.tagline}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {c.skills.map((s) => (
                          <span key={s} className="rounded-full border border-bone/12 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-smoke">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <dl className="space-y-2 font-mono text-[12px] text-smoke">
                      <div className="flex justify-between border-b border-dashed border-bone/10 pb-2">
                        <dt>Duration</dt>
                        <dd className="text-bone">{c.weeks} weeks</dd>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-bone/10 pb-2">
                        <dt>Lessons</dt>
                        <dd className="text-bone">
                          {lessons.length} · {Math.round(courseMinutes(c) / 60)}h
                        </dd>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-bone/10 pb-2">
                        <dt>Channel</dt>
                        <dd className="text-tgsky">{c.channel.replace("t.me/", "@")}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Price</dt>
                        <dd className="font-display text-lg font-extrabold text-amber">{fmtNaira(c.price)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="lg:col-span-2">
                    {enrolled ? (
                      <div>
                        <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mint">
                          <IconCheck className="h-3.5 w-3.5" /> Enrolled · {prog}%
                        </p>
                        <div className="h-2 overflow-hidden rounded-full bg-ink">
                          <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${prog}%`, background: c.hue }} />
                        </div>
                        <button
                          onClick={() => go({ view: "course", courseId: c.id })}
                          className="stripe-btn mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-bone px-4 py-3 font-display text-xs font-extrabold uppercase tracking-[0.08em] text-ink"
                        >
                          Continue <IconArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => go({ view: "course", courseId: c.id })}
                        className="stripe-btn flex w-full items-center justify-center gap-2 rounded-md bg-amber px-4 py-3.5 font-display text-xs font-extrabold uppercase tracking-[0.08em] text-ink transition-transform hover:-translate-y-0.5"
                      >
                        View course <IconArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={120}>
        <div className="mt-14 grid gap-6 rounded-lg border border-dashed border-bone/15 p-6 sm:grid-cols-3 sm:p-8">
          {[
            { icon: IconMegaphone, title: "Private channel per course", body: "Weekly lecture, PDF and assignment drops — mapped lesson-by-lesson in the database." },
            { icon: IconPlane, title: "Bot that nags kindly", body: "@TigersLairBot sends reminders, verifies students and answers the 2 a.m. 'where is week 3?' question." },
            { icon: IconSeal, title: "Certificates you can verify", body: "Each certificate carries an ID minted from your own records — not a screenshot." },
          ].map((f) => (
            <div key={f.title} className="flex gap-4">
              <f.icon className="mt-1 h-6 w-6 shrink-0 text-amber" />
              <div>
                <h3 className="font-display text-base font-extrabold text-bone">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-smoke">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
