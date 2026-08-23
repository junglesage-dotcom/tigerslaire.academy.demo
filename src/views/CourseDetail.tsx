import { useMemo, useRef, useState } from "react";
import { useStore } from "../lib/store";
import { getCourse, courseLessons, courseMinutes, fmtNaira } from "../data/courses";
import type { Course, Lesson } from "../data/courses";
import { Reveal, Ring, Kicker } from "../components/ui";
import {
  IconArrowRight,
  IconCheck,
  IconClipboard,
  IconClock,
  IconCopy,
  IconDoc,
  IconLock,
  IconMegaphone,
  IconPlane,
  IconPlay,
  IconSeal,
  IconTerminal,
} from "../components/Icons";

/* ---------------- fake lecture player ---------------- */
function FakePlayer({ lesson, hue }: { lesson: Lesson; hue: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="grid-lines relative flex aspect-video items-center justify-center overflow-hidden rounded-md border border-bone/12 bg-[#120c05]">
      {playing ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-10 items-end gap-1.5" aria-hidden>
            {[0.9, 0.5, 1.1, 0.7, 1.3].map((d, i) => (
              <span key={i} className="eq-bar h-9 w-1.5 rounded-sm" style={{ background: hue, animationDelay: `${i * 0.12}s`, animationDuration: `${d}s` }} />
            ))}
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-smoke">
            streaming from R2 · channel msg #{lesson.msg}
          </p>
          <button onClick={() => setPlaying(false)} className="font-mono text-[10px] uppercase tracking-[0.18em] text-smoke underline decoration-dotted underline-offset-4 hover:text-bone">
            pause lecture
          </button>
        </div>
      ) : (
        <button onClick={() => setPlaying(true)} className="group flex flex-col items-center gap-3" aria-label={`Play lecture: ${lesson.title}`}>
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 transition-transform group-hover:scale-110" style={{ borderColor: hue, color: hue }}>
            <IconPlay className="h-7 w-7 translate-x-0.5" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-smoke">
            {lesson.minutes} min lecture · preview
          </span>
        </button>
      )}
    </div>
  );
}

/* ---------------- quiz runner ---------------- */
function QuizRunner({ course }: { course: Course }) {
  const { submitQuiz, enrollmentFor } = useStore();
  const enr = enrollmentFor(course.id);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const allAnswered = course.quiz.every((_, i) => answers[i] !== undefined);

  const submit = () => {
    const s = course.quiz.reduce((a, q, i) => a + (answers[i] === q.answer ? 1 : 0), 0);
    setScore(s);
    setSubmitted(true);
    submitQuiz(course.id, s, course.quiz.length);
  };

  const passed = enr?.quizPassed ?? false;

  return (
    <div>
      {passed && (
        <div className="mb-5 flex items-center gap-3 rounded-md border border-mint/30 bg-mint/10 px-4 py-3">
          <IconSeal className="h-5 w-5 text-mint" />
          <p className="text-sm text-bone">
            Gate quiz passed — <span className="font-bold text-mint">{enr?.quizScore}/{enr?.quizTotal}</span>. Finish the remaining lessons to mint your certificate.
          </p>
        </div>
      )}
      <div className="space-y-6">
        {course.quiz.map((q, qi) => (
          <div key={qi} className="rounded-md border border-bone/12 bg-coal p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-smoke">
              Question {qi + 1} / {course.quiz.length}
            </p>
            <h4 className="mt-2 font-display text-lg font-bold text-bone">{q.q}</h4>
            <div className="mt-4 grid gap-2.5">
              {q.options.map((opt, oi) => {
                const chosen = answers[qi] === oi;
                const isCorrect = q.answer === oi;
                let cls = "border-bone/12 text-smoke hover:border-amber/60 hover:text-bone";
                if (submitted) {
                  if (isCorrect) cls = "border-mint/60 bg-mint/10 text-mint";
                  else if (chosen) cls = "border-alert/60 bg-alert/10 text-alert";
                  else cls = "border-bone/8 text-smoke/50";
                } else if (chosen) {
                  cls = "border-amber bg-amber/10 text-bone";
                }
                return (
                  <button
                    key={oi}
                    disabled={submitted}
                    onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                    className={`flex items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition-colors ${cls}`}
                  >
                    <span className="font-mono text-[10px] font-bold">{String.fromCharCode(65 + oi)}</span>
                    {opt}
                    {submitted && isCorrect && <IconCheck className="ml-auto h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!submitted ? (
        <button
          onClick={submit}
          disabled={!allAnswered}
          className={`mt-6 w-full rounded-md px-4 py-3.5 font-display text-sm font-extrabold uppercase tracking-[0.08em] transition-all ${
            allAnswered ? "stripe-btn bg-amber text-ink hover:-translate-y-0.5" : "cursor-not-allowed bg-soot text-smoke/60"
          }`}
        >
          {allAnswered ? "Submit answers" : `Answer all ${course.quiz.length} to submit`}
        </button>
      ) : (
        <div className={`mt-6 rounded-md border p-5 text-center ${score / course.quiz.length >= 0.7 ? "border-mint/40 bg-mint/10" : "border-alert/40 bg-alert/10"}`}>
          <p className="font-display text-3xl font-extrabold text-bone">
            {score}/{course.quiz.length}
          </p>
          <p className={`mt-1 font-mono text-[11px] uppercase tracking-[0.18em] ${score / course.quiz.length >= 0.7 ? "text-mint" : "text-alert"}`}>
            {score / course.quiz.length >= 0.7 ? "Passed — the gate is open" : "Below the 70% bar — review and retry"}
          </p>
          {score / course.quiz.length < 0.7 && (
            <button onClick={() => { setAnswers({}); setSubmitted(false); }} className="mt-4 rounded-md border border-bone/20 px-5 py-2.5 text-sm text-bone transition-colors hover:border-amber hover:text-amber">
              Retry the quiz
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- certificate ---------------- */
function CertificateCard({ course }: { course: Course }) {
  const { user, certificateId, toast } = useStore();
  const id = certificateId(course.id);
  if (!id || !user) return null;
  return (
    <div className="toast-in relative overflow-hidden rounded-lg border-2 border-amber/70 bg-coal p-6">
      <div className="pointer-events-none absolute -right-6 -top-6 opacity-10" aria-hidden>
        <IconSeal className="h-32 w-32 text-amber" />
      </div>
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-amber">
        <IconSeal className="h-4 w-4" /> Certificate issued
      </p>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-smoke">This certifies that</p>
      <p className="font-display text-2xl font-extrabold text-bone">{user.name}</p>
      <p className="mt-1 text-sm text-smoke">completed {course.title} · {course.weeks} weeks</p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-bone/15 pt-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-smoke">Verify with ID</p>
          <p className="font-mono text-sm font-bold tracking-[0.1em] text-amber">{id}</p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(id).catch(() => undefined);
            toast("Certificate ID copied");
          }}
          className="flex items-center gap-2 rounded border border-bone/15 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-smoke transition-colors hover:border-amber hover:text-amber"
        >
          <IconCopy className="h-3.5 w-3.5" /> Copy
        </button>
      </div>
    </div>
  );
}

/* ---------------- main view ---------------- */
export default function CourseDetail({ courseId }: { courseId: string }) {
  const course = getCourse(courseId);
  const { user, go, setAuthOpen, enroll, isEnrolled, enrollmentFor, completeLesson, progressOf, toast } = useStore();
  const lessons = useMemo(() => (course ? courseLessons(course) : []), [course]);
  const viewerRef = useRef<HTMLDivElement>(null);

  const enrolled = course ? isEnrolled(course.id) : false;
  const enr = course ? enrollmentFor(course.id) : undefined;
  const completed = enr?.completed ?? [];
  const progress = course ? progressOf(course.id) : 0;

  const [view, setView] = useState<{ kind: "lesson"; id: string } | { kind: "quiz" }>(() => {
    const firstOpen = lessons.find((l) => !completed.includes(l.id));
    return firstOpen ? { kind: "lesson", id: firstOpen.id } : { kind: "quiz" };
  });

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-32 text-center">
        <p className="font-display text-4xl font-extrabold text-bone">That course wandered off.</p>
        <button onClick={() => go({ view: "courses" })} className="mt-6 rounded-md bg-amber px-6 py-3 font-display text-sm font-extrabold uppercase tracking-[0.08em] text-ink">
          Back to the catalogue
        </button>
      </div>
    );
  }

  const idxOf = (id: string) => lessons.findIndex((l) => l.id === id);
  const isUnlocked = (i: number) => i === 0 || completed.includes(lessons[i - 1].id);
  const quizUnlocked = completed.length >= Math.ceil(lessons.length * 0.6);
  const currentId = lessons.find((l, i) => !completed.includes(l.id) && isUnlocked(i))?.id;

  const selectLesson = (id: string) => {
    setView({ kind: "lesson", id });
    requestAnimationFrame(() => viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const handleEnroll = () => {
    if (!user) {
      setAuthOpen(true);
      toast("Create a student record first — it takes ten seconds");
      return;
    }
    enroll(course.id);
  };

  const handleComplete = (lesson: Lesson) => {
    completeLesson(course.id, lesson.id);
    const i = idxOf(lesson.id);
    // j === i + 1 just became unlocked by this completion, even though local state is stale
    const nextUncompleted = lessons.find(
      (l, j) => j > i && !completed.includes(l.id) && (j === i + 1 || completed.includes(lessons[j - 1].id))
    );
    const anyRemaining = lessons.some((l, j) => j > i && !completed.includes(l.id));
    if (nextUncompleted) selectLesson(nextUncompleted.id);
    else if (!anyRemaining && quizUnlocked && !enr?.quizPassed) setView({ kind: "quiz" });
  };

  const selectedLesson = view.kind === "lesson" ? lessons.find((l) => l.id === view.id) : undefined;
  const selIdx = selectedLesson ? idxOf(selectedLesson.id) : -1;
  const selUnlocked = !enrolled ? selIdx === 0 : selIdx >= 0 && isUnlocked(selIdx);
  const selCompleted = selectedLesson ? completed.includes(selectedLesson.id) : false;
  const hours = Math.round(courseMinutes(course) / 60);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <button onClick={() => go({ view: "courses" })} className="group flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-smoke transition-colors hover:text-amber">
        <IconArrowRight className="h-3.5 w-3.5 rotate-180 transition-transform group-hover:-translate-x-1" />
        All courses
      </button>

      {/* header */}
      <div className="mt-8 flex flex-wrap items-end justify-between gap-8 border-b border-bone/10 pb-10">
        <div className="max-w-2xl">
          <Reveal>
            <Kicker>{course.code} · {course.path}</Kicker>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-[0.98] tracking-tight text-bone sm:text-6xl">{course.title}</h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 leading-relaxed text-smoke">{course.summary}</p>
          </Reveal>
          <Reveal delay={220}>
            <div className="mt-6 flex flex-wrap gap-2">
              {[`${course.weeks} weeks`, `${lessons.length} lessons`, `${hours}h material`, course.level, "certificate included"].map((chip) => (
                <span key={chip} className="rounded-full border border-bone/12 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-smoke">
                  {chip}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
        <Reveal delay={200}>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-smoke">Course fee</p>
            <p className="font-display text-5xl font-extrabold text-amber">{fmtNaira(course.price)}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-smoke/70">one-time · lifetime access</p>
          </div>
        </Reveal>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        {/* ---- syllabus ---- */}
        <div className="lg:col-span-5">
          <h2 className="font-display text-xl font-extrabold text-bone">The trail</h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-smoke/70">
            {enrolled ? `${completed.length}/${lessons.length} lessons complete` : "lesson 01 is free to preview"}
          </p>

          <div className="mt-5 space-y-7">
            {course.modules.map((m, mi) => (
              <div key={m.title}>
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: course.hue }}>
                  Module {String(mi + 1).padStart(2, "0")} — {m.title}
                </p>
                <div className="overflow-hidden rounded-md border border-bone/12">
                  {m.lessons.map((l) => {
                    const i = idxOf(l.id);
                    const unlocked = enrolled ? isUnlocked(i) : i === 0;
                    const done = completed.includes(l.id);
                    const active = view.kind === "lesson" && view.id === l.id;
                    const isCurrent = enrolled && !done && l.id === currentId;
                    return (
                      <button
                        key={l.id}
                        onClick={() => unlocked && selectLesson(l.id)}
                        disabled={!unlocked}
                        className={`lesson-row flex w-full items-center gap-3 border-b border-bone/8 px-4 py-3.5 text-left last:border-b-0 ${
                          active ? "bg-soot" : unlocked ? "bg-coal hover:bg-soot/70" : "cursor-not-allowed bg-coal/50 opacity-60"
                        } ${isCurrent ? "border-l-2 border-l-amber" : ""}`}
                        style={{ borderLeftWidth: isCurrent ? 2 : undefined }}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                            done ? "border-mint/50 bg-mint/15 text-mint" : unlocked ? "border-bone/20 text-bone" : "border-bone/10 text-smoke/50"
                          }`}
                        >
                          {done ? <IconCheck className="h-3.5 w-3.5" /> : unlocked ? (
                            <span className="font-mono text-[10px] font-bold">{String(i + 1).padStart(2, "0")}</span>
                          ) : (
                            <IconLock className="h-3 w-3" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-sm font-semibold ${done ? "text-smoke line-through decoration-mint/50" : "text-bone"}`}>
                            {l.title}
                          </span>
                          <span className="mt-0.5 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.1em] text-smoke/70">
                            <IconClock className="h-3 w-3" /> {l.minutes} min
                            {l.tags.slice(0, 3).map((t) => (
                              <span key={t} className="rounded-sm border border-bone/10 px-1.5 py-px">{t}</span>
                            ))}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-[9.5px] tracking-[0.06em] text-tgsky/80">#{l.msg}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* quiz gate */}
            <button
              onClick={() => enrolled && quizUnlocked && setView({ kind: "quiz" })}
              disabled={!enrolled || !quizUnlocked}
              className={`flex w-full items-center gap-4 rounded-md border p-4 text-left transition-colors ${
                view.kind === "quiz" ? "border-amber bg-amber/10" : enrolled && quizUnlocked ? "border-amber/40 bg-coal hover:bg-soot" : "cursor-not-allowed border-bone/10 bg-coal/50 opacity-60"
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber/50 text-amber">
                <IconSeal className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-display text-base font-extrabold text-bone">Gate quiz — {course.quiz.length} questions</span>
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-smoke">
                  {enr?.quizPassed ? `passed · ${enr.quizScore}/${enr.quizTotal}` : quizUnlocked ? "pass ≥ 70% to finish the course" : `unlocks at ${Math.ceil(lessons.length * 0.6)} lessons complete`}
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* ---- viewer / aside ---- */}
        <div className="lg:col-span-7">
          <div ref={viewerRef} className="space-y-6 scroll-mt-28 lg:sticky lg:top-28">
            {!enrolled && (
              <div className="rounded-lg border border-bone/12 bg-coal p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-lg font-extrabold text-bone">Enrol to walk the full trail</p>
                    <p className="mt-1 text-sm text-smoke">
                      {lessons.length} lessons, weekly channel drops, graded assignments, gate quiz and a verifiable certificate.
                    </p>
                  </div>
                  <button onClick={handleEnroll} className="stripe-btn rounded-md bg-amber px-6 py-3.5 font-display text-sm font-extrabold uppercase tracking-[0.08em] text-ink transition-transform hover:-translate-y-0.5">
                    Enrol · {fmtNaira(course.price)}
                  </button>
                </div>
              </div>
            )}

            {enrolled && (
              <div className="flex flex-wrap items-center gap-6 rounded-lg border border-bone/12 bg-coal p-6">
                <Ring value={progress} size={84} stroke={8} color={course.hue} track="rgba(23,16,7,0.5)">
                  <span className="font-mono text-sm font-extrabold text-bone">{Math.round(progress * 100)}%</span>
                </Ring>
                <div className="min-w-[180px] flex-1">
                  <p className="font-display text-lg font-extrabold text-bone">Your progress, {user?.name.split(" ")[0]}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-smoke">
                    {completed.length}/{lessons.length} lessons · quiz {enr?.quizPassed ? "passed ✓" : "pending"}
                  </p>
                  <a
                    href={`https://${course.channel}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded border border-tgsky/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-tgsky transition-colors hover:bg-tgsky/10"
                  >
                    <IconPlane className="h-3.5 w-3.5" /> {course.channel}
                  </a>
                </div>
              </div>
            )}

            {/* viewer body */}
            {view.kind === "quiz" ? (
              <div className="rounded-lg border border-bone/12 bg-ink p-6 sm:p-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber">Final gate</p>
                <h2 className="mt-2 font-display text-3xl font-extrabold text-bone">Prove it. Politely.</h2>
                <p className="mt-3 text-sm leading-relaxed text-smoke">
                  Four-ish questions drawn from the whole course. Score 70% or better and the certificate comes within reach.
                </p>
                <div className="mt-6">
                  <QuizRunner course={course} />
                </div>
              </div>
            ) : selectedLesson ? (
              <div className="overflow-hidden rounded-lg border border-bone/12 bg-ink">
                <div className="border-b border-bone/10 bg-coal px-6 py-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: course.hue }}>
                    Lesson {String(selIdx + 1).padStart(2, "0")} · {selectedLesson.minutes} min · msg #{selectedLesson.msg}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-extrabold text-bone sm:text-3xl">{selectedLesson.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedLesson.tags.map((t) => (
                      <span key={t} className="rounded-full border border-bone/12 px-3 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-smoke">{t}</span>
                    ))}
                  </div>
                </div>

                {!selUnlocked ? (
                  <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
                    <IconLock className="h-8 w-8 text-smoke" />
                    <p className="font-display text-xl font-extrabold text-bone">This part of the trail is locked</p>
                    <p className="max-w-sm text-sm text-smoke">{enrolled ? "Complete the previous lesson to keep moving." : "Enrol to unlock every lesson — the first one is free to preview."}</p>
                  </div>
                ) : (
                  <div className="space-y-6 p-6">
                    <div>
                      <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-smoke">You'll nail down</h3>
                      <ul className="mt-3 space-y-2.5">
                        {selectedLesson.bullets.map((b) => (
                          <li key={b} className="flex gap-3 text-sm leading-relaxed text-bone/90">
                            <IconCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: course.hue }} />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {selectedLesson.tags.includes("Video") && <FakePlayer lesson={selectedLesson} hue={course.hue} />}

                    <div className="grid gap-3 sm:grid-cols-2">
                      {selectedLesson.tags.includes("PDF") && (
                        <div className="card-lift flex items-center gap-4 rounded-md border border-bone/12 bg-coal p-4">
                          <IconDoc className="h-8 w-8 text-ember" />
                          <div>
                            <p className="text-sm font-bold text-bone">Lesson notes — PDF</p>
                            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-smoke">{2 + (selectedLesson.msg % 5)}.{(selectedLesson.msg * 3) % 10} MB · in channel files</p>
                          </div>
                        </div>
                      )}
                      {selectedLesson.tags.includes("Assignment") && (
                        <div className="card-lift flex items-center gap-4 rounded-md border border-bone/12 bg-coal p-4">
                          <IconClipboard className="h-8 w-8 text-mint" />
                          <div>
                            <p className="text-sm font-bold text-bone">Graded assignment</p>
                            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-smoke">submit via bot · /submit {selectedLesson.id}</p>
                          </div>
                        </div>
                      )}
                      {selectedLesson.tags.includes("Code") && (
                        <div className="card-lift flex items-center gap-4 rounded-md border border-bone/12 bg-coal p-4">
                          <IconTerminal className="h-8 w-8 text-tgsky" />
                          <div>
                            <p className="text-sm font-bold text-bone">Starter code</p>
                            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-smoke">git clone lair/{selectedLesson.id}</p>
                          </div>
                        </div>
                      )}
                      {selectedLesson.tags.includes("Reading") && (
                        <div className="card-lift flex items-center gap-4 rounded-md border border-bone/12 bg-coal p-4">
                          <IconDoc className="h-8 w-8 text-amber" />
                          <div>
                            <p className="text-sm font-bold text-bone">Required reading</p>
                            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-smoke">pinned post · msg #{selectedLesson.msg + 1}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 rounded-md border border-tgsky/25 bg-tgsky/[0.07] px-4 py-3">
                      <IconMegaphone className="h-5 w-5 shrink-0 text-tgsky" />
                      <p className="text-xs leading-relaxed text-smoke">
                        Delivered in <span className="font-mono text-tgsky">{course.channel}</span> as message{" "}
                        <span className="font-mono text-bone">#{selectedLesson.msg}</span> — the website tracks it, Telegram carries it.
                      </p>
                    </div>

                    {enrolled && (
                      selCompleted ? (
                        <div className="flex items-center justify-center gap-3 rounded-md border border-mint/40 bg-mint/10 py-3.5">
                          <IconCheck className="h-5 w-5 text-mint" />
                          <p className="font-display text-sm font-extrabold uppercase tracking-[0.1em] text-mint">Lesson complete</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleComplete(selectedLesson)}
                          className="stripe-btn w-full rounded-md py-4 font-display text-sm font-extrabold uppercase tracking-[0.08em] text-ink transition-transform hover:-translate-y-0.5"
                          style={{ background: course.hue }}
                        >
                          Mark lesson complete
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {enrolled && <CertificateCard course={course} />}

            {/* outcomes */}
            <div className="rounded-lg border border-bone/12 bg-coal p-6">
              <h3 className="font-display text-lg font-extrabold text-bone">By the last week you'll have</h3>
              <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {course.outcomes.map((o) => (
                  <li key={o} className="flex gap-3 text-sm leading-relaxed text-smoke">
                    <IconArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
