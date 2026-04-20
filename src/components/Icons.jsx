/**
 * Clean monoline SVG icons replacing emojis throughout the app.
 * All icons use currentColor so they inherit the parent's text color.
 */

// ── Badge icons ──────────────────────────────────────────────────────────────

export function IconSeedling({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V10" />
      <path d="M6 14c0-4 3-6 6-8 3 2 6 4 6 8" />
      <path d="M6 14c0-2.5 2.7-4.5 6-4.5S18 11.5 18 14" />
    </svg>
  );
}

export function IconLink({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function IconSparkles({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
      <path d="M18 14l.7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14z" />
    </svg>
  );
}

export function IconHandsRaised({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 11V4a1 1 0 0 1 2 0v5" />
      <path d="M15 11V4a1 1 0 0 1 2 0v5" />
      <path d="M5 11V7a1 1 0 0 1 2 0v4" />
      <path d="M17 11V7a1 1 0 0 1 2 0v4" />
      <path d="M5 11c0 6 3 9 7 9s7-3 7-9" />
    </svg>
  );
}

export function IconPrayer({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c1-2 4-4 4-8V6c0-1.1-.9-2-2-2h-4a2 2 0 0 0-2 2v8c0 4 3 6 4 8z" />
      <path d="M8 6h8" />
      <path d="M12 6v10" />
    </svg>
  );
}

export function IconChurch({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4" />
      <path d="M10 4h4" />
      <path d="M5 21V10l7-4 7 4v11" />
      <path d="M9 21v-5a3 3 0 0 1 6 0v5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function IconCrown({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18l3-10 5 4 2-8 2 8 5-4 3 10H2z" />
      <path d="M2 18h20v2H2z" />
    </svg>
  );
}

// ── UI icons ─────────────────────────────────────────────────────────────────

export function IconFlame({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c-4 0-7-3-7-7.5 0-3.5 2-6 4-8.5 1 2.5 2.5 3.5 3 3.5.5 0 1-.5 1.5-2 1.5 2 4 5 4 7C17.5 19 15.5 22 12 22z" />
      <path d="M12 22c-1.5 0-3-1.5-3-3.5 0-1.5 1-3 2-4 .5 1 1 1.5 1 1.5s.5-1 1-2c.8 1 2 2.5 2 4.5 0 2-1.5 3.5-3 3.5z" />
    </svg>
  );
}

export function IconMedal({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="15" r="6" />
      <path d="M8.5 2h7l-2 6h-3l-2-6z" />
      <path d="M12 12v-1" />
      <path d="M12 18v-1" />
    </svg>
  );
}

export function IconCheck({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function IconCheckCircle({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="16 9 10.5 14.5 8 12" />
    </svg>
  );
}

export function IconParty({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.8 11.3L2 22l10.7-3.8" />
      <path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01M18 5l-1 1M21 12l-1 .5M4 7l1 .5" />
      <path d="M9 12l3 3" />
      <path d="M12 9l3 3" />
      <path d="M5.8 11.3c3.3-3.3 7.5-4.6 9.4-2.8 1.8 1.9.5 6.1-2.8 9.4" />
    </svg>
  );
}

export function IconPencil({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

export function IconSignOut({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function IconEyeOpen({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconEyeClosed({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.6-1.42 1.47-2.73 2.57-3.86M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a10.96 10.96 0 0 1-4.08 5.08M1 1l22 22" />
    </svg>
  );
}

// ── Social reaction icons ────────────────────────────────────────────────────

export function IconHeart({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function IconThumbsUp({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-6 0v4" />
      <path d="M4 12h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z" />
      <path d="M8 12l2-2h3.17a2 2 0 0 1 1.9 1.37l1.42 4.27A2 2 0 0 1 14.6 18H10a2 2 0 0 1-2-2v-4z" />
    </svg>
  );
}

// ── Badge icon map (keyed by badge ID) ───────────────────────────────────────

const BADGE_ICON_MAP = {
  first_fruits:      IconSeedling,
  connected_steward: IconLink,
  first_impact:      IconSparkles,
  "7_day_steward":   IconHandsRaised,
  faithful_steward:  IconPrayer,
  steadfast_steward: IconChurch,
  kingdom_builder:   IconCrown,
};

export function BadgeIcon({ badgeId, size = 28 }) {
  const Icon = BADGE_ICON_MAP[badgeId];
  if (!Icon) return null;
  return <Icon size={size} />;
}
