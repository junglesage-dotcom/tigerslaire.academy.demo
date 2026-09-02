import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, clearToken } from "./api";

/* ---------------- types ---------------- */
export interface User {
  id: string;
  name: string;
  email: string;
  telegram_id: string | null;
  role: string;
  joined_at: number;
}

export interface Enrollment {
  course_id: string;
  enrolled_at: number;
  quiz_passed: number;
}

export interface Activity {
  id: string;
  at: number;
  text: string;
  kind: string;
}

export type Route =
  | { view: "home" }
  | { view: "courses" }
  | { view: "course"; courseId: string }
  | { view: "dashboard" }
  | { view: "mentorshop" }
  | { view: "mentorship-apply"; categoryId?: string }
  | { view: "mentorship-dashboard" }
  | { view: "counseling" }
  | { view: "meetups" }
  | { view: "admin" }
  | { view: "course-editor"; courseId: string };

export interface Toast {
  id: string;
  text: string;
}

interface StoreCtx {
  user: User | null;
  route: Route;
  go: (r: Route) => void;
  authOpen: boolean;
  setAuthOpen: (v: boolean) => void;
  toasts: Toast[];
  toast: (text: string) => void;
  register: (name: string, email: string) => Promise<void>;
  login: (email: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => void;
  enroll: (courseId: string) => Promise<void>;
  isEnrolled: (courseId: string) => boolean;
  completeLesson: (courseId: string, lessonId: string) => Promise<void>;
  submitQuiz: (courseId: string, score: number, total: number) => Promise<boolean>;
  linkTelegram: () => Promise<void>;
  unlinkTelegram: () => Promise<void>;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [route, setRoute] = useState<Route>({ view: "home" });
  const [authOpen, setAuthOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("tigerslair.token");
    if (token) {
      api.getMe().then(res => {
        setUser(res.data);
        fetchEnrollments();
      }).catch(() => {
        clearToken();
      }).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchEnrollments = async () => {
    try {
      const res = await api.getEnrollments();
      setEnrollments(res.data);
    } catch (e) { /* ignore */ }
  };

  const toast = useCallback((text: string) => {
    const id = Math.random().toString(36).slice(2, 10);
    setToasts((t) => [...t.slice(-2), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const go = useCallback((r: Route) => {
    setRoute(r);
    window.scrollTo(0, 0);
  }, []);

  const register = useCallback(async (name: string, email: string) => {
    try {
      const res = await api.register(name, email);
      setUser(res.data);
      toast("Welcome to the Lair, " + name.split(" ")[0]);
      setAuthOpen(false);
    } catch (e: any) {
      toast(e.message || "Registration failed");
    }
  }, [toast]);

  const login = useCallback(async (email: string) => {
    try {
      const res = await api.login(email);
      setUser(res.data);
      toast("Signed in as " + res.data.name.split(" ")[0]);
      setAuthOpen(false);
      fetchEnrollments();
    } catch (e: any) {
      toast(e.message || "Login failed");
    }
  }, [toast]);

  const loginDemo = useCallback(async () => {
    try {
      const res = await api.loginDemo();
      // Ensure token is saved
      if (res.token) {
        localStorage.setItem("tigerslair.token", res.token);
      }
      setUser(res.data);
      toast("Demo student loaded — meet Ada");
      setAuthOpen(false);
      fetchEnrollments();
    } catch (e: any) {
      toast(e.message || "Failed to load demo");
    }
  }, [toast]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setEnrollments([]);
    toast("Signed out — progress stays safe in your browser");
    go({ view: "home" });
  }, [toast, go]);

  const enroll = useCallback(async (courseId: string) => {
    try {
      await api.enroll(courseId);
      toast("Enrolled successfully");
      fetchEnrollments();
    } catch (e: any) {
      toast(e.message || "Enrollment failed");
    }
  }, [toast]);

  const isEnrolled = useCallback((courseId: string) => {
    return enrollments.some((e) => e.course_id === courseId);
  }, [enrollments]);

  const completeLesson = useCallback(async (courseId: string, lessonId: string) => {
    try {
      await api.completeLesson(courseId, lessonId);
      toast("Lesson marked complete");
    } catch (e: any) {
      toast(e.message || "Failed to complete lesson");
    }
  }, [toast]);

  const submitQuiz = useCallback(async (courseId: string, score: number, total: number) => {
    try {
      const res = await api.submitQuiz(courseId, score, total);
      if (res.passed) {
        toast("Quiz passed — " + score + "/" + total + ". One step from the certificate");
      } else {
        toast(score + "/" + total + " — you need 70% to pass. Review and retry");
      }
      return res.passed;
    } catch (e: any) {
      toast(e.message || "Failed to submit quiz");
      return false;
    }
  }, [toast]);

  const linkTelegram = useCallback(async () => {
    try {
      const res = await api.linkTelegram();
      toast("Telegram linked — the bot now knows you");
      if (user) {
        setUser({ ...user, telegram_id: res.telegramId });
      }
    } catch (e: any) {
      toast(e.message || "Failed to link Telegram");
    }
  }, [toast, user]);

  const unlinkTelegram = useCallback(async () => {
    try {
      await api.unlinkTelegram();
      toast("Telegram unlinked");
      if (user) {
        setUser({ ...user, telegram_id: null });
      }
    } catch (e: any) {
      toast(e.message || "Failed to unlink Telegram");
    }
  }, [toast, user]);

  const value: StoreCtx = {
    user,
    route,
    go,
    authOpen,
    setAuthOpen,
    toasts,
    toast,
    register,
    login,
    loginDemo,
    logout,
    enroll,
    isEnrolled,
    completeLesson,
    submitQuiz,
    linkTelegram,
    unlinkTelegram,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}