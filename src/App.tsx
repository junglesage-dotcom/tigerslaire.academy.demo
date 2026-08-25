import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./lib/store";
import Home from "./views/Home";
import Catalog from "./views/Catalog";
import CourseDetail from "./views/CourseDetail";
import Dashboard from "./views/Dashboard";
import { AuthModal, TelegramModal } from "./components/Modals";
import { IconClaw, IconMenu, IconX, IconPlane } from "./components/Icons";

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
        <span className="shrink-0 text-amber">lair-edge v1.4</span>
        <span className="hidden items-center gap-1.5 sm:flex">
          <span className="blink-dot h-1.5 w-1.5 rounded-full bg-mint" /> fra1 · online
        </span>
        <span className="hidden items-center gap-1.5 md:flex">
          <span className="blink-dot h-1.5 w-1.5 rounded-full bg-mint" style={{ animationDelay: "0.4s" }} /> D1 · 7 tables synced
        </span>
        <span className="hidden items-center gap-1.5 lg:flex">
          <span className="blink-dot h-1.5 w-1.5 rounded-full bg-tgsky" style={{ animationDelay: "0.8s" }} /> @TigersLairBot · listening
        </span>
        <span className="ml-auto shrink-0 text-smoke/70">uptime {h}:{m}:{s}</span>
      </div>
    </div>
  );
}

function Nav() {
  const { route, go, user, setAuthOpen, logout } = useStore();
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Overview", active: route.view === "home", go: () => go({ view: "home" }) },
    { label: "Courses", active: route.view === "courses" || route.view === "course", go: () => go({ view: "courses" }) },
    { label: "Dashboard", active: route.view === "dashboard", go: () => go({ view: "dashboard" }) },
  ];

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
            <span className="mt-1 block font-mono text-[8.5px] uppercase tracking-[0.3em] text-smoke">academy · est. Lagos</span>
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
                  <span className="text-sm text-smoke">
                    {user.name} · <span className="font-mono text-[10px]">{user.id}</span>
                  </span>
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

function Footer() {
  const { go, toast } = useStore();
  const toBlueprint = () => {
    go({ view: "home" });
    window.setTimeout(() => document.getElementById("blueprint")?.scrollIntoView({ behavior: "smooth" }), 80);
  };
  return (
    <footer className="border-t border-bone/10 bg-[#120c05]">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-amber text-ink">
              <IconClaw className="h-6 w-6" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight text-bone">TIGER'S LAIR</span>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-smoke">
            An academy built on the Cloudflare edge with Telegram as its delivery truck and a database it actually owns. Portfolio,
            agro and the academy — one professional identity.
          </p>
          <a
            href="https://t.me/BotFather"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-tgsky/40 px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-tgsky transition-colors hover:bg-tgsky/10"
          >
            <IconPlane className="h-4 w-4" /> @TigersLairBot
          </a>
        </div>
        <div className="lg:col-span-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber">Academy</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              { l: "Overview", f: () => go({ view: "home" }) },
              { l: "Course catalogue", f: () => go({ view: "courses" }) },
              { l: "Student dashboard", f: () => go({ view: "dashboard" }) },
              { l: "The blueprint", f: toBlueprint },
            ].map((x) => (
              <li key={x.l}>
                <button onClick={x.f} className="text-smoke transition-colors hover:text-amber">
                  {x.l}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber">Ecosystem</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              { l: "Cloudflare Workers docs", href: "https://developers.cloudflare.com/workers/" },
              { l: "Cloudflare D1 docs", href: "https://developers.cloudflare.com/d1/" },
              { l: "Telegram Bot API", href: "https://core.telegram.org/bots/api" },
              { l: "Telegram Mini Apps", href: "https://core.telegram.org/bots/webapps" },
              { l: "Flutter", href: "https://flutter.dev" },
            ].map((x) => (
              <li key={x.l}>
                <a
                  href={x.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => toast("Opening the docs — the blueprint awaits")}
                  className="text-smoke transition-colors hover:text-amber"
                >
                  {x.l} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-bone/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-smoke/60 sm:px-8">
          <span>© 2026 Tiger's Lair — built on the edge</span>
          <span>PY101 · BA202 · EH301 — demo; records live in your browser</span>
        </div>
      </div>
    </footer>
  );
}

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

function Shell() {
  const { route, authOpen, tgOpen } = useStore();
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
      </main>
      <Footer />
      <Toasts />
      {authOpen && <AuthModal />}
      {tgOpen && <TelegramModal />}
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
