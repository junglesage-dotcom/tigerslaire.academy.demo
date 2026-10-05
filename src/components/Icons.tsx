import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

// Updated to match the new design spec: 2px stroke, round caps + joins
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

// ==========================================
// EXISTING ICONS (Preserved)
// ==========================================

export const IconClaw = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5.5 3c2.3 3 3.1 7.6 2.1 14" />
    <path d="M12 2.2c2.2 3.4 2.9 8.4 2 15.3" />
    <path d="M18.5 4.5c1.7 3.1 2.2 7.3 1.3 12.4" />
  </svg>
);

export const IconPlane = (p: P) => (
  <svg {...base} {...p}>
    <path d="M21.5 2.5 11 13" />
    <path d="M21.5 2.5 14.7 21.5l-3.7-8.5-8.5-3.7Z" />
  </svg>
);

export const IconDb = (p: P) => (
  <svg {...base} {...p}>
    <ellipse cx="12" cy="5.2" rx="7.5" ry="2.7" />
    <path d="M4.5 5.2v13.6c0 1.5 3.4 2.7 7.5 2.7s7.5-1.2 7.5-2.7V5.2" />
    <path d="M4.5 12c0 1.5 3.4 2.7 7.5 2.7s7.5-1.2 7.5-2.7" />
  </svg>
);

export const IconBucket = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 9.5h16l-1.6 9.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8Z" />
    <path d="M8 9.5V8a4 4 0 0 1 8 0v1.5" />
  </svg>
);

export const IconGlobe = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9.2" />
    <path d="M2.8 12h18.4" />
    <path d="M12 2.8c2.6 2.6 3.9 5.7 3.9 9.2s-1.3 6.6-3.9 9.2c-2.6-2.6-3.9-5.7-3.9-9.2S9.4 5.4 12 2.8Z" />
  </svg>
);

export const IconPhone = (p: P) => (
  <svg {...base} {...p}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M10.5 18.5h3" />
  </svg>
);

export const IconBot = (p: P) => (
  <svg {...base} {...p}>
    <rect x="4.5" y="8" width="15" height="11" rx="2.5" />
    <path d="M12 8V5" />
    <circle cx="12" cy="3.8" r="1.1" />
    <path d="M9 12.5v1.6M15 12.5v1.6" />
  </svg>
);

export const IconMegaphone = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 10.5v3A1.5 1.5 0 0 0 4.5 15H7l10 5V4L7 9H4.5A1.5 1.5 0 0 0 3 10.5Z" />
    <path d="M20.5 9.5a3.6 3.6 0 0 1 0 5" />
    <path d="m8 15.4 1 4.6h2.6l-.9-4.3" />
  </svg>
);

export const IconMiniApp = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <rect x="7.3" y="7.3" width="3.8" height="3.8" rx="1" />
    <rect x="12.9" y="7.3" width="3.8" height="3.8" rx="1" />
    <rect x="7.3" y="12.9" width="3.8" height="3.8" rx="1" />
    <path d="M13 13.6h3.6M13 16h2.2" />
  </svg>
);

export const IconWhatsApp = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3 21l4.8-1.3A8.8 8.8 0 1 0 12 3.2Z" />
    <path d="M8.8 8.6c-.3 2.8 3.8 6.9 6.6 6.6l.9-1.7-2.1-1.1-1 .9a5.6 5.6 0 0 1-2.5-2.5l.9-1-1.1-2.1Z" />
  </svg>
);

export const IconPlay = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7.5 4.8v14.4L19 12Z" />
  </svg>
);

export const IconDoc = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 2.8h8l4 4v14.4H6Z" />
    <path d="M14 2.8v4h4" />
    <path d="M9 12.5h6M9 16h6" />
  </svg>
);

export const IconClipboard = (p: P) => (
  <svg {...base} {...p}>
    <rect x="5" y="4.5" width="14" height="17" rx="2" />
    <path d="M9 4.5V3h6v1.5" />
    <path d="m8.8 13.5 2.3 2.3 4.3-4.7" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base} {...p}>
    <path d="m4.5 12.5 5 5L19.5 6.5" />
  </svg>
);

export const IconLock = (p: P) => (
  <svg {...base} {...p}>
    <rect x="5.5" y="10.5" width="13" height="10" rx="2" />
    <path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7" />
    <path d="M12 14.5V17" />
  </svg>
);

export const IconArrowRight = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 12h15" />
    <path d="m13.5 6 6 6-6 6" />
  </svg>
);

export const IconArrowUpRight = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6.5 17.5 17.5 6.5" />
    <path d="M8.5 6.5h9v9" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

export const IconUsers = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.8 20c.6-3.5 3-5.5 6.2-5.5s5.6 2 6.2 5.5" />
    <path d="M15.5 4.9a3.5 3.5 0 0 1 0 6.2" />
    <path d="M17.8 14.9c2 .8 3.2 2.5 3.6 5.1" />
  </svg>
);

export const IconMenu = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 6.5h16M4 12h16M4 17.5h10" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base} {...p}>
    <path d="m5.5 5.5 13 13M18.5 5.5l-13 13" />
  </svg>
);

export const IconBars = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4.5 19.5h15" />
    <path d="M7 19.5v-6M12 19.5V6.5M17 19.5v-9.5" />
  </svg>
);

export const IconTerminal = (p: P) => (
  <svg {...base} {...p}>
    <path d="m4.5 6.5 5.5 5.5-5.5 5.5" />
    <path d="M12 18.5h7.5" />
  </svg>
);

export const IconBook = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21Z" />
    <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
  </svg>
);

export const IconCalendar = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="5" width="17" height="16" rx="2" />
    <path d="M8 2.8V7M16 2.8V7M3.5 10.5h17" />
  </svg>
);

export const IconBell = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
    <path d="M10 19.5a2 2 0 0 0 4 0" />
  </svg>
);

export const IconLink = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9.5 14.5 14.5 9.5" />
    <path d="M11 6.5 12.8 4.7a3.8 3.8 0 0 1 5.4 5.4L16.5 12" />
    <path d="M13 17.5l-1.8 1.8a3.8 3.8 0 0 1-5.4-5.4L7.5 12" />
  </svg>
);

export const IconDownload = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3.5v11" />
    <path d="m7.5 10 4.5 4.5L16.5 10" />
    <path d="M4.5 19.5h15" />
  </svg>
);

export const IconMail = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </svg>
);

export const IconCopy = (p: P) => (
  <svg {...base} {...p}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
    <path d="M5.5 15.5h-1a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

// ==========================================
// UPDATED ICONS (New Design Spec Paths)
// ==========================================

export const IconBolt = (p: P) => (
  <svg {...base} {...p}>
    <path d="M13 2L5 13h5l-1 9 8-11h-5l1-9z" />
  </svg>
);

export const IconFlame = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3c2 3.5-3 5.5-3 9a3.5 3.5 0 0 0 7 0c0-1.6-.8-2.9-1.8-4-.3 1.1-1 1.8-2.2 2 .7-2.2.7-4.6 0-7z" />
  </svg>
);

export const IconSeal = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="9.5" r="5.5" />
    <path d="M9.2 14.2L7.5 21l4.5-2.6L16.5 21l-1.7-6.8" />
    <path d="M12 7v2.5l1.8 1" />
  </svg>
);

export const IconShield = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3l7 3v5.5c0 4.2-2.8 7.4-7 9.5-4.2-2.1-7-5.3-7-9.5V6z" />
    <path d="M9.5 11.5l2 2 3.5-3.5" />
  </svg>
);

// ==========================================
// NEW BADGE & MOTIF ICONS
// ==========================================

export const IconClawMark = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 19c2-6 3-10 4-14" />
    <path d="M10 19c2-6 3-10 4-14" />
    <path d="M15 19c2-6 3-10 4-14" />
  </svg>
);

export const IconStripe = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7 4c2.5 2.7 2.5 5.3 0 8s-2.5 5.3 0 8" />
    <path d="M12 4c2.5 2.7 2.5 5.3 0 8s-2.5 5.3 0 8" />
    <path d="M17 4c2.5 2.7 2.5 5.3 0 8s-2.5 5.3 0 8" />
  </svg>
);

export const IconLaurel = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7 4c-2 4-2 8 0 12" />
    <path d="M17 4c2 4 2 8 0 12" />
    <path d="M7 16c1.5 2 3 3 5 3s3.5-1 5-3" />
    <path d="M8.5 7.5L6 8" />
    <path d="M8 11l-2.5.5" />
    <path d="M15.5 7.5L18 8" />
    <path d="M16 11l2.5.5" />
  </svg>
);

export const IconTiger = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7.5 4.5a2 2 0 1 0 .1 4" />
    <path d="M16.5 4.5a2 2 0 1 1-.1 4" />
    <path d="M6 8.5c0 6 2.5 11 6 11s6-5 6-11" />
    <path d="M10 12h.01" />
    <path d="M14 12h.01" />
    <path d="M12 14.5v1" />
    <path d="M10.5 8.5L10 10.5" />
    <path d="M13.5 8.5l.5 2" />
  </svg>
);

export const IconPaw = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="7.5" cy="9" r="1.8" />
    <circle cx="12" cy="7.2" r="1.8" />
    <circle cx="16.5" cy="9" r="1.8" />
    <path d="M12 12c-3.2 0-5.5 2.2-5.5 4.3 0 1.6 1.3 2.7 2.9 2.7 1 0 1.8-.4 2.6-.4s1.6.4 2.6.4c1.6 0 2.9-1.1 2.9-2.7 0-2.1-2.3-4.3-5.5-4.3z" />
  </svg>
);

export const IconLeaf = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 19C5 10 11 5 20 5c0 9-5 14-14 14z" />
    <path d="M5 19c3-6 7-9.5 11-11.5" />
  </svg>
);

export const IconCompass = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5l-2.2 5-5 2.2 2.2-5z" />
  </svg>
);

export const IconBridge = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 18v-3a8 8 0 0 1 16 0v3" />
    <path d="M4 18h16" />
    <path d="M8 18v-4" />
    <path d="M12 18v-5" />
    <path d="M16 18v-4" />
  </svg>
);

export const IconMic = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" />
    <path d="M6.5 11a5.5 5.5 0 0 0 11 0" />
    <path d="M12 16.5V21" />
    <path d="M9 21h6" />
  </svg>
);

export const IconNaira = (p: P) => (
  <svg {...base} {...p}>
    <path d="M8 17V7l8 10V7" />
    <path d="M6 10.5h12" />
    <path d="M6 13.5h12" />
  </svg>
);

export const IconKey = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="8" cy="15" r="3.5" />
    <path d="M11.5 15H20" />
    <path d="M17 15v3" />
    <path d="M20 15v2" />
  </svg>
);