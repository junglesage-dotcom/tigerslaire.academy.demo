import { useStore } from "../lib/store";
import { COURSES, TICKER_ITEMS, JOURNEY, fmtNaira, courseLessons, courseMinutes } from "../data/courses";
import type { Course } from "../data/courses";
import { Terminal, BOOT_LINES } from "../components/Terminal";
import { Ecosystem } from "../components/Ecosystem";
import { TigerMark } from "../components/TigerMark";
import { Scramble, Reveal, CountUp, SectionHead, Kicker, Marquee, Ring } from "../components/ui";
import {
  IconArrowRight,
  IconBars,
  IconBolt,
  IconClaw,
  IconDb,
  IconDoc,
  IconGlobe,
  IconLink,
  IconMegaphone,
  IconPlane,
  IconShield,
  IconUsers,
} from "../components/Icons";
import type { SVGProps } from "react";

const COURSE_ICON: Record<Course["icon"], (p: SVGProps<SVGSVGElement>) => React.JSX.Element> = {
  python: IconBars,
  business: IconDoc,
  shield: IconShield,
};

const STATS = [
  { to: 312, suffix: "", label: "students in the den" },
  { to: 30, suffix: "", label: "lessons live on the edge" },
  { to: 4862, suffix: "+", label: "Telegram deliveries" },
  { to: 92, suffix: "%", label: "course completion rate" },
];

const PRINCIPLES = [
  { icon: IconDb, title: "Database = structure & control", body: "Courses, lessons, progress and certificates live in D1 — always yours." },
  { icon: IconPlane, title: "Telegram = content delivery", body: "Channels and bots ship the material. Lesson 17 knows it is message #348." },
  { icon: IconGlobe, title: "Web & Mini App = experience", body: "The interfaces students touch, all reading one student record." },
];

const STACK_POINTS = [
  {
    icon: IconDb,
    title: "You own the database",
    body: "Students, enrollments, progress and certificates sit in your own tables — never rented from a marketplace, never locked inside a chat app. A clean access layer means D1 today, PostgreSQL tomorrow if the LMS grows teeth.",
  },
  {
    icon: IconMegaphone,
    title: "Telegram delivers, it doesn't decide",
    body: "Weekly drops land in private channels, but application logic never reads 'the 37th post'. Every lesson row maps to a channel and message id, so delivery can change without breaking the academy.",
  },
  {
    icon: IconLink,
    title: "One student identity",
    body: "A single student_id follows each learner across the website, the bot, the Mini App, WhatsApp and — eventually — the Flutter app. Link once with a one-time code; progress syncs everywhere.",
  },
  {
    icon: IconBolt,
    title: "Escape hatches everywhere",
    body: "Workers speaks plain REST, so any future client is just another consumer. Swap storage, swap channels, add a payment provider — none of it forces a rebuild.",
  },
];

export default function Home() {
  const { go, setAuthOpen, user } = useStore();

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b border-bone/10">
        <div className="grid-lines absolute inset-0" aria-hidden />
        <div className="absolute -right-44 top-8 h-[540px] w-[540px] rounded-full bg-amber/[0.06] blur-3xl" aria-hidden />
        <span
          className="outline-word pointer-events-none absolute -bottom-8 left-0 select-none font-display text-[24vw] font-extrabold leading-none"
          aria-hidden
        >
          LAIR
        </span>

        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:py-24">
          <div className="lg:col-span-6">
            <Reveal>
              <p className="flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.26em] text-amber">
                <IconClaw className="h-4 w-4" />
                Cloudflare edge × Telegram × one identity
              </p>
            </Reveal>
            <h1 className="mt-6 font-display font-extrabold leading-[0.92] tracking-tight text-bone">
              <Scramble text="TIGER'S" className="block text-[19vw] sm:text-8xl lg:text-[6.6rem]" />
              <Scramble
                text="LAIR"
                delay={450}
                className="block text-[19vw] text-amber sm:text-8xl lg:text-[6.6rem]"
              />
              <Scramble
                text="ACADEMY"
                delay={800}
                className="outline-word block text-[10vw] sm:text-5xl lg:text-6xl"
              />
            </h1>
            <Reveal delay={250}>
              <p className="mt-7 max-w-xl text-base leading-relaxed text-smoke sm:text-lg">
                Courses run on <span className="font-semibold text-bone">Cloudflare Workers</span>. The community lives on{" "}
                <span className="font-semibold text-tgsky">Telegram</span>. Your progress lives in{" "}
                <span className="font-semibold text-bone">one database</span> — the website, the bot and the Mini App all answer to it.
              </p>
            </Reveal>
            <Reveal delay={350}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => go({ view: "courses" })}
                  className="stripe-btn group flex items-center gap-3 rounded-md bg-amber px-6 py-3.5 font-display text-sm font-extrabold uppercase tracking-[0.08em] text-ink transition-transform hover:-translate-y-0.5"
                >
                  Browse the courses
                  <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <a
                  href="#blueprint"
                  className="rounded-md border border-bone/20 px-6 py-3.5 font-display text-sm font-bold uppercase tracking-[0.08em] text-bone transition-colors hover:border-amber hover:text-amber"
                >
                  Read the blueprint
                </a>
              </div>
            </Reveal>
            <Reveal delay={450}>
              <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.18em] text-smoke/70">
                ₦0 infrastructure to start · 100k worker requests/day free · 5 GB of D1 free
              </p>
            </Reveal>
          </div>

          <div className="relative lg:col-span-6">
            <Reveal delay={200}>
              <Terminal lines={BOOT_LINES} title="lair deploy — zsh" />
            </Reveal>
            <Reveal delay={500}>
              <div className="floaty absolute -bottom-6 -left-4 hidden rounded-md border border-bone/15 bg-coal px-4 py-3 shadow-xl sm:block">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-smoke">Next cohort</p>
                <p className="font-display text-lg font-extrabold text-amber">March 3 · 40 seats</p>
              </div>
            </Reveal>
          </div>
        </div>

        {/* stats */}
        <div className="relative border-t border-bone/10 bg-coal/60">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-bone/10 px-5 sm:px-8 md:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 90} className="px-4 py-7 first:pl-0 sm:px-8">
                <p className="font-display text-3xl font-extrabold text-bone sm:text-4xl">
                  <CountUp to={s.to} suffix={s.suffix} />
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-smoke">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Marquee items={TICKER_ITEMS} />

      {/* ============ BLUEPRINT ============ */}
      <section id="blueprint" className="bg-parch py-20 text-ink sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SectionHead
              dark
              kicker="The blueprint"
              title={
                <>
                  One backend. Every surface your{" "}
                  <span className="relative whitespace-nowrap">
                    students
                    <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" aria-hidden>
                      <path d="M2 6C60 1 140 1 198 5" fill="none" stroke="#ffa41b" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </span>{" "}
                  live on.
                </>
              }
              body="The website is the platform. Telegram is the delivery truck. Click any node to see what it's responsible for — and, just as importantly, what it isn't."
            />
            <Reveal delay={200}>
              <p className="max-w-[220px] border-l-2 border-khaki/40 pl-4 font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.16em] text-khaki">
                ↳ click any node in the diagram
              </p>
            </Reveal>
          </div>

          <Reveal className="mt-12">
            <Ecosystem />
          </Reveal>

          <div className="mt-10 grid divide-y divide-ink/10 border-t border-ink/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.title} delay={i * 110} className="flex gap-4 px-1 py-6 sm:px-8 first:sm:pl-1">
                <p.icon className="mt-1 h-6 w-6 shrink-0 text-khaki" />
                <div>
                  <h3 className="font-display text-base font-extrabold">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-khaki">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COURSE PREVIEW ============ */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHead
            kicker="The catalogue"
            title="Three tracks. One den."
            body="Small cohorts, weekly drops, real assignments. Enrol on the site — the bot takes it from there."
          />

          <div className="mt-12">
            {COURSES.map((c, i) => {
              const Icon = COURSE_ICON[c.icon];
              const lessons = courseLessons(c);
              return (
                <Reveal key={c.id} delay={i * 80}>
                  <button
                    onClick={() => go({ view: "course", courseId: c.id })}
                    className="group grid w-full items-center gap-5 border-t border-bone/10 py-8 text-left transition-colors last:border-b hover:bg-coal/70 md:grid-cols-12 md:gap-4 md:px-4"
                  >
                    <span className="outline-word font-display text-5xl font-extrabold md:col-span-1">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex items-center gap-5 md:col-span-6">
                      <span
                        className="card-lift flex h-14 w-14 shrink-0 items-center justify-center rounded-md border bg-coal"
                        style={{ borderColor: c.hue + "55", color: c.hue }}
                      >
                        <Icon className="h-7 w-7" />
                      </span>
                      <span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-smoke">{c.code} · {c.path}</span>
                        <span className="mt-1 block font-display text-2xl font-extrabold text-bone transition-colors group-hover:text-amber sm:text-3xl">
                          {c.title}
                        </span>
                        <span className="mt-1 block max-w-lg text-sm text-smoke">{c.tagline}</span>
                      </span>
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-smoke md:col-span-3">
                      {c.weeks} weeks · {lessons.length} lessons
                      <span className="mt-1 block text-smoke/70">{Math.round(courseMinutes(c) / 60)}h of material</span>
                    </span>
                    <span className="flex items-center justify-between gap-4 md:col-span-2 md:justify-end">
                      <span className="font-display text-xl font-extrabold text-bone">{fmtNaira(c.price)}</span>
                      <span className="flex items-center gap-2 rounded-md bg-amber px-4 py-2.5 font-display text-xs font-extrabold uppercase tracking-[0.08em] text-ink transition-transform group-hover:translate-x-1">
                        Open <IconArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ JOURNEY ============ */}
      <section className="border-t border-bone/10 bg-coal/40 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <SectionHead
                kicker="The student trail"
                title="From first click to certificate."
                body="The same journey whether a student finds you on the web or inside Telegram. Nothing about it depends on luck or screenshots."
              />
              <Reveal delay={250}>
                <div className="mt-8 flex items-center gap-4 rounded-md border border-bone/12 bg-ink p-4">
                  <Ring value={0.62} size={72} stroke={7}>
                    <span className="font-mono text-xs font-bold text-amber">62%</span>
                  </Ring>
                  <div>
                    <p className="font-display text-sm font-extrabold text-bone">PY101 · Ada Eze</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-smoke">
                      Week 3 · Variables &amp; data types · streak 9
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
          <div className="lg:col-span-7">
            <ol className="relative border-l border-bone/15 pl-8">
              {JOURNEY.map((j, i) => (
                <Reveal key={j.step} delay={i * 90}>
                  <li className="group relative pb-10 last:pb-0">
                    <span className="absolute -left-[41px] flex h-5 w-5 items-center justify-center rounded-full border border-amber bg-ink">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber transition-transform group-hover:scale-150" />
                    </span>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-amber">{j.step}</p>
                    <h3 className="mt-1.5 font-display text-2xl font-extrabold text-bone">{j.title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-smoke sm:text-base">{j.body}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ============ WHY THIS STACK ============ */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <SectionHead
                kicker="Why this stack"
                title={
                  <>
                    Start at <span className="text-amber">₦0</span>. Scale when the den fills up.
                  </>
                }
                body="Everything below runs on free tiers today and stays cheap long past 500 students."
              />
              <Reveal delay={220}>
                <div className="mt-8 rounded-lg border border-bone/12 bg-coal p-5">
                  <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-smoke">
                    <IconBolt className="h-4 w-4 text-amber" /> Monthly cost ledger
                  </p>
                  <dl className="mt-4 space-y-2.5 font-mono text-[12.5px]">
                    {[
                      ["Workers — 100k req/day", "₦0"],
                      ["D1 — 5 GB · 5M reads/day", "₦0"],
                      ["R2 — objects, zero egress", "₦0"],
                      ["Telegram Bot API", "₦0"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-baseline justify-between gap-4 border-b border-dashed border-bone/10 pb-2.5">
                        <dt className="text-smoke">{k}</dt>
                        <dd className="font-bold text-mint">{v}</dd>
                      </div>
                    ))}
                    <div className="flex items-baseline justify-between gap-4 pt-1">
                      <dt className="text-bone">Total to your first 50 students</dt>
                      <dd className="font-display text-2xl font-extrabold text-amber">₦0</dd>
                    </div>
                  </dl>
                </div>
              </Reveal>
            </div>
          </div>
          <div className="space-y-12 lg:col-span-7">
            {STACK_POINTS.map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <div className="group border-l-2 border-amber/50 pl-6 transition-all hover:border-amber hover:pl-8 sm:pl-8 sm:hover:pl-10">
                  <p.icon className="h-7 w-7 text-amber" />
                  <h3 className="mt-3 font-display text-2xl font-extrabold text-bone sm:text-3xl">{p.title}</h3>
                  <p className="mt-3 max-w-2xl leading-relaxed text-smoke">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FROM THE LAIR ============ */}
      <section className="border-t border-bone/10 bg-coal/40 py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <div className="relative mx-auto max-w-sm">
              <div className="stripe-band absolute -inset-2 rounded-lg opacity-70" aria-hidden />
              <div className="relative overflow-hidden rounded-lg border border-bone/15 bg-ink">
                <TigerMark className="aspect-square w-full" />
                <p className="absolute bottom-3 left-3 rounded bg-ink/80 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-amber">
                  est. Lagos · the den
                </p>
              </div>
            </div>
          </Reveal>
          <div className="lg:col-span-8">
            <Reveal>
              <Kicker>From the Lair</Kicker>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="mt-4 font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-bone sm:text-5xl">
                Built by an engineer who teaches, taught by an engineer who builds.
              </h2>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-6 max-w-2xl leading-relaxed text-smoke">
                The Lair started as weekend classes in a group chat. It became an academy when the same question kept coming:{" "}
                <span className="text-bone">"how do I track who actually finished?"</span> So the tracking got built properly — a real
                database, a real enrolment flow, and Telegram doing what Telegram is best at: showing up where students already are.
              </p>
            </Reveal>
            <Reveal delay={260}>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                <div>
                  <p className="font-display text-2xl font-extrabold text-amber">3 cohorts</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-smoke">shipped end-to-end</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-extrabold text-amber">4 phases</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-smoke">web → bot → LMS → Mini App</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-extrabold text-amber">₦0</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-smoke">spent on infrastructure</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <p className="mt-8 font-mono text-xs tracking-[0.08em] text-smoke/80">
                — T. Adebayo · Cloudflare · PostgreSQL · Flutter · Telegram Bot API
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative overflow-hidden border-t border-bone/10">
        <div className="stripe-band h-3" aria-hidden />
        <div className="relative bg-coal py-20 text-center sm:py-24">
          <span className="outline-word pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-display text-[18vw] font-extrabold" aria-hidden>
            OPEN
          </span>
          <div className="relative mx-auto max-w-3xl px-5">
            <Reveal>
              <IconUsers className="mx-auto h-8 w-8 text-amber" />
            </Reveal>
            <Reveal delay={100}>
              <h2 className="mt-5 font-display text-5xl font-extrabold tracking-tight text-bone sm:text-6xl">
                The den is <span className="text-amber">open.</span>
              </h2>
            </Reveal>
            <Reveal delay={180}>
              <p className="mx-auto mt-5 max-w-xl text-smoke">
                Forty seats per cohort. Materials in your Telegram, progress on your dashboard, certificate from a database that
                remembers you.
              </p>
            </Reveal>
            <Reveal delay={260}>
              <div className="mt-9 flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => go({ view: "courses" })}
                  className="stripe-btn rounded-md bg-amber px-8 py-4 font-display text-sm font-extrabold uppercase tracking-[0.08em] text-ink transition-transform hover:-translate-y-0.5"
                >
                  Claim a seat
                </button>
                <button
                  onClick={() => (user ? go({ view: "dashboard" }) : setAuthOpen(true))}
                  className="rounded-md border border-bone/20 px-8 py-4 font-display text-sm font-bold uppercase tracking-[0.08em] text-bone transition-colors hover:border-amber hover:text-amber"
                >
                  {user ? "Open dashboard" : "Sign in"}
                </button>
              </div>
            </Reveal>
          </div>
        </div>
        <div className="stripe-band h-3" aria-hidden />
      </section>
    </div>
  );
}
