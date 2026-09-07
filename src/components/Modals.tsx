import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useStore } from "../lib/store";
import { IconClaw, IconPlane, IconCheck, IconX, IconCopy } from "./Icons";

function Overlay({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-ink/85 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className="toast-in my-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-bone/15 bg-coal px-3.5 py-2.5 text-sm text-bone placeholder:text-smoke/50 outline-none transition-colors focus:border-amber";

/* ================= AUTH ================= */

export function AuthModal() {
  const { setAuthOpen, register, login, loginDemo } = useStore();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (mode === "signup" && name.trim().length < 2) {
      return setErr("Tell us your name — at least 2 characters.");
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return setErr("That email doesn't look right.");
    }
    if (pw.length < 6) {
      return setErr("Password needs at least 6 characters.");
    }
    
    setErr("");
    setLoading(true);

    const displayName =
      mode === "signup"
        ? name.trim()
        : email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    try {
      if (mode === "signup") {
        // Correctly passing name, email, and password
        await register(displayName, email, pw);
      } else {
        // Correctly passing email and password
        await login(email, pw);
      }
      setAuthOpen(false);
    } catch (e: any) {
      setErr(e.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay onClose={() => setAuthOpen(false)} label="Sign in to Tiger's Lair">
      <div className="rounded-lg border border-bone/15 bg-ink p-6 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-amber">
              <IconClaw className="h-3.5 w-3.5" /> Student access
            </p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-bone">
              {mode === "signup" ? "Enter the Lair" : "Welcome back"}
            </h2>
          </div>
          <button onClick={() => setAuthOpen(false)} aria-label="Close" className="text-smoke transition-colors hover:text-bone">
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 rounded-md border border-bone/12 p-1 font-mono text-[11px] uppercase tracking-[0.14em]">
          {(["signup", "signin"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setErr("");
              }}
              className={`rounded px-3 py-2 transition-colors ${
                mode === m ? "bg-amber font-bold text-ink" : "text-smoke hover:text-bone"
              }`}
            >
              {m === "signup" ? "Create account" : "Sign in"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3.5">
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-smoke">Full name</label>
              <input 
                className={inputCls} 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Ada Eze" 
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-smoke">Email</label>
            <input 
              className={inputCls} 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@example.com" 
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-smoke">Password</label>
            <input 
              type="password" 
              className={inputCls} 
              value={pw} 
              onChange={(e) => setPw(e.target.value)} 
              placeholder="••••••••" 
            />
          </div>
          
          {err && (
            <p className="rounded border border-alert/40 bg-alert/10 px-3 py-2 text-xs text-alert">
              {err}
            </p>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="stripe-btn w-full rounded-md bg-amber px-4 py-3 font-display text-sm font-extrabold uppercase tracking-[0.1em] text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {loading ? "Please wait..." : mode === "signup" ? "Create my student record" : "Sign in"}
          </button>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-bone/10" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-smoke">or</span>
          <span className="h-px flex-1 bg-bone/10" />
        </div>
        
        <button
          onClick={() => {
            loginDemo();
            setAuthOpen(false);
          }}
          className="mt-4 w-full rounded-md border border-bone/15 px-4 py-2.5 text-sm text-bone transition-colors hover:border-amber hover:text-amber"
        >
          Explore as <span className="font-bold">Ada</span> — demo student with progress
        </button>
        
        <p className="mt-4 text-center font-mono text-[10px] leading-relaxed tracking-[0.06em] text-smoke/70">
          Demo mode — your student record lives in this browser only.
        </p>
      </div>
    </Overlay>
  );
}

/* ================= TELEGRAM LINK ================= */

export function TelegramModal() {
  const { setTgOpen, user, linkTelegram, unlinkTelegram } = useStore();
  const [step, setStep] = useState(1);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const { toast } = useStore();
  const expected = useMemo(() => "TL-" + String(Math.floor(1000 + Math.random() * 9000)), []);

  const verify = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim().toUpperCase() === expected) {
      setErr("");
      linkTelegram();
      setStep(4);
    } else {
      setErr("Code doesn't match — check the bot's message and try again.");
    }
  };

  const steps = ["Open the bot", "Copy your code", "Verify"];

  return (
    <Overlay onClose={() => setTgOpen(false)} label="Link Telegram account">
      <div className="rounded-lg border border-bone/15 bg-ink p-6 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-tgsky">
              <IconPlane className="h-3.5 w-3.5" /> @TigersLairBot
            </p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-bone">Link your Telegram</h2>
          </div>
          <button onClick={() => setTgOpen(false)} aria-label="Close" className="text-smoke transition-colors hover:text-bone">
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {user?.telegram_id ? (
          <div className="mt-6">
            <div className="flex items-center gap-3 rounded-md border border-mint/30 bg-mint/10 px-4 py-3">
              <IconCheck className="h-5 w-5 text-mint" />
              <div>
                <p className="text-sm font-bold text-bone">Linked · telegram_id {user.telegram_id}</p>
                <p className="text-xs text-smoke">Lesson drops and reminders now arrive in your chat.</p>
              </div>
            </div>
            <button
              onClick={() => {
                unlinkTelegram();
                setStep(1);
              }}
              className="mt-4 w-full rounded-md border border-bone/15 px-4 py-2.5 text-sm text-smoke transition-colors hover:border-alert hover:text-alert"
            >
              Unlink this account
            </button>
          </div>
        ) : step === 4 ? (
          <div className="mt-6">
            <div className="flex items-center gap-3 rounded-md border border-mint/30 bg-mint/10 px-4 py-3">
              <IconCheck className="h-5 w-5 text-mint" />
              <div>
                <p className="text-sm font-bold text-bone">Verified — one identity, everywhere</p>
                <p className="text-xs text-smoke">Website, bot, Mini App and the future mobile app now share your record.</p>
              </div>
            </div>
            <button
              onClick={() => setTgOpen(false)}
              className="stripe-btn mt-4 w-full rounded-md bg-tgsky px-4 py-3 font-display text-sm font-extrabold uppercase tracking-[0.1em] text-ink"
            >
              Back to the den
            </button>
          </div>
        ) : (
          <>
            <div className="mt-5 flex items-center gap-2">
              {steps.map((s, i) => (
                <div key={s} className="flex flex-1 items-center gap-2">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                      step > i + 1 ? "bg-mint text-ink" : step === i + 1 ? "bg-tgsky text-ink" : "border border-bone/20 text-smoke"
                    }`}
                  >
                    {step > i + 1 ? <IconCheck className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className={`hidden font-mono text-[9px] uppercase tracking-[0.14em] sm:block ${step === i + 1 ? "text-bone" : "text-smoke/60"}`}>
                    {s}
                  </span>
                  {i < 2 && <span className="h-px flex-1 bg-bone/10" />}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="mt-6">
                <p className="text-sm leading-relaxed text-smoke">
                  Start a chat with the academy bot. It answers <span className="font-mono text-bone">/start</span>, welcomes you and
                  generates a one-time linking code tied to your student record.
                </p>
                <a
                  href="https://t.me/TigersLair_bot"
                  target="_blank"
                  rel="noreferrer"
                  className="card-lift mt-4 flex items-center gap-4 rounded-md border border-tgsky/30 bg-tgsky/10 px-4 py-3.5"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-tgsky text-ink">
                    <IconPlane className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-bone">@TigersLair_bot</span>
                    <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-tgsky">t.me · opens Telegram</span>
                  </span>
                </a>
                <button
                  onClick={() => setStep(2)}
                  className="stripe-btn mt-4 w-full rounded-md bg-tgsky px-4 py-3 font-display text-sm font-extrabold uppercase tracking-[0.1em] text-ink"
                >
                  I've started the chat
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="mt-6">
                <p className="text-sm leading-relaxed text-smoke">
                  This is your one-time code. Paste it into the bot — it's how the Lair knows <span className="text-bone">{user?.name ?? "you"}</span>{" "}
                  on the website and <span className="text-bone">{user?.name?.split(" ")[0]?.toLowerCase() ?? "you"}</span> on Telegram are the same student.
                </p>
                <div className="mt-4 flex items-center justify-between rounded-md border border-amber/40 bg-coal px-5 py-4">
                  <span className="font-mono text-2xl font-bold tracking-[0.2em] text-amber">{expected}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(expected).catch(() => undefined);
                      toast("Code copied — paste it to the bot");
                    }}
                    className="flex items-center gap-2 rounded border border-bone/15 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-smoke transition-colors hover:border-amber hover:text-amber"
                  >
                    <IconCopy className="h-3.5 w-3.5" /> Copy
                  </button>
                </div>
                <div className="mt-4 flex gap-3">
                  <button 
                    onClick={() => setStep(1)} 
                    className="rounded-md border border-bone/15 px-4 py-3 text-sm text-smoke transition-colors hover:text-bone"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="stripe-btn flex-1 rounded-md bg-tgsky px-4 py-3 font-display text-sm font-extrabold uppercase tracking-[0.1em] text-ink"
                  >
                    Code sent — verify
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={verify} className="mt-6">
                <p className="text-sm leading-relaxed text-smoke">
                  Type the code the bot echoed back to you. In production the bot verifies it server-side against D1.
                </p>
                <label className="mb-1.5 mt-4 block font-mono text-[10px] uppercase tracking-[0.18em] text-smoke">Linking code</label>
                <input
                  className={inputCls + " text-center font-mono text-lg tracking-[0.3em]"}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="TL-0000"
                  autoFocus
                />
                <p className="mt-2 font-mono text-[10px] text-smoke/60">hint for the demo: the code is {expected}</p>
                {err && <p className="mt-3 rounded border border-alert/40 bg-alert/10 px-3 py-2 text-xs text-alert">{err}</p>}
                <div className="mt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setStep(2)} 
                    className="rounded-md border border-bone/15 px-4 py-3 text-sm text-smoke transition-colors hover:text-bone"
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="stripe-btn flex-1 rounded-md bg-tgsky px-4 py-3 font-display text-sm font-extrabold uppercase tracking-[0.1em] text-ink"
                  >
                    Verify & link
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </Overlay>
  );
}

/* ================= CONFIRM ================= */

export function ConfirmModal() {
  // Note: Ensure your store actually exports `confirmState` and `closeConfirm` 
  // if you are using this modal. If not, you can safely remove this component.
  const store = useStore() as any; 
  const confirmState = store.confirmState;
  const closeConfirm = store.closeConfirm;

  if (!confirmState) return null;
  
  const { title, message, confirmLabel, onConfirm } = confirmState;
  
  return (
    <Overlay onClose={closeConfirm} label={title}>
      <div className="rounded-lg border border-bone/15 bg-ink p-6 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-amber">
              <IconClaw className="h-3.5 w-3.5" /> Confirm action
            </p>
            <h2 className="mt-2 font-display text-xl font-extrabold text-bone">{title}</h2>
          </div>
          <button onClick={closeConfirm} aria-label="Close" className="text-smoke transition-colors hover:text-bone">
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-smoke">{message}</p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={closeConfirm}
            className="flex-1 rounded-md border border-bone/15 px-4 py-2.5 text-sm font-bold text-bone transition-colors hover:bg-bone/5"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              closeConfirm();
              onConfirm();
            }}
            className="flex-1 rounded-md bg-alert px-4 py-2.5 text-sm font-bold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-alert/90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Overlay>
  );
}