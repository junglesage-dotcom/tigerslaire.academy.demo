import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, clearSession } from "./api";

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
  | { view: "course-editor"; courseId: string }
  | { view: "verify"; certId?: string }
  | { view: "legal"; type: string };

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
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  enroll: (courseId: string) => Promise<void>;
  isEnrolled: (courseId: string) => boolean;
  completeLesson: (courseId: string, lessonId: string) => Promise<any>;
  submitQuiz: (courseId: string, score: number, total: number) => Promise<any>;
  linkTelegram: (initData?: string) => Promise<void>;
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

  // ✅ UPDATED: Rely entirely on HttpOnly cookies for session validation
  useEffect(() => {
    api.getMe()
      .then((res) => {
        setUser(res.data);
        fetchEnrollments();
      })
      .catch(() => {
        // If getMe fails, the session is invalid or missing. Clear cookies just in case.
        clearSession();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const fetchEnrollments = async () => {
    try {
      const res = await api.getEnrollments();
      setEnrollments(res.data);
    } catch (e) { 
      // Silently ignore enrollment fetch errors on initial load
    }
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

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const res = await api.register(name, email, password);
      setUser(res.data);
      toast("Welcome to the Lair, " + name.split(" ")[0]);
      setAuthOpen(false);
      fetchEnrollments();
    } catch (e: any) {
      toast(e.message || "Registration failed");
    }
  }, [toast]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.login(email, password);
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
      setUser(res.data);
      toast("Demo student loaded — meet Ada");
      setAuthOpen(false);
      fetchEnrollments();
    } catch (e: any) {
      toast(e.message || "Failed to load demo");
    }
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore logout errors (e.g., network drop), we still want to clear local state
    } finally {
      clearSession();
      setUser(null);
      setEnrollments([]);
      toast("Signed out");
      go({ view: "home" });
    }
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

  // ✅ UPDATED: Return the API response so components can access `res.awarded`
  const completeLesson = useCallback(async (courseId: string, lessonId: string) => {
    try {
      const res = await api.completeLesson(courseId, lessonId);
      toast("Lesson marked complete");
      return res;
    } catch (e: any) {
      toast(e.message || "Failed to complete lesson");
      throw e;
    }
  }, [toast]);

  // ✅ UPDATED: Return the API response so components can access `res.awarded`
  const submitQuiz = useCallback(async (courseId: string, score: number, total: number) => {
    try {
      const res = await api.submitQuiz(courseId, score, total);
      if (res.passed) {
        toast("Quiz passed — " + score + "/" + total + ". One step from the certificate");
      } else {
        toast(score + "/" + total + " — you need 70% to pass. Review and retry");
      }
      return res;
    } catch (e: any) {
      toast(e.message || "Failed to submit quiz");
      throw e;
    }
  }, [toast]);

  const linkTelegram = useCallback(async (initData?: string) => {
    try {
      let res;
      if (initData) {
        res = await api.linkTelegramMiniApp(initData);
        toast("Telegram linked securely via Mini App!");
      } else {
        res = await api.linkTelegram();
        toast("Telegram linked!");
      }
      
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