import { useState } from "react";
import type { ReactNode } from "react";

type Kind = "globe" | "bolt" | "db" | "bucket" | "plane" | "megaphone" | "miniapp" | "whatsapp" | "phone";

interface ENode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub: string;
  kind: Kind;
  chip: string;
  desc: string;
  hub?: boolean;
}

const NODES: ENode[] = [
  {
    id: "web", x: 40, y: 170, w: 178, h: 66, kind: "globe", chip: "Cloudflare Pages",
    label: "Your website", sub: "portfolio · /academy",
    desc: "The public face. Portfolio, services and agro pages — plus /academy with the catalogue, course pages, registration and login. Static pages served from the edge, free.",
  },
  {
    id: "flutter", x: 40, y: 330, w: 178, h: 66, kind: "phone", chip: "Android · iOS",
    label: "Flutter app", sub: "native client · later",
    desc: "A native client that calls the exact same REST API as the website. Built after the responsive web app has carried the first cohorts — same backend, new skin.",
  },
  {
    id: "api", x: 388, y: 240, w: 204, h: 92, kind: "bolt", chip: "Cloudflare Workers",
    label: "Workers API", sub: "auth · REST · webhooks", hub: true,
    desc: "The brain of the operation. Workers run the REST API, authentication, the Telegram webhook and the WhatsApp integration. Every client — web, bot, Mini App, mobile — talks to this one layer and nothing else.",
  },
  {
    id: "d1", x: 388, y: 52, w: 204, h: 66, kind: "db", chip: "SQLite at the edge",
    label: "D1 database", sub: "students · progress · certs",
    desc: "Students, courses, lessons, enrollments, progress and certificates live here — the structure and control you own. Free tier: 5 GB storage, 5M row-reads and 100k row-writes a day.",
  },
  {
    id: "r2", x: 388, y: 438, w: 204, h: 66, kind: "bucket", chip: "Object storage",
    label: "R2 storage", sub: "videos · PDFs · datasets",
    desc: "The heavier assets: lecture recordings, PDFs, capstone datasets. Served with zero egress fees and referenced by lesson rows in D1 — swap it out any day without touching the app.",
  },
  {
    id: "wa", x: 758, y: 52, w: 182, h: 66, kind: "whatsapp", chip: "Meta Cloud API",
    label: "WhatsApp API", sub: "payments · critical alerts",
    desc: "Driven by your backend — payment confirmations and admin-critical alerts for students who prefer WhatsApp. Telegram never talks to WhatsApp directly; the API layer decides who hears what where.",
  },
  {
    id: "bot", x: 758, y: 180, w: 182, h: 66, kind: "plane", chip: "Telegram Bot API",
    label: "Academy bot", sub: "@TigersLairBot",
    desc: "Welcomes students, verifies them with one-time codes, links Telegram IDs to website accounts, pushes enrolment confirmations, new-lesson announcements and assignment reminders.",
  },
  {
    id: "channel", x: 758, y: 308, w: 182, h: 66, kind: "megaphone", chip: "Private channels",
    label: "Course channels", sub: "lectures · PDFs · community",
    desc: "One private channel per course. Weekly drops — lecture, PDF, assignment — with each post's message_id mapped to a lesson row in D1. Telegram is delivery here, never structure.",
  },
  {
    id: "mini", x: 758, y: 438, w: 182, h: 66, kind: "miniapp", chip: "Telegram WebView",
    label: "Mini App", sub: "learning UI in Telegram",
    desc: "The Telegram-native learning interface: my courses, current lesson, progress, assignments. A WebView over the same API — students learn without ever leaving the chat app.",
  },
];

const EDGES: { from: string; to: string; label?: string }[] = [
  { from: "web", to: "api", label: "HTTPS" },
  { from: "flutter", to: "api", label: "REST" },
  { from: "api", to: "d1", label: "SQL" },
  { from: "api", to: "r2", label: "objects" },
  { from: "api", to: "wa", label: "Cloud API" },
  { from: "api", to: "bot", label: "webhook" },
  { from: "bot", to: "channel", label: "invite" },
  { from: "bot", to: "mini", label: "opens" },
];

const BONE = "#f2e8d5";
const SMOKE = "#a89877";

function Glyph({ kind, x, y, active }: { kind: Kind; x: number; y: number; active: boolean }) {
  const color = active ? "#ffa41b" : SMOKE;
  const g = (children: ReactNode) => (
    <g transform={`translate(${x} ${y})`} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </g>
  );
  switch (kind) {
    case "globe":
      return g(<><circle cx="10" cy="10" r="7" /><path d="M3 10h14M10 3c2.2 2 3.3 4.4 3.3 7S12.2 15 10 17c-2.2-2-3.3-4.4-3.3-7S7.8 5 10 3Z" /></>);
    case "bolt":
      return g(<path d="M11 2 4 11h5l-1 7 7-9h-5l1-7Z" />);
    case "db":
      return g(<><ellipse cx="10" cy="4.6" rx="6" ry="2.3" /><path d="M4 4.6v10.8c0 1.3 2.7 2.3 6 2.3s6-1 6-2.3V4.6M4 10c0 1.3 2.7 2.3 6 2.3s6-1 6-2.3" /></>);
    case "bucket":
      return g(<><path d="M4 8h12l-1.2 7.4a1.9 1.9 0 0 1-1.9 1.6H7.1a1.9 1.9 0 0 1-1.9-1.6Z" /><path d="M7 8V6.8a3 3 0 0 1 6 0V8" /></>);
    case "plane":
      return g(<><path d="M18 2 9.5 10.5" /><path d="M18 2l-5.5 15-3-6.5L3 7.5Z" /></>);
    case "megaphone":
      return g(<><path d="M3 8.5v3l2.5.6 8.5 4.4V3.5L5.5 7.9Z" /><path d="M16.5 8a3 3 0 0 1 0 4" /></>);
    case "miniapp":
      return g(<><rect x="3" y="3" width="14" height="14" rx="3" /><rect x="6" y="6" width="3" height="3" rx="0.6" /><rect x="11" y="6" width="3" height="3" rx="0.6" /><rect x="6" y="11" width="3" height="3" rx="0.6" /><path d="M11 12h3M11 13.6h2" /></>);
    case "whatsapp":
      return g(<><path d="M10 2.6a7.4 7.4 0 0 0-6.4 11.1L2.5 17.5l3.9-1A7.4 7.4 0 1 0 10 2.6Z" /><path d="M7.4 7.2c-.2 2.3 3.1 5.7 5.5 5.4l.8-1.4-1.8-.9-.8.7a4.7 4.7 0 0 1-2.1-2.1l.7-.8-.9-1.8Z" /></>);
    case "phone":
      return g(<><rect x="5.5" y="2" width="9" height="16" rx="2" /><path d="M8.5 15.5h3" /></>);
  }
}

export function Ecosystem() {
  const [active, setActive] = useState("api");
  const [hover, setHover] = useState<string | null>(null);

  const center = (n: ENode) => ({ cx: n.x + n.w / 2, cy: n.y + n.h / 2 });
  const activeNode = NODES.find((n) => n.id === active) ?? NODES[2];

  return (
    <div>
      <div className="overflow-x-auto">
        <svg viewBox="0 0 980 556" className="h-auto w-full min-w-[720px]" role="img" aria-label="Architecture blueprint: website, Workers API, D1, R2, Telegram bot, channels, Mini App, WhatsApp and Flutter">
          {/* edges */}
          {EDGES.map((e) => {
            const a = NODES.find((n) => n.id === e.from)!;
            const b = NODES.find((n) => n.id === e.to)!;
            const p1 = center(a);
            const p2 = center(b);
            const mx = (p1.cx + p2.cx) / 2;
            const my = (p1.cy + p2.cy) / 2;
            const hot = active === e.from || active === e.to;
            return (
              <g key={`${e.from}-${e.to}`}>
                <path
                  d={`M ${p1.cx} ${p1.cy} L ${p2.cx} ${p2.cy}`}
                  fill="none"
                  stroke={hot ? "#ffa41b" : "rgba(242,232,213,0.16)"}
                  strokeWidth={hot ? 2 : 1.4}
                  className="edge-flow"
                  style={{ transition: "stroke 0.3s" }}
                />
                {e.label && (
                  <text
                    x={mx}
                    y={my - 7}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                    letterSpacing="0.08em"
                    fill={hot ? "#ffa41b" : SMOKE}
                    stroke="#171007"
                    strokeWidth="4"
                    paintOrder="stroke"
                  >
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* nodes */}
          {NODES.map((n) => {
            const isActive = active === n.id;
            const isHover = hover === n.id;
            return (
              <g
                key={n.id}
                onClick={() => setActive(n.id)}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover(null)}
                style={{ cursor: "pointer" }}
                role="button"
                aria-label={`${n.label}: ${n.desc}`}
              >
                {n.hub && (
                  <rect x={n.x - 7} y={n.y - 7} width={n.w + 14} height={n.h + 14} rx={16} fill="rgba(255,164,27,0.07)" />
                )}
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  rx={11}
                  fill={n.hub ? "#2a1f0d" : "#211709"}
                  stroke={isActive || isHover ? "#ffa41b" : "rgba(242,232,213,0.16)"}
                  strokeWidth={isActive ? 2 : 1.2}
                  style={{ transition: "stroke 0.25s" }}
                />
                <Glyph kind={n.kind} x={n.x + 15} y={n.y + n.h / 2 - 10} active={isActive} />
                <text x={n.x + 46} y={n.y + n.h / 2 - 3} fontSize="13" fontWeight="700" fill={BONE} fontFamily="Instrument Sans, sans-serif">
                  {n.label}
                </text>
                <text x={n.x + 46} y={n.y + n.h / 2 + 13} fontSize="8.5" fill={SMOKE} fontFamily="JetBrains Mono, monospace" letterSpacing="0.06em">
                  {n.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* detail panel */}
      <div className="mt-6 grid gap-4 rounded-lg border border-ink/15 bg-ink p-6 text-bone sm:grid-cols-[auto_1fr] sm:gap-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-amber text-ink">
          <Glyph kind={activeNode.kind} x={-10} y={-10} active={false} />
        </div>
        <div key={activeNode.id} className="toast-in">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-xl font-bold">{activeNode.label}</h3>
            <span className="rounded-full border border-amber/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
              {activeNode.chip}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-smoke">{activeNode.desc}</p>
        </div>
      </div>
    </div>
  );
}
