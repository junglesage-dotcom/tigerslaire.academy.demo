import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { COURSES, courseLessons, getCourse } from "../data/courses";

/* ---------------- types ---------------- */

export interface User {
  id: string;
  name: string;
  email: string;
  telegramId: string | null;
  joinedAt: number;
}

export interface Enrollment {
  courseId: string;
  enrolledAt: number;
  completed: string[];
  quizScore: number | null;
  quizTotal: number | null;
  quizPassed: boolean;
}

export interface Prefs {
  telegram: boolean;
  whatsapp: boolean;
  email: boolean;
}

export interface Activity {
  id: string;
  at: number;
  text: string;
  kind: "enroll" | "lesson" | "quiz" | "cert" | "telegram" | "system";
}

interface AppState {
  user: User | null;
  enrollments: Enrollment[];
  prefs: Prefs;
  activity: Activity[];
}

export type Route =
  | { view: "home" }
  | { view: "courses" }
  | { view: "course"; courseId: string }
  | { view: "dashboard" };

export interface Toast {
  id: string;
  text: string;
}

interface StoreCtx {
  state: AppState;
  user: User | null;
  route: Route;
  go: (r: Route) => void;
  authOpen: boolean;
  setAuthOpen: (v: boolean) => void;
  tgOpen: boolean;
  setTgOpen: (v: boolean) => void;
  toasts: Toast[];
  toast: (text: string) => void;
  register: (name: string, email: string) => void;
  login: (name: string, email: string) => void;
  loginDemo: () => void;
  logout: () => void;
  enroll: (courseId: string) => void;
  isEnrolled: (courseId: string) => boolean;
  enrollmentFor: (courseId: string) => Enrollment | undefined;
  completeLesson: (courseId: string, lessonId: string) => void;
  submitQuiz: (courseId: string, score: number, total: number) => boolean;
  progressOf: (courseId: string) => number;
  linkTelegram: () => string;
  unlinkTelegram: () => void;
  setPref: (k: keyof Prefs, v: boolean) => void;
  certificateId: (courseId: string) => string | null;
}

/* ---------------- helpers ---------------- */

const uid = () => Math.random().toString(36).slice(2, 10);
const LS_KEY = "tigerslair.state.v1";

const defaultState: AppState = {
  user: null,
  enrollments: [],
  prefs: { telegram: true, whatsapp: true, email: false },
  activity: [],
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as AppState;
    return { ...defaultState, ...parsed, prefs: { ...defaultState.prefs, ...parsed.prefs } };
  } catch {
    return defaultState;
  }
}

function seedDemo(): AppState {
  const now = Date.now();
  const day = 86400000;
  const py = getCourse("py101")!;
  const ba = getCourse("ba202")!;
  const pyLessons = courseLessons(py);
  return {
    user: {
      id: "st_demo214",
      name: "Ada Eze",
      email: "ada@example.com",
      telegramId: "784512390",
      joinedAt: now - 19 * day,
    },
    enrollments: [
      {
        courseId: "py101",
        enrolledAt: now - 18 * day,
        completed: pyLessons.slice(0, 5).map((l) => l.id),
        quizScore: null,
        quizTotal: null,
        quizPassed: false,
      },
      {
        courseId: "ba202",
        enrolledAt: now - 6 * day,
        completed: courseLessons(ba).slice(0, 2).map((l) => l.id),
        quizScore: null,
        quizTotal: null,
        quizPassed: false,
      },
    ],
    prefs: { telegram: true, whatsapp: true, email: false },
    activity: [
      { id: uid(), at: now - 2 * day, text: "Completed lesson “Files, CSVs & encodings” in PY101", kind: "lesson" },
      { id: uid(), at: now - 4 * day, text: "Bot delivered Week 3 materials to @ada_eze", kind: "telegram" },
      { id: uid(), at: now - 6 * day, text: "Enrolled in BA202 — Business Analysis Essentials", kind: "enroll" },
      { id: uid(), at: now - 18 * day, text: "Enrolled in PY101 — Python for Data Analysis", kind: "enroll" },
      { id: uid(), at: now - 19 * day, text: "Telegram account linked to the Lair", kind: "telegram" },
    ],
  };
}

/* ---------------- context ---------------- */

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const [route, setRoute] = useState<Route>({ view: "home" });
  const [authOpen, setAuthOpen] = useState(false);
  const [tgOpen, setTgOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — session-only mode */
    }
  }, [state]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const toast = useCallback((text: string) => {
    const id = uid();
    setToasts((t) => [...t.slice(-2), { id, text }]);
    timers.current.push(window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200));
  }, []);

  const go = useCallback((r: Route) => {
    setRoute(r);
    window.scrollTo(0, 0);
  }, []);

  const log = useCallback((text: string, kind: Activity["kind"]) => {
    setState((s) => ({
      ...s,
      activity: [{ id: uid(), at: Date.now(), text, kind }, ...s.activity].slice(0, 40),
    }));
  }, []);

  /* ----- auth ----- */

  const register = useCallback(
    (name: string, email: string) => {
      setState((s) => ({
        ...s,
        user: { id: "st_" + uid(), name, email, telegramId: null, joinedAt: Date.now() },
      }));
      toast(`Welcome to the Lair, ${name.split(" ")[0]}`);
      log("Account created on the academy site", "system");
    },
    [toast, log]
  );

  const login = useCallback(
    (name: string, email: string) => {
      setState((s) => ({
        ...s,
        user: s.user ?? { id: "st_" + uid(), name, email, telegramId: null, joinedAt: Date.now() },
      }));
      toast(`Signed in as ${name.split(" ")[0]}`);
    },
    [toast]
  );

  const loginDemo = useCallback(() => {
    setState(seedDemo());
    toast("Demo student loaded — meet Ada");
  }, [toast]);

  const logout = useCallback(() => {
    setState((s) => ({ ...s, user: null }));
    toast("Signed out — progress stays safe in your browser");
  }, [toast]);

  /* ----- learning ----- */

  const enroll = useCallback(
    (courseId: string) => {
      const c = getCourse(courseId);
      if (!c) return;
      setState((s) => {
        if (!s.user) return s;
        if (s.enrollments.some((e) => e.courseId === courseId)) return s;
        return {
          ...s,
          enrollments: [
            ...s.enrollments,
            { courseId, enrolledAt: Date.now(), completed: [], quizScore: null, quizTotal: null, quizPassed: false },
          ],
        };
      });
      toast(`Enrolled in ${c.code} — channel invite sent to the bot`);
      log(`Enrolled in ${c.code} — ${c.title}`, "enroll");
    },
    [toast, log]
  );

  const enrollmentFor = useCallback(
    (courseId: string) => state.enrollments.find((e) => e.courseId === courseId),
    [state.enrollments]
  );

  const isEnrolled = useCallback(
    (courseId: string) => state.enrollments.some((e) => e.courseId === courseId),
    [state.enrollments]
  );

  const progressOf = useCallback(
    (courseId: string) => {
      const e = state.enrollments.find((x) => x.courseId === courseId);
      const c = getCourse(courseId);
      if (!e || !c) return 0;
      const total = courseLessons(c).length + 1;
      const done = e.completed.length + (e.quizPassed ? 1 : 0);
      return Math.min(1, done / total);
    },
    [state.enrollments]
  );

  const completeLesson = useCallback(
    (courseId: string, lessonId: string) => {
      const c = getCourse(courseId);
      setState((s) => ({
        ...s,
        enrollments: s.enrollments.map((e) =>
          e.courseId === courseId && !e.completed.includes(lessonId)
            ? { ...e, completed: [...e.completed, lessonId] }
            : e
        ),
      }));
      if (c) {
        const lesson = courseLessons(c).find((l) => l.id === lessonId);
        if (lesson) {
          toast(`“${lesson.title}” marked complete`);
          log(`Completed lesson “${lesson.title}” in ${c.code}`, "lesson");
        }
      }
    },
    [toast, log]
  );

  const submitQuiz = useCallback(
    (courseId: string, score: number, total: number) => {
      const passed = score / total >= 0.7;
      const c = getCourse(courseId);
      setState((s) => ({
        ...s,
        enrollments: s.enrollments.map((e) =>
          e.courseId === courseId ? { ...e, quizScore: score, quizTotal: total, quizPassed: e.quizPassed || passed } : e
        ),
      }));
      if (c) {
        if (passed) {
          toast(`Quiz passed — ${score}/${total}. One step from the certificate`);
          log(`Passed the ${c.code} gate quiz (${score}/${total})`, "quiz");
        } else {
          toast(`${score}/${total} — you need 70% to pass. Review and retry`);
          log(`Retaking the ${c.code} gate quiz (scored ${score}/${total})`, "quiz");
        }
      }
      return passed;
    },
    [toast, log]
  );

  /* ----- telegram & prefs ----- */

  const linkTelegram = useCallback(() => {
    const tgId = "78" + String(Math.floor(1000000 + Math.random() * 8999999));
    setState((s) => (s.user ? { ...s, user: { ...s.user, telegramId: tgId } } : s));
    toast("Telegram linked — the bot now knows you");
    log("Telegram account linked via @TigersLairBot", "telegram");
    return tgId;
  }, [toast, log]);

  const unlinkTelegram = useCallback(() => {
    setState((s) => (s.user ? { ...s, user: { ...s.user, telegramId: null } } : s));
    toast("Telegram unlinked");
    log("Telegram account unlinked", "telegram");
  }, [toast, log]);

  const setPref = useCallback((k: keyof Prefs, v: boolean) => {
    setState((s) => ({ ...s, prefs: { ...s.prefs, [k]: v } }));
  }, []);

  const certificateId = useCallback(
    (courseId: string) => {
      const e = state.enrollments.find((x) => x.courseId === courseId);
      const c = getCourse(courseId);
      if (!e || !c || !state.user) return null;
      if (e.quizPassed && e.completed.length >= courseLessons(c).length) {
        const serial = (state.user.id + courseId).split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
        return `TL-${c.code}-${String(serial * 7).slice(-6)}`;
      }
      return null;
    },
    [state.enrollments, state.user]
  );

  const value: StoreCtx = {
    state,
    user: state.user,
    route,
    go,
    authOpen,
    setAuthOpen,
    tgOpen,
    setTgOpen,
    toasts,
    toast,
    register,
    login,
    loginDemo,
    logout,
    enroll,
    isEnrolled,
    enrollmentFor,
    completeLesson,
    submitQuiz,
    progressOf,
    linkTelegram,
    unlinkTelegram,
    setPref,
    certificateId,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export { COURSES };
