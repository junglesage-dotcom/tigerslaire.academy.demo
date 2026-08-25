import { useStore } from "../lib/store";
import type { Activity } from "../lib/store";
import { getCourse, courseLessons } from "../data/courses";
import { Reveal, Ring, Kicker } from "../components/ui";
import {
  IconArrowRight,
  IconBars,
  IconBell,
  IconBook,
  IconBolt,
  IconCalendar,
  IconCheck,
  IconClipboard,
  IconDoc,
  IconFlame,
  IconLock,
  IconPlane,
  IconSeal,
  IconShield,
} from "../components/Icons";
import type { SVGProps, ComponentType } from "react";

const COURSE_ICON: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  python: IconBars,
  business: IconDoc,
  shield: IconShield,
};

const KIND_ICON: Record<Activity["kind"], ComponentType<SVGProps<SVGSVGElement>>> = {
  enroll: IconBook,
  lesson: IconCheck,
  quiz: IconSeal,
  cert: IconSeal,
  telegram: IconPlane,
  system: IconBolt,
};

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

function Toggle({ on, onChange, label, sub, hue }: { on: boolean; onChange: (v: boolean) => void; label: string; sub: string; hue: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-4 rounded-md border border-bone/10 bg-coal px-4 py-3 text-left transition-colors hover:border-bone/25"
    >
      <span>
        <span className="block text-sm font-bold text-bone">{label}</span>
        <span className="block font-mono text-[9.5px] uppercase tracking-[0.12em] text-smoke/70">{sub}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "" : "bg-soot"}`} style={on ? { background: hue } : undefined}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-all ${on ? "left-[22px]" : "left-0.5 bg-smoke"}`}
        />
      </span>
    </button>
  );
}

export default function Dashboard() {
  const { user, state, go, setAuthOpen, setTgOpen, progressOf, enrollmentFor, loginDemo, certificateId, setPref, toast, unlinkTelegram } = useStore();

  if (!user) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-5 py-28 text-center sm:py-36">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-bone/15 text-smoke">
          <IconLock className="h-7 w-7" />
        </span>
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-bone sm:text-5xl">
          The den keeps its records private.
        </h1>
        <p className="mt-4 max-w-md leading-relaxed text-smoke">
          Sign in to see your lessons, progress, Telegram link and certificates. Or load the demo student and look around.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button onClick={() => setAuthOpen(true)} className="stripe-btn rounded-md bg-amber px-7 py-3.5 font-display text-sm font-extrabold uppercase tracking-[0.08em] text-ink transition-transform hover:-translate-y-0.5">
            Sign in / create account
          </button>
          <button onClick={loginDemo} className="rounded-md border border-bone/20 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.08em] text-bone transition-colors hover:border-amber hover:text-amber">
            Load demo student
          </button>
        </div>
      </div>
    );
  }

  const enrollments = state.enrollments;
  const lessonsDone = enrollments.reduce((a, e) => a + e.completed.length, 0);
  const quizzesPassed = enrollments.filter((e) => e.quizPassed).length;
  const overall = enrollments.length
    ? enrollments.reduce((a, e) => a + progressOf(e.courseId), 0) / enrollments.length
    : 0;
  const minutesLearned = enrollments.reduce((a, e) => {
    const c = getCourse(e.courseId);
    if (!c) return a;
    return a + courseLessons(c).filter((l) => e.completed.includes(l.id)).reduce((b, l) => b + l.minutes, 0);
  }, 0);

  const deadlines = enrollments.flatMap((e) => {
    const c = getCourse(e.courseId);
    if (!c) return [];
    const nextAssignment = courseLessons(c).find((l) => l.tags.includes("Assignment") && !e.completed.includes(l.id));
    if (!nextAssignment) return [];
    const dueIn = (nextAssignment.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0) % 5) + 1;
    const due = new Date(Date.now() + dueIn * 86400000);
    return [{ course: c, lesson: nextAssignment, due, dueIn }];
  });

  const certs = enrollments.map((e) => ({ e, c: getCourse(e.courseId), id: certificateId(e.courseId) })).filter((x) => x.c && x.id);

  return (
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
      <Reveal>
        <Kicker>Den dashboard</Kicker>
      </Reveal>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
        <Reveal delay={80}>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-bone sm:text-6xl">
            Welcome back, <span className="text-amber">{user.name.split(" ")[0]}.</span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <div className="flex items-center gap-5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-smoke">
            <span className="flex items-center gap-2">
              <IconFlame className="h-4 w-4 text-ember" /> streak · 9 days
            </span>
            <span>student_id {user.id}</span>
          </div>
        </Reveal>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-12">
        {/* -------- left column -------- */}
        <div className="space-y-6 lg:col-span-8">
          {/* overview */}
          <Reveal>
            <div className="flex flex-wrap items-center gap-7 rounded-lg border border-bone/12 bg-coal p-6 sm:p-7">
              <Ring value={overall} size={110} stroke={10}>
                <div className="text-center">
                  <p className="font-display text-2xl font-extrabold text-bone">{Math.round(overall * 100)}%</p>
                  <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-smoke">overall</p>
                </div>
              </Ring>
              <div className="grid flex-1 grid-cols-2 gap-5 sm:grid-cols-4">
                {[
                  { v: String(enrollments.length), l: "courses" },
                  { v: String(lessonsDone), l: "lessons done" },
                  { v: String(quizzesPassed), l: "quizzes passed" },
                  { v: `${Math.round(minutesLearned / 60)}h`, l: "material covered" },
                ].map((s) => (
                  <div key={s.l}>
                    <p className="font-display text-3xl font-extrabold text-bone">{s.v}</p>
                    <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-smoke">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* continue learning */}
          <Reveal delay={80}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold text-bone">Continue learning</h2>
              <button onClick={() => go({ view: "courses" })} className="group flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-amber">
                catalogue <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </Reveal>

          {enrollments.length === 0 ? (
            <Reveal delay={140}>
              <div className="rounded-lg border border-dashed border-bone/20 p-10 text-center">
                <p className="font-display text-2xl font-extrabold text-bone">No courses yet — the trail starts empty.</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-smoke">Pick a track from the catalogue and the bot will meet you in Telegram with week one.</p>
                <button onClick={() => go({ view: "courses" })} className="stripe-btn mt-6 rounded-md bg-amber px-6 py-3 font-display text-sm font-extrabold uppercase tracking-[0.08em] text-ink">
                  Browse courses
                </button>
              </div>
            </Reveal>
          ) : (
            <div className="space-y-4">
              {enrollments.map((e, i) => {
                const c = getCourse(e.courseId);
                if (!c) return null;
                const Icon = COURSE_ICON[c.icon];
                const prog = progressOf(c.id);
                const lessons = courseLessons(c);
                const nextLesson = lessons.find((l, j) => !e.completed.includes(l.id) && (j === 0 || e.completed.includes(lessons[j - 1].id)));
                return (
                  <Reveal key={e.courseId} delay={i * 80}>
                    <button
                      onClick={() => go({ view: "course", courseId: c.id })}
                      className="card-lift group grid w-full items-center gap-5 rounded-lg border border-bone/12 bg-coal p-5 text-left hover:border-bone/25 sm:grid-cols-12 sm:p-6"
                    >
                      <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-md border bg-ink sm:col-span-1" style={{ borderColor: c.hue + "55", color: c.hue, width: 52, height: 52 }}>
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="sm:col-span-6">
                        <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-smoke">{c.code}</span>
                        <span className="mt-0.5 block font-display text-xl font-extrabold text-bone transition-colors group-hover:text-amber">{c.title}</span>
                        <span className="mt-1 block text-xs text-smoke">
                          {e.quizPassed ? "Quiz passed ✓ · " : ""}
                          {nextLesson ? `next: ${nextLesson.title}` : "all lessons complete"}
                        </span>
                      </span>
                      <span className="sm:col-span-4">
                        <span className="mb-1.5 flex justify-between font-mono text-[9.5px] uppercase tracking-[0.14em] text-smoke">
                          <span>{e.completed.length}/{lessons.length} lessons</span>
                          <span className="text-bone">{Math.round(prog * 100)}%</span>
                        </span>
                        <span className="block h-2 overflow-hidden rounded-full bg-ink">
                          <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${prog * 100}%`, background: c.hue }} />
                        </span>
                      </span>
                      <span className="hidden justify-end sm:col-span-1 sm:flex">
                        <IconArrowRight className="h-5 w-5 text-smoke transition-all group-hover:translate-x-1 group-hover:text-amber" />
                      </span>
                    </button>
                  </Reveal>
                );
              })}
            </div>
          )}

          {/* deadlines */}
          {deadlines.length > 0 && (
            <Reveal delay={120}>
              <div className="rounded-lg border border-bone/12 bg-coal p-6">
                <h2 className="flex items-center gap-2.5 font-display text-xl font-extrabold text-bone">
                  <IconClipboard className="h-5 w-5 text-ember" /> Assignments on your tail
                </h2>
                <div className="mt-4 divide-y divide-bone/8">
                  {deadlines.map((d) => (
                    <button key={d.lesson.id} onClick={() => go({ view: "course", courseId: d.course.id })} className="group flex w-full items-center justify-between gap-4 py-3.5 text-left">
                      <span>
                        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-smoke">{d.course.code}</span>
                        <span className="block text-sm font-semibold text-bone group-hover:text-amber">{d.lesson.title}</span>
                      </span>
                      <span className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] ${d.dueIn <= 2 ? "border-ember/50 text-ember" : "border-bone/15 text-smoke"}`}>
                        due {d.due.toLocaleDateString("en-NG", { weekday: "short" })} · {d.dueIn}d
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* certificates */}
          <Reveal delay={160}>
            <div className="rounded-lg border border-bone/12 bg-coal p-6">
              <h2 className="flex items-center gap-2.5 font-display text-xl font-extrabold text-bone">
                <IconSeal className="h-5 w-5 text-amber" /> Certificates
              </h2>
              {certs.length === 0 ? (
                <p className="mt-3 text-sm text-smoke">
                  Finish every lesson and pass the gate quiz in a course — the certificate mints itself from your record.
                </p>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {certs.map(({ c, id }) => (
                    <div key={id} className="rounded-md border-2 border-amber/60 bg-ink p-5">
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-amber">Tiger's Lair Academy</p>
                      <p className="mt-2 font-display text-lg font-extrabold text-bone">{user.name}</p>
                      <p className="text-xs text-smoke">{c!.title}</p>
                      <p className="mt-3 border-t border-dashed border-bone/15 pt-3 font-mono text-[11px] tracking-[0.08em] text-amber">{id}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        </div>

        {/* -------- right column -------- */}
        <div className="space-y-6 lg:col-span-4">
          {/* telegram card */}
          <Reveal delay={100}>
            <div className="rounded-lg border border-tgsky/25 bg-coal p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2.5 font-display text-lg font-extrabold text-bone">
                  <IconPlane className="h-5 w-5 text-tgsky" /> Telegram
                </h2>
                {user.telegramId ? (
                  <span className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-mint">
                    <span className="blink-dot h-1.5 w-1.5 rounded-full bg-mint" /> linked
                  </span>
                ) : (
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ember">not linked</span>
                )}
              </div>
              {user.telegramId ? (
                <>
                  <p className="mt-3 text-sm leading-relaxed text-smoke">
                    telegram_id <span className="font-mono text-bone">{user.telegramId}</span> — the bot knows you. Weekly drops and
                    reminders arrive in chat.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="flex-1 rounded-md bg-tgsky px-4 py-2.5 text-center font-display text-xs font-extrabold uppercase tracking-[0.08em] text-ink transition-transform hover:-translate-y-0.5">
                      Open bot
                    </a>
                    <button onClick={() => { unlinkTelegram(); }} className="rounded-md border border-bone/15 px-4 py-2.5 text-xs text-smoke transition-colors hover:border-alert hover:text-alert">
                      Unlink
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm leading-relaxed text-smoke">
                    Link your Telegram to get channel invites, lesson drops and reminders — the same student record, one code to prove it.
                  </p>
                  <button onClick={() => setTgOpen(true)} className="stripe-btn mt-4 w-full rounded-md bg-tgsky px-4 py-3 font-display text-xs font-extrabold uppercase tracking-[0.08em] text-ink transition-transform hover:-translate-y-0.5">
                    Link @TigersLairBot
                  </button>
                </>
              )}
            </div>
          </Reveal>

          {/* notification prefs */}
          <Reveal delay={160}>
            <div className="rounded-lg border border-bone/12 bg-coal p-6">
              <h2 className="flex items-center gap-2.5 font-display text-lg font-extrabold text-bone">
                <IconBell className="h-5 w-5 text-amber" /> Where we nudge you
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-smoke">The backend decides where each message goes — you decide the channels.</p>
              <div className="mt-4 space-y-2.5">
                <Toggle on={state.prefs.telegram} onChange={(v) => { setPref("telegram", v); toast(v ? "Telegram nudges on" : "Telegram nudges off"); }} label="Telegram" sub="lessons · reminders · community" hue="var(--color-tgsky)" />
                <Toggle on={state.prefs.whatsapp} onChange={(v) => { setPref("whatsapp", v); toast(v ? "WhatsApp confirmations on" : "WhatsApp confirmations off"); }} label="WhatsApp" sub="payments · critical alerts" hue="var(--color-wagreen)" />
                <Toggle on={state.prefs.email} onChange={(v) => { setPref("email", v); toast(v ? "Email receipts on" : "Email receipts off"); }} label="Email" sub="receipts · certificates" hue="var(--color-amber)" />
              </div>
            </div>
          </Reveal>

          {/* activity */}
          <Reveal delay={220}>
            <div className="rounded-lg border border-bone/12 bg-coal p-6">
              <h2 className="flex items-center gap-2.5 font-display text-lg font-extrabold text-bone">
                <IconBolt className="h-5 w-5 text-amber" /> Recent activity
              </h2>
              {state.activity.length === 0 ? (
                <p className="mt-3 text-sm text-smoke">Quiet so far. Your trail will show up here.</p>
              ) : (
                <ol className="mt-4 space-y-3.5">
                  {state.activity.slice(0, 7).map((a) => {
                    const Icon = KIND_ICON[a.kind];
                    return (
                      <li key={a.id} className="flex gap-3">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-bone/12 text-smoke">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span>
                          <span className="block text-xs leading-relaxed text-bone/90">{a.text}</span>
                          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-smoke/60">{timeAgo(a.at)}</span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </Reveal>

          {/* record card */}
          <Reveal delay={280}>
            <div className="rounded-lg border border-dashed border-bone/15 p-6">
              <p className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.2em] text-smoke">
                <IconCalendar className="h-4 w-4 text-amber" /> student record
              </p>
              <dl className="mt-3 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between gap-3"><dt className="text-smoke">name</dt><dd className="text-bone">{user.name}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-smoke">email</dt><dd className="truncate text-bone">{user.email}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-smoke">telegram_id</dt><dd className={user.telegramId ? "text-mint" : "text-ember"}>{user.telegramId ?? "null"}</dd></div>
                <div className="flex justify-between gap-3">
                  <dt className="text-smoke">created_at</dt>
                  <dd className="text-bone">{new Date(user.joinedAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short" })}</dd>
                </div>
              </dl>
              <p className="mt-4 border-t border-bone/8 pt-3 font-mono text-[9px] leading-relaxed tracking-[0.06em] text-smoke/60">
                SELECT * FROM students WHERE id = '{user.id}';
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
