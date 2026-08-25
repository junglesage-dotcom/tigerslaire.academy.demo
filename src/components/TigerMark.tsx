export function TigerMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label="The Tiger's Lair mark — a screen-print tiger face">
      <defs>
        <filter id="grit">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite operator="over" in2="SourceGraphic" />
        </filter>
      </defs>

      <rect width="400" height="400" fill="#e9dbc0" />
      {/* halo ring */}
      <circle cx="200" cy="205" r="150" fill="none" stroke="#1c1408" strokeWidth="3" strokeDasharray="2 10" opacity="0.5" />

      <g filter="url(#grit)">
        {/* ears */}
        <path d="M96 118 Q88 52 148 62 Q176 68 178 96 Q140 100 96 118Z" fill="#1c1408" />
        <path d="M304 118 Q312 52 252 62 Q224 68 222 96 Q260 100 304 118Z" fill="#1c1408" />
        <path d="M112 106 Q110 72 142 76 Q158 80 160 94 Q136 96 112 106Z" fill="#ff6b3d" />
        <path d="M288 106 Q290 72 258 76 Q242 80 240 94 Q264 96 288 106Z" fill="#ff6b3d" />

        {/* head */}
        <path
          d="M200 74 C278 74 330 142 330 212 C330 292 276 348 200 348 C124 348 70 292 70 212 C70 142 122 74 200 74Z"
          fill="#ffa41b"
        />

        {/* forehead stripes */}
        <path d="M200 74 L214 132 Q200 148 186 132 Z" fill="#1c1408" />
        <path d="M158 84 Q170 118 162 138 L150 128 Q150 104 144 92 Z" fill="#1c1408" />
        <path d="M242 84 Q230 118 238 138 L250 128 Q250 104 256 92 Z" fill="#1c1408" />

        {/* cheek stripes left */}
        <path d="M74 196 Q112 204 128 220 L114 232 Q92 216 72 214 Z" fill="#1c1408" />
        <path d="M80 244 Q112 246 130 258 L120 272 Q98 262 82 262 Z" fill="#1c1408" />
        <path d="M98 292 Q124 288 142 296 L134 312 Q116 306 104 308 Z" fill="#1c1408" />
        {/* cheek stripes right */}
        <path d="M326 196 Q288 204 272 220 L286 232 Q308 216 328 214 Z" fill="#1c1408" />
        <path d="M320 244 Q288 246 270 258 L280 272 Q302 262 318 262 Z" fill="#1c1408" />
        <path d="M302 292 Q276 288 258 296 L266 312 Q284 306 296 308 Z" fill="#1c1408" />

        {/* brow stripes */}
        <path d="M120 156 Q148 146 172 152 L168 166 Q146 162 128 170 Z" fill="#1c1408" />
        <path d="M280 156 Q252 146 228 152 L232 166 Q254 162 272 170 Z" fill="#1c1408" />

        {/* eyes */}
        <path d="M128 196 Q155 178 182 194 Q160 216 130 210 Z" fill="#f2e8d5" />
        <path d="M272 196 Q245 178 218 194 Q240 216 270 210 Z" fill="#f2e8d5" />
        <circle cx="158" cy="197" r="9" fill="#1c1408" />
        <circle cx="242" cy="197" r="9" fill="#1c1408" />
        <circle cx="161" cy="194" r="2.6" fill="#f2e8d5" />
        <circle cx="245" cy="194" r="2.6" fill="#f2e8d5" />

        {/* muzzle */}
        <ellipse cx="200" cy="280" rx="64" ry="50" fill="#f2e8d5" />
        <path d="M200 246 L218 264 Q200 280 182 264 Z" fill="#1c1408" />
        <path d="M200 280 L200 294 M200 294 Q186 306 172 296 M200 294 Q214 306 228 296" fill="none" stroke="#1c1408" strokeWidth="5" strokeLinecap="round" />
        {/* whisker dots */}
        <circle cx="168" cy="272" r="2.4" fill="#1c1408" />
        <circle cx="160" cy="284" r="2.4" fill="#1c1408" />
        <circle cx="170" cy="294" r="2.4" fill="#1c1408" />
        <circle cx="232" cy="272" r="2.4" fill="#1c1408" />
        <circle cx="240" cy="284" r="2.4" fill="#1c1408" />
        <circle cx="230" cy="294" r="2.4" fill="#1c1408" />

        {/* chin stripes */}
        <path d="M176 336 Q188 328 200 336 Q212 328 224 336 L218 348 Q200 342 182 348 Z" fill="#1c1408" />
      </g>
    </svg>
  );
}
