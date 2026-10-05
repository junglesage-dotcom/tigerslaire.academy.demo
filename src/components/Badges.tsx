import { 
  IconFlame, IconBolt, IconLaurel, IconShield, IconSeal, 
  IconTiger, IconPaw, IconLeaf, IconCompass, IconBridge, 
  IconMic, IconNaira, IconKey 
} from "./Icons";

export const MOTIFS: Record<string, any> = {
  flame: IconFlame, bolt: IconBolt, laurel: IconLaurel, shield: IconShield, seal: IconSeal,
  tiger: IconTiger, paw: IconPaw, leaf: IconLeaf, compass: IconCompass, bridge: IconBridge,
  mic: IconMic, naira: IconNaira, key: IconKey,
};

export const TIERS: Record<number, { label: string; text: string; ring: string }> = {
  1: { label: "Bone", text: "text-bone", ring: "#e9dfcf" },
  2: { label: "Sky", text: "text-tgsky", ring: "#2aabee" },
  3: { label: "Amber", text: "text-amber", ring: "#ffa41b" },
  4: { label: "Mint", text: "text-mint", ring: "#57d9a3" },
};

export const BADGES = [
  { id: "first_steps", name: "First Steps", desc: "Complete your first lesson", tier: 1, motif: "paw" },
  { id: "settled", name: "Full Commitment", desc: "Pay a course plan in full", tier: 1, motif: "naira" },
  { id: "community", name: "Pack Member", desc: "RSVP to a meetup", tier: 1, motif: "bridge" },
  { id: "module_master", name: "Module Master", desc: "Finish every unit in a module", tier: 2, motif: "shield" },
  { id: "gate_keeper", name: "Gate Keeper", desc: "Pass a gate quiz", tier: 2, motif: "key" },
  { id: "streak_7", name: "Seven Nights", desc: "Learn 7 days in a row", tier: 2, motif: "flame" },
  { id: "mentored", name: "Guided Path", desc: "Start an agreed mentorship", tier: 2, motif: "compass" },
  { id: "perfect_gate", name: "Flawless Gate", desc: "Score 100% on a gate quiz", tier: 3, motif: "seal" },
  { id: "course_conqueror", name: "Course Conqueror", desc: "Complete an entire course", tier: 3, motif: "laurel" },
  { id: "streak_30", name: "Lair Legend", desc: "Learn 30 days in a row", tier: 4, motif: "bolt" },
  { id: "certified", name: "Certified Tiger", desc: "Earn a verified certificate", tier: 4, motif: "tiger" },
  { id: "voice", name: "Lair Voice", desc: "Speak at a meetup or session", tier: 3, motif: "mic" },
] as const;

export const BADGE_MAP: Record<string, any> = Object.fromEntries(BADGES.map(b => [b.id, b]));

/** 64×64 hex emblem with tier ring + motif */
export function BadgeMedal({ badge, locked = false, size = 64, className = "" }: any) {
  const Motif = MOTIFS[badge.motif] || IconPaw;
  const tier = TIERS[badge.tier];
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`} 
      style={{ width: size, height: size }} 
      title={locked ? badge.desc : badge.name}
    >
      <svg 
        viewBox="0 0 64 64" 
        className={`absolute inset-0 ${tier.text} ${locked ? "opacity-30 grayscale" : ""}`} 
        fill="none" 
        stroke="currentColor" 
        strokeWidth={3} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        aria-hidden="true"
      >
        <path d="M32 4l24 14v28L32 60 8 46V18z" strokeDasharray={locked ? "4 5" : undefined} />
        <path d="M32 4v5 M56 18l-4.5 2.5 M56 46l-4.5-2.5 M32 60v-5 M8 46l4.5-2.5 M8 18l4.5 2.5" opacity={locked ? 0.4 : 0.8} />
      </svg>
      <div className={`relative ${tier.text} ${locked ? "opacity-30 grayscale" : ""}`} style={{ width: size * 0.42, height: size * 0.42 }}>
        <Motif className="h-full w-full" />
      </div>
    </div>
  );
}

/** Grid shelf: earned first, locked after */
export function BadgeShelf({ earned }: { earned: Record<string, number> }) {
  const list = [...BADGES].sort((a, b) => {
    const ea = earned[a.id] ? 1 : 0, eb = earned[b.id] ? 1 : 0;
    return eb - ea || b.tier - a.tier;
  });
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
      {list.map(b => (
        <div 
          key={b.id} 
          className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors ${
            earned[b.id] ? "border-bone/15 bg-coal" : "border-bone/5 bg-coal/40"
          }`}
        >
          <BadgeMedal badge={b} locked={!earned[b.id]} size={56} className={earned[b.id] ? "badge-earn" : ""} />
          <p className={`text-xs font-bold ${earned[b.id] ? "text-bone" : "text-smoke/60"}`}>{b.name}</p>
          <p className="text-[10px] leading-tight text-smoke/70">
            {earned[b.id] ? `Earned ${new Date(earned[b.id]).toLocaleDateString()}` : b.desc}
          </p>
        </div>
      ))}
    </div>
  );
}