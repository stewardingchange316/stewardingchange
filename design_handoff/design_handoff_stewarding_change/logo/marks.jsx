// Stewarding Change — S-Bolt mark, three geometric constructions.
// Each is a lightning bolt doubling as a stylized "S" inside a navy coin.
// Navy + electric blue only. Crisp, minimal, $100M fintech-grade.

const PALETTE = {
  navy:'#0A1F4C', deep:'#091838', blue:'#1B3FA6',
  electric:'#2E6BFF', bright:'#4D8BFF', sky:'#7FB1FF',
  ice:'#E7EEFB', white:'#FFFFFF',
};

// ── V1: CLASSIC BOLT — two-segment lightning, equal weight, sharp tips.
//    Closest to the reference.
function V1Bolt({ color='#6FA8FF', accent='#FFFFFF' }) {
  return (
    <g>
      {/* bolt — single continuous shape, S-like zig */}
      <path d="M 118 42
               L 78 100
               L 106 100
               L 82 158
               L 130 92
               L 102 92
               Z"
        fill={color}/>
      {/* inner highlight on upper half */}
      <path d="M 118 42 L 78 100 L 106 100 L 104 106 L 114 48 Z"
        fill={accent} fillOpacity="0.32"/>
    </g>
  );
}

// ── V2: CHISELED BOLT — narrower, more upright, with a subtle bevel
//    split (two-tone) to read as engraved/stamped.
function V2Bolt({ color='#6FA8FF', accent='#FFFFFF' }) {
  return (
    <g>
      <path d="M 120 40
               L 80 104
               L 100 104
               L 80 162
               L 124 96
               L 104 96
               Z"
        fill={color}/>
      {/* bevel — left half darker / right half lighter */}
      <path d="M 120 40 L 80 104 L 100 104 L 96 112 L 108 64 Z"
        fill={accent} fillOpacity="0.45"/>
      <path d="M 80 162 L 124 96 L 104 96 L 100 104 L 96 112 Z"
        fill="#000" fillOpacity="0.18"/>
    </g>
  );
}

// ── V3: RIBBON BOLT — thicker, smoother corners, feels more modern/curved.
//    The bolt reads almost like an italic S.
function V3Bolt({ color='#6FA8FF', accent='#FFFFFF' }) {
  return (
    <g>
      <path d="M 126 38
               L 74 106
               Q 70 112, 78 112
               L 104 112
               L 74 164
               Q 70 170, 78 166
               L 132 94
               Q 136 88, 128 88
               L 102 88
               Z"
        fill={color}/>
      <path d="M 126 38 L 74 106 Q 70 112, 78 112 L 102 112 L 108 102 L 118 54 Z"
        fill={accent} fillOpacity="0.28"/>
    </g>
  );
}

// ── Coin container — solid navy, subtle radial glow for depth, thin inner ring.
function CoinNavy({ size=200, children, glow=true }) {
  const id = `nv-${Math.random().toString(36).slice(2,7)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{display:'block'}}>
      <defs>
        {glow && (
          <radialGradient id={`${id}-g`} cx="0.5" cy="0.5" r="0.55">
            <stop offset="0" stopColor="#1B3FA6" stopOpacity="1"/>
            <stop offset="0.55" stopColor="#0A1F4C" stopOpacity="1"/>
            <stop offset="1" stopColor="#060E2B" stopOpacity="1"/>
          </radialGradient>
        )}
        <radialGradient id={`${id}-hl`} cx="0.3" cy="0.22" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.18"/>
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="96"
        fill={glow ? `url(#${id}-g)` : '#0A1F4C'}/>
      <circle cx="100" cy="100" r="96" fill={`url(#${id}-hl)`}/>
      <circle cx="100" cy="100" r="84" fill="none"
        stroke="#6FA8FF" strokeOpacity="0.22" strokeWidth="1"/>
      {children}
    </svg>
  );
}

// ── Coin container — white/ice for light backgrounds.
function CoinLight({ size=200, children, tone='ice' }) {
  const bg = tone==='white' ? '#FFFFFF' : '#E7EEFB';
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{display:'block'}}>
      <circle cx="100" cy="100" r="96" fill={bg}/>
      <circle cx="100" cy="100" r="84" fill="none" stroke="#0A1F4C" strokeOpacity="0.14" strokeWidth="1"/>
      {children}
    </svg>
  );
}

// ── Coin container — gradient (electric blue) for hero / app icon
function CoinGradient({ size=200, children }) {
  const id = `gr-${Math.random().toString(36).slice(2,7)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{display:'block'}}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2E6BFF"/>
          <stop offset="1" stopColor="#0A1F4C"/>
        </linearGradient>
        <radialGradient id={`${id}-hl`} cx="0.3" cy="0.22" r="0.7">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.3"/>
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill={`url(#${id}-g)`}/>
      <circle cx="100" cy="100" r="96" fill={`url(#${id}-hl)`}/>
      <circle cx="100" cy="100" r="84" fill="none" stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth="1"/>
      {children}
    </svg>
  );
}

// ── Public: compose bolt + coin. variant controls palette.
function Mark({ bolt='v1', size=200, variant='navy' }) {
  const Bolt = bolt==='v1' ? V1Bolt : bolt==='v2' ? V2Bolt : V3Bolt;
  if (variant==='gradient') {
    return <CoinGradient size={size}><Bolt color="#FFFFFF" accent="#FFFFFF"/></CoinGradient>;
  }
  if (variant==='white') {
    return <CoinLight size={size} tone="white"><Bolt color="#0A1F4C" accent="#2E6BFF"/></CoinLight>;
  }
  if (variant==='ice') {
    return <CoinLight size={size} tone="ice"><Bolt color="#0A1F4C" accent="#2E6BFF"/></CoinLight>;
  }
  if (variant==='mono-dark') {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" style={{display:'block'}}>
        <circle cx="100" cy="100" r="96" fill="#0A1F4C"/>
        <Bolt color="#FFFFFF" accent="#FFFFFF"/>
      </svg>
    );
  }
  // default: navy coin with electric bolt
  return <CoinNavy size={size}><Bolt color="#6FA8FF" accent="#FFFFFF"/></CoinNavy>;
}

// ── Wordmark lockup
function Wordmark({ bolt='v1', size=64, variant='navy', light=false }) {
  const color = light ? '#FFFFFF' : '#0A1F4C';
  return (
    <div style={{display:'inline-flex', alignItems:'center', gap: size*0.36}}>
      <div style={{height:size, width:size}}>
        <Mark bolt={bolt} size={size} variant={variant}/>
      </div>
      <div style={{display:'flex', flexDirection:'column', lineHeight:0.95}}>
        <span style={{
          fontFamily:'Inter, sans-serif', fontSize: size*0.44, fontWeight:600,
          letterSpacing:'-0.02em', color,
        }}>Stewarding</span>
        <span style={{
          fontFamily:'Inter, sans-serif', fontSize: size*0.44, fontWeight:600,
          letterSpacing:'-0.02em', color: light ? '#6FA8FF' : '#2E6BFF',
        }}>Change</span>
      </div>
    </div>
  );
}

Object.assign(window, { Mark, Wordmark, PALETTE });
