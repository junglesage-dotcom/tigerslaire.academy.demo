import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { IconClaw } from "./Icons";

export const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useInView<T extends HTMLElement>(threshold = 0.18, once = true) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            if (once) io.unobserve(e.target);
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);
  return { ref, inView };
}

/* ---------- scramble-decode text ---------- */
export function Scramble({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.3);
  const [out, setOut] = useState(() => (prefersReduced() ? text : ""));
  useEffect(() => {
    if (!inView) return;
    if (prefersReduced()) {
      setOut(text);
      return;
    }
    const glyphs = "█▓▒░<>/\\#%&@+=";
    let frame = 0;
    let raf = 0;
    const tick = () => {
      frame += 1;
      const revealed = Math.floor(frame / 2.4);
      if (revealed >= text.length) {
        setOut(text);
        return;
      }
      let s = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === " ") {
          s += " ";
          continue;
        }
        s += i < revealed ? ch : glyphs[(i * 7 + frame * 3) % glyphs.length];
      }
      setOut(s);
      raf = requestAnimationFrame(tick);
    };
    const t0 = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(t0);
      cancelAnimationFrame(raf);
    };
  }, [inView, text, delay]);
  return (
    <span ref={ref} className={className}>
      {out || "\u00A0"}
    </span>
  );
}

/* ---------- scroll reveal ---------- */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.12);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${inView ? "is-in" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------- count-up number ---------- */
export function CountUp({
  to,
  prefix = "",
  suffix = "",
  duration = 1500,
  className = "",
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (prefersReduced()) {
      setVal(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return (
    <span ref={ref} className={className}>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ---------- progress ring ---------- */
export function Ring({
  value,
  size = 96,
  stroke = 8,
  color = "var(--color-amber)",
  track = "rgba(242,232,213,0.1)",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, Math.max(0, value)));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          className="ring-anim"
          style={{ "--ring-c": `${c}`, transition: "stroke-dashoffset 0.9s cubic-bezier(0.2,0.7,0.2,1)" } as CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

/* ---------- marquee ticker ---------- */
export function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const row = (key: string, hidden: boolean) => (
    <div key={key} aria-hidden={hidden} className="flex shrink-0 items-center">
      {items.map((it, i) => (
        <span key={i} className="flex items-center font-mono text-[11px] tracking-[0.22em] text-smoke">
          <span className="px-7 whitespace-nowrap">{it}</span>
          <IconClaw className="h-3.5 w-3.5 shrink-0 text-amber" />
        </span>
      ))}
    </div>
  );
  return (
    <div className={`marquee overflow-hidden border-y border-bone/10 bg-coal py-3.5 ${className}`}>
      <div className="marquee-track flex w-max">
        {row("a", false)}
        {row("b", true)}
      </div>
    </div>
  );
}

/* ---------- section heading kit ---------- */
export function Kicker({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className={`flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] ${
        dark ? "text-khaki" : "text-amber"
      }`}
    >
      <IconClaw className="h-4 w-4" />
      {children}
    </p>
  );
}

export function SectionHead({
  kicker,
  title,
  body,
  dark = false,
  className = "",
}: {
  kicker: string;
  title: ReactNode;
  body?: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={`max-w-2xl ${className}`}>
      <Reveal>
        <Kicker dark={dark}>{kicker}</Kicker>
      </Reveal>
      <Reveal delay={90}>
        <h2
          className={`mt-4 font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl ${
            dark ? "text-ink" : "text-bone"
          }`}
        >
          {title}
        </h2>
      </Reveal>
      {body && (
        <Reveal delay={170}>
          <p className={`mt-5 text-base leading-relaxed sm:text-lg ${dark ? "text-khaki" : "text-smoke"}`}>{body}</p>
        </Reveal>
      )}
    </div>
  );
}
