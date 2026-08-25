import { useEffect, useState } from "react";
import { prefersReduced } from "./ui";

export interface TermLine {
  t: string;
  c?: string;
  pause?: number;
}

export function Terminal({ lines, title = "lair — zsh" }: { lines: TermLine[]; title?: string }) {
  const reduced = prefersReduced();
  const [li, setLi] = useState(() => (reduced ? lines.length : 0));
  const [pos, setPos] = useState(0);

  useEffect(() => {
    if (reduced) return;
    if (li >= lines.length) return;
    const line = lines[li];
    if (pos < line.t.length) {
      const id = window.setTimeout(() => setPos((p) => p + 1), 13);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(
      () => {
        setLi((i) => i + 1);
        setPos(0);
      },
      line.pause ?? 360
    );
    return () => window.clearTimeout(id);
  }, [li, pos, lines, reduced]);

  const shown = lines.slice(0, li);
  const current = lines[li];

  return (
    <div className="overflow-hidden rounded-lg border border-bone/15 bg-[#120c05] shadow-[0_40px_90px_-24px_rgba(0,0,0,0.85)]">
      <div className="flex items-center gap-2 border-b border-bone/10 bg-coal px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-ember/90" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber/90" />
        <span className="h-2.5 w-2.5 rounded-full bg-mint/90" />
        <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.22em] text-smoke">{title}</span>
        <span className="ml-auto font-mono text-[10px] tracking-[0.18em] text-smoke/70">edge · fra1</span>
      </div>
      <div className="min-h-[318px] p-4 font-mono text-[11.5px] leading-[2] sm:p-5 sm:text-[12.5px]">
        {shown.map((l, i) => (
          <p key={i} className={l.c ?? "text-bone"}>
            {l.t}
          </p>
        ))}
        {current && (
          <p className={current.c ?? "text-bone"}>
            {current.t.slice(0, pos)}
            <span className="term-caret text-amber">▌</span>
          </p>
        )}
        {!current && (
          <p className="text-smoke">
            $ <span className={reduced ? "text-amber" : "term-caret text-amber"}>▌</span>
          </p>
        )}
      </div>
    </div>
  );
}

export const BOOT_LINES: TermLine[] = [
  { t: "$ lair deploy --target workers", c: "text-bone", pause: 500 },
  { t: "▲ compiling academy… ok in 1.8s", c: "text-smoke" },
  { t: "● D1 migrations applied — 7 tables", c: "text-mint" },
  { t: "● R2 bucket linked → course assets", c: "text-mint" },
  { t: "$ lair bot:start @TigersLairBot", c: "text-bone", pause: 500 },
  { t: "✓ webhook → /telegram/hook registered", c: "text-mint" },
  { t: "$ lair enroll --student ada --course PY101", c: "text-bone", pause: 520 },
  { t: "✓ enrollment #1042 written to D1", c: "text-mint" },
  { t: "✓ private channel invite delivered", c: "text-tgsky" },
  { t: "✓ WhatsApp confirmation queued", c: "text-wagreen" },
  { t: "$ lair status", c: "text-bone", pause: 420 },
  { t: "▲ 30 lessons live · 3 courses · uptime 100%", c: "text-amber" },
];
