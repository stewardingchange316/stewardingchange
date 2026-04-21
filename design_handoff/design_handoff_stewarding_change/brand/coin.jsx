// Stewarding Change — Brand Identity Sheet components
// Hero: 3D coin with milled edge + glowing S-bolt.
// Plus flat logo variants, app icons, palette, typography, phone mockup.

const PAL = {
  bg:       '#060D24',  // page background, near-black navy
  bgDeep:   '#040917',
  navy1:    '#0B1F3A',
  navy2:    '#1E3A8A',
  blue:     '#2563EB',
  bright:   '#4F8FF7',
  sky:      '#60A5FA',
  ice:      '#E6F0FF',
  white:    '#FFFFFF',
  text:     '#FFFFFF',
  textDim:  '#B8C4DD',
  textMute: '#6B7BA3',
  border:   'rgba(96,165,250,0.14)',
};

// ============================================================================
// The S / Lightning-Bolt path — shared across 3D and flat marks.
// Drawn within a 200x200 viewBox, centered.
// ============================================================================
const BOLT_PATH = `
  M 122 38
  L 74 108
  Q 70 114, 78 114
  L 104 114
  L 76 164
  Q 72 170, 80 166
  L 132 98
  Q 136 92, 128 92
  L 102 92
  Z
`;

function Bolt({ fill='#4F8FF7', highlight='#7FB1FF', shine=true }) {
  const id = `bolt-${Math.random().toString(36).slice(2,7)}`;
  return (
    <g>
      <defs>
        {shine && (
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={highlight}/>
            <stop offset="0.5" stopColor={fill}/>
            <stop offset="1" stopColor={fill}/>
          </linearGradient>
        )}
      </defs>
      <path d={BOLT_PATH} fill={shine ? `url(#${id}-g)` : fill}/>
    </g>
  );
}

// ============================================================================
// 3D COIN — perspective ellipse stack, milled edge (radial tick marks),
// glowing face, bolt with glow.
// ============================================================================
function Coin3D({ size = 440 }) {
  const id = `c3-${Math.random().toString(36).slice(2,7)}`;
  // viewBox 500x500. Coin tilted ~22°: face is an ellipse rx=190 ry=178.
  // Edge thickness = 40 (offset bottom face below top).
  return (
    <svg width={size} height={size} viewBox="0 0 500 500" style={{display:'block', overflow:'visible'}}>
      <defs>
        {/* outer glow */}
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.55">
          <stop offset="0" stopColor="#2563EB" stopOpacity="0.55"/>
          <stop offset="0.6" stopColor="#1E3A8A" stopOpacity="0.18"/>
          <stop offset="1" stopColor="#0B1F3A" stopOpacity="0"/>
        </radialGradient>
        {/* coin face gradient — dark navy with highlight top-left */}
        <radialGradient id={`${id}-face`} cx="0.32" cy="0.22" r="0.95">
          <stop offset="0" stopColor="#3B6FE0"/>
          <stop offset="0.35" stopColor="#1B3FA6"/>
          <stop offset="0.75" stopColor="#0B1F3A"/>
          <stop offset="1" stopColor="#060D24"/>
        </radialGradient>
        {/* edge (side wall) gradient */}
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1B3FA6"/>
          <stop offset="0.5" stopColor="#0B1F3A"/>
          <stop offset="1" stopColor="#1B3FA6"/>
        </linearGradient>
        {/* rim highlight (thin bright ring around face) */}
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7FB1FF"/>
          <stop offset="1" stopColor="#2563EB"/>
        </linearGradient>
        {/* bolt gradient */}
        <linearGradient id={`${id}-bolt`} x1="0.2" y1="0.1" x2="0.8" y2="0.9">
          <stop offset="0" stopColor="#9CC2FF"/>
          <stop offset="0.5" stopColor="#4F8FF7"/>
          <stop offset="1" stopColor="#1E3A8A"/>
        </linearGradient>
        {/* bolt glow filter */}
        <filter id={`${id}-boltglow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* clip for the face ellipse so bolt stays on-coin */}
        <clipPath id={`${id}-faceclip`}>
          <ellipse cx="250" cy="246" rx="190" ry="178"/>
        </clipPath>
      </defs>

      {/* outer glow halo */}
      <ellipse cx="250" cy="260" rx="240" ry="220" fill={`url(#${id}-glow)`}/>

      {/* ===== EDGE (side wall) ===== */}
      {/* back ellipse (coin bottom face), shifted down */}
      <ellipse cx="250" cy="290" rx="190" ry="178" fill="#060D24"/>
      {/* fill wall between bottom and top */}
      <path d={`
        M 60 246
        A 190 178 0 0 0 440 246
        L 440 290
        A 190 178 0 0 1 60 290
        Z
      `} fill={`url(#${id}-edge)`}/>

      {/* milled edge — radial ticks */}
      <g clipPath={`url(#${id}-faceclip-wall)`} opacity="0.65">
        {Array.from({length: 60}).map((_,i) => {
          const t = i / 60;
          const angle = Math.PI * t; // 0..PI along bottom half
          const x1 = 250 + Math.cos(angle) * 190;
          const y1 = 246 + Math.sin(angle) * 178;
          const x2 = x1;
          const y2 = y1 + 44;
          // only draw the visible bottom half
          if (Math.sin(angle) < 0.05) return null;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#7FB1FF" strokeOpacity={0.35 + 0.25*Math.sin(angle)} strokeWidth="1.2"/>;
        })}
      </g>

      {/* ===== FACE ===== */}
      <ellipse cx="250" cy="246" rx="190" ry="178" fill={`url(#${id}-face)`}/>
      {/* rim highlight (bright thin stroke) */}
      <ellipse cx="250" cy="246" rx="188" ry="176" fill="none"
        stroke={`url(#${id}-rim)`} strokeWidth="2.5" opacity="0.75"/>
      {/* inner darker ring for depth */}
      <ellipse cx="250" cy="246" rx="170" ry="160" fill="none"
        stroke="#000" strokeOpacity="0.25" strokeWidth="1"/>
      {/* subtle top highlight on face */}
      <ellipse cx="200" cy="150" rx="120" ry="40" fill="#7FB1FF" opacity="0.14"/>

      {/* ===== BOLT (with glow) ===== */}
      <g transform="translate(150 146) scale(1)" clipPath={`url(#${id}-faceclip)`}>
        <g filter={`url(#${id}-boltglow)`}>
          <path d={BOLT_PATH} fill="#2563EB" opacity="0.5" transform="translate(0 0) scale(1)"/>
        </g>
      </g>
      <g transform="translate(150 146)">
        <path d={BOLT_PATH} fill={`url(#${id}-bolt)`}/>
        {/* bolt rim highlight */}
        <path d={BOLT_PATH} fill="none" stroke="#BFD8FF" strokeOpacity="0.4" strokeWidth="1"/>
      </g>
    </svg>
  );
}

// ============================================================================
// FLAT MARK — navy coin with flat bolt (for logo variation row, app icon)
// ============================================================================
function FlatMark({ size=120, variant='navy-filled' }) {
  const id = `fm-${Math.random().toString(36).slice(2,7)}`;
  if (variant==='navy-outline') {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" style={{display:'block'}}>
        <circle cx="100" cy="100" r="92" fill="none" stroke="#FFFFFF" strokeWidth="6"/>
        <path d={BOLT_PATH} fill="#FFFFFF"/>
      </svg>
    );
  }
  if (variant==='bolt-only') {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" style={{display:'block'}}>
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7FB1FF"/>
            <stop offset="1" stopColor="#1E3A8A"/>
          </linearGradient>
        </defs>
        <path d={BOLT_PATH} fill={`url(#${id}-g)`}/>
      </svg>
    );
  }
  if (variant==='white-filled') {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" style={{display:'block'}}>
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#E6F0FF"/>
            <stop offset="1" stopColor="#B8CEF5"/>
          </linearGradient>
          <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4F8FF7"/>
            <stop offset="1" stopColor="#1E3A8A"/>
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="92" fill={`url(#${id}-g)`}/>
        <circle cx="100" cy="100" r="84" fill="none" stroke="#1E3A8A" strokeOpacity="0.22" strokeWidth="1"/>
        <path d={BOLT_PATH} fill={`url(#${id}-b)`}/>
      </svg>
    );
  }
  // navy-filled (default)
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{display:'block'}}>
      <defs>
        <radialGradient id={`${id}-g`} cx="0.3" cy="0.25" r="0.9">
          <stop offset="0" stopColor="#1E3A8A"/>
          <stop offset="0.6" stopColor="#0B1F3A"/>
          <stop offset="1" stopColor="#060D24"/>
        </radialGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7FB1FF"/>
          <stop offset="0.5" stopColor="#4F8FF7"/>
          <stop offset="1" stopColor="#1E3A8A"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill={`url(#${id}-g)`}/>
      <circle cx="100" cy="100" r="88" fill="none" stroke="#4F8FF7" strokeOpacity="0.4" strokeWidth="1.5"/>
      <path d={BOLT_PATH} fill={`url(#${id}-b)`}/>
    </svg>
  );
}

Object.assign(window, { Coin3D, FlatMark, Bolt, BOLT_PATH, PAL });
