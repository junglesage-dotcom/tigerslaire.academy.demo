import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./lib/store";
import Home from "./views/Home";
import Catalog from "./views/Catalog";
import CourseDetail from "./views/CourseDetail";
import Dashboard from "./views/Dashboard";
import Mentorshop from "./views/Mentorshop";
import MentorshipApply from "./views/MentorshipApply";
import MentorshipDashboard from "./views/MentorshipDashboard";
import CounselingBook from "./views/CounselingBook";
import Meetups from "./views/Meetups";
import AdminPanel from "./views/AdminPanel";
import CourseEditor from "./views/CourseEditor";
import LegalPage from "./views/LegalPage";
import VerifyCertificate from "./views/VerifyCertificate";
import { AuthModal } from "./components/Modals";
import { IconClaw, IconMenu, IconX, IconPlane } from "./components/Icons";
import CookieConsent from "./components/CookieConsent";

// ============================================
// STATUS STRIP
// ============================================
function StatusStrip() {
  const [secs, setSecs] = useState(86414);
  useEffect(() => {
    const id = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return (
    <div className="border-b border-bone/10 bg-[#120c05]">
      <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-hidden px-5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-smoke sm:px-8">
        <span className="shrink-0 text-amber">lair-edge v2.0</span>
        <span className="hidden items-center gap-1.5 sm:flex">
          <span className="blink-dot h-1.5 w-1.5 rounded-full bg-mint" /> fra1 · online
        </span>
        <span className="ml-auto shrink-0 text-smoke/70">uptime {h}:{m}:{s}</span>
      </div>
    </div>
  );
}

// ============================================
// NAVIGATION
// ============================================
function Nav() {
  const { route, go, user, setAuthOpen, logout } = useStore();
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Overview", active: route.view === "home", go: () => go({ view: "home" }) },
    { label: "Courses", active: route.view === "courses" || route.view === "course", go: () => go({ view: "courses" }) },
    { label: "Mentorshop", active: route.view === "mentorshop" || route.view === "mentorship-apply" || route.view === "mentorship-dashboard", go: () => go({ view: "mentorshop" }) },
    { label: "Dashboard", active: route.view === "dashboard" || route.view === "mentorship-dashboard", go: () => go({ view: "dashboard" }) },
  ];

  if (user?.role === 'admin') {
    links.push({ label: "Admin", active: route.view === "admin", go: () => go({ view: "admin" }) });
  }

  const nav = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-[70] border-b border-bone/10 bg-ink/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <button onClick={nav(() => go({ view: "home" }))} className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-amber text-ink transition-transform group-hover:rotate-6">
            <IconClaw className="h-6 w-6" />
          </span>
          <span className="text-left leading-none">
            <span className="block font-display text-base font-extrabold tracking-tight text-bone">TIGER'S LAIR</span>
            <span className="mt-1 block font-mono text-[8.5px] uppercase tracking-[0.3em] text-smoke">academy · est. Benin City</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={nav(l.go)}
              className={`relative rounded px-4 py-2 font-display text-sm font-bold transition-colors ${
                l.active ? "text-amber" : "text-smoke hover:text-bone"
              }`}
            >
              {l.label}
              {l.active && <span className="absolute inset-x-4 -bottom-[15px] h-0.5 bg-amber" />}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <button
                onClick={nav(() => go({ view: "dashboard" }))}
                className="flex items-center gap-2.5 rounded-md border border-bone/15 py-1.5 pl-1.5 pr-4 transition-colors hover:border-amber"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded bg-amber font-display text-xs font-extrabold text-ink">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-sm font-semibold text-bone">{user.name.split(" ")[0]}</span>
              </button>
              <button onClick={logout} className="font-mono text-[10px] uppercase tracking-[0.16em] text-smoke transition-colors hover:text-alert">
                exit
              </button>
            </>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="stripe-btn rounded-md bg-amber px-5 py-2.5 font-display text-xs font-extrabold uppercase tracking-[0.1em] text-ink transition-transform hover:-translate-y-0.5"
            >
              Sign in
            </button>
          )}
        </div>

        <button className="text-bone md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <IconX className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="toast-in border-t border-bone/10 bg-coal px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <button
                key={l.label}
                onClick={nav(l.go)}
                className={`rounded px-4 py-3 text-left font-display text-base font-bold ${l.active ? "bg-amber/10 text-amber" : "text-bone"}`}
              >
                {l.label}
              </button>
            ))}
            <div className="mt-3 border-t border-bone/10 pt-3">
              {user ? (
                <div className="flex items-center justify-between px-4">
                  <span className="text-sm text-smoke">{user.name}</span>
                  <button onClick={() => { logout(); setOpen(false); }} className="font-mono text-[10px] uppercase tracking-[0.16em] text-alert">
                    exit
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setAuthOpen(true); setOpen(false); }}
                  className="w-full rounded-md bg-amber px-4 py-3 font-display text-sm font-extrabold uppercase tracking-[0.1em] text-ink"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ============================================
// FOOTER (WITH LEGAL PAGE & VERIFY ROUTING)
// ============================================
function Footer() {
  const { go } = useStore();

  return (
    <footer className="border-t border-bone/10 bg-[#120c05]">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-12">
        {/* Brand & Location */}
        <div className="lg:col-span-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-amber text-ink">
              <IconClaw className="h-6 w-6" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight text-bone">TIGER'S LAIR</span>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-smoke">
            An educational ecosystem rooted in mentorship, digital therapy, and community building. 
            Founded by Ehis O. Ferguson in Benin City for the global digital economy.
          </p>
        </div>
        
        {/* The 4 Pillars */}
        <div className="lg:col-span-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber mb-4">The Ecosystem</p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-amber font-bold">01.</span>
              <div>
                <p className="font-bold text-bone">Web Dashboard</p>
                <p className="text-xs text-smoke">The central hub for enrollment, progress tracking, and certificate management.</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber font-bold">02.</span>
              <div>
                <p className="font-bold text-bone">Telegram Bot</p>
                <p className="text-xs text-smoke">Your daily delivery truck for lessons, reminders, and community engagement.</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber font-bold">03.</span>
              <div>
                <p className="font-bold text-bone">LMS Engine</p>
                <p className="text-xs text-smoke">The structured learning management system powering courses, quizzes, and resources.</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber font-bold">04.</span>
              <div>
                <p className="font-bold text-bone">Mini App</p>
                <p className="text-xs text-smoke">A seamless, in-Telegram mobile experience for learning on the go.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Legal & Compliance */}
        <div className="lg:col-span-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber mb-4">Legal & Compliance</p>
          <ul className="space-y-2.5 text-sm">
            {[
              { l: "Privacy Policy", id: "privacy" },
              { l: "Terms of Service", id: "terms" },
              { l: "Cookie Policy", id: "cookie" },
              { l: "Refund Policy", id: "refund" },
              { l: "Data Protection (NDPR)", id: "ndpr" },
            ].map((x) => (
              <li key={x.id}>
                <button 
                  onClick={() => go({ view: "legal", type: x.id } as any)} 
                  className="text-smoke transition-colors hover:text-amber text-left"
                >
                  {x.l}
                </button>
              </li>
            ))}
            {/* Certificate Verification Link */}
            <li className="pt-2 mt-2 border-t border-bone/5">
              <button 
                onClick={() => go({ view: "verify" } as any)} 
                className="text-amber font-bold transition-colors hover:text-bone text-left"
              >
                ✓ Verify a Certificate
              </button>
            </li>
          </ul>
          
          <div className="mt-6 pt-6 border-t border-bone/10">
            <a href="https://t.me/jsagebutlerbot" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-tgsky hover:underline">
              <IconPlane className="h-4 w-4" /> @TigersLairBot
            </a>
            <p className="mt-2 text-xs text-smoke">support@tigerslair.academy</p>
          </div>
        </div>
      </div>

      <div className="border-t border-bone/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-smoke/60 sm:px-8">
          <span>© 2026 Tiger's Lair Academy. All rights reserved.</span>
          <span>Benin City, Nigeria</span>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// TOASTS
// ============================================
function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[95] flex w-[min(92vw,360px)] flex-col gap-2.5">
      {toasts.map((t) => (
        <div key={t.id} className="toast-in flex items-center gap-3 rounded-md border border-bone/15 border-l-4 border-l-amber bg-coal px-4 py-3 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)]">
          <IconClaw className="h-4 w-4 shrink-0 text-amber" />
          <p className="text-sm text-bone">{t.text}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================
// MAIN SHELL
// ============================================
function Shell() {
  const { route, authOpen, go } = useStore();

  // Support share links like https://yoursite/?verify=TL-PY101-483920
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("verify");
    if (v) go({ view: "verify", certId: v } as any);
  }, [go]);

  return (
    <div className="relative min-h-screen">
      <div className="noise-layer" aria-hidden />
      <StatusStrip />
      <Nav />
      <main>
        {route.view === "home" && <Home />}
        {route.view === "courses" && <Catalog />}
        {route.view === "course" && <CourseDetail key={route.courseId} courseId={route.courseId} />}
        {route.view === "dashboard" && <Dashboard />}
        {route.view === "mentorshop" && <Mentorshop />}
        {route.view === "mentorship-apply" && <MentorshipApply />}
        {route.view === "mentorship-dashboard" && <MentorshipDashboard />}
        {route.view === "counseling" && <CounselingBook />}
        {route.view === "meetups" && <Meetups />}
        {route.view === "admin" && <AdminPanel />}
        {route.view === "course-editor" && <CourseEditor courseId={route.courseId} />}
        
        {/* Certificate Verification & Legal Pages Routing */}
        {route.view === "verify" && <VerifyCertificate certId={route.certId as string | undefined} />}
        {route.view === "legal" && <LegalPage type={route.type as any} />}
      </main>
      <Footer />
      <Toasts />
      {authOpen && <AuthModal />}
      
      <CookieConsent />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}