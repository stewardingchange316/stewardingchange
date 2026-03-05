import { supabase } from "../lib/supabase";

// ── Badge criteria ────────────────────────────────────────────────────────────
// Each function receives a context object and returns true if the badge is earned.
// totalGiven and roundUpCount stub to 0 until the payment processor is wired up.

const BADGE_CRITERIA = {
  first_fruits: (ctx) => ctx.roundUpCount >= 1,

  connected_steward: (ctx) => ctx.bankConnected === true,

  first_impact: (ctx) => ctx.totalGiven >= 5,

  "7_day_steward": (ctx) => {
    if (!ctx.joinedAt) return false;
    return Date.now() - new Date(ctx.joinedAt).getTime() >= 7 * 24 * 60 * 60 * 1000;
  },

  faithful_steward: (ctx) => {
    if (!ctx.joinedAt) return false;
    return Date.now() - new Date(ctx.joinedAt).getTime() >= 30 * 24 * 60 * 60 * 1000;
  },

  steadfast_steward: (ctx) => {
    if (!ctx.joinedAt) return false;
    return Date.now() - new Date(ctx.joinedAt).getTime() >= 90 * 24 * 60 * 60 * 1000;
  },

  kingdom_builder: (ctx) => ctx.totalGiven >= 100,
};

// ── Badge display config (mirrors DB seed, used by BadgesModal) ───────────────

export const BADGE_DISPLAY = [
  { id: "first_fruits",      emoji: "🌱", name: "First Fruits",      desc: "Made your first round-up donation." },
  { id: "connected_steward", emoji: "🔗", name: "Connected Steward", desc: "Connected your bank account." },
  { id: "first_impact",      emoji: "✨", name: "First Impact",      desc: "Donated $5 or more in total round-ups." },
  { id: "7_day_steward",     emoji: "🙌", name: "7 Day Steward",     desc: "Your account is at least 7 days old." },
  { id: "faithful_steward",  emoji: "🙏", name: "Faithful Steward",  desc: "Your account is at least 30 days old." },
  { id: "steadfast_steward", emoji: "⛪", name: "Steadfast Steward", desc: "Your account is at least 90 days old." },
  { id: "kingdom_builder",   emoji: "👑", name: "Kingdom Builder",   desc: "Donated $100 or more in total round-ups." },
];

// ── Internal: load context for badge evaluation ───────────────────────────────

async function loadContext(userId) {
  const [{ data: profile, error: pErr }, { data: earned, error: eErr }] =
    await Promise.all([
      supabase
        .from("users")
        .select("church_id, created_at, bank_connected")
        .eq("id", userId)
        .single(),
      supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", userId),
    ]);

  if (pErr || eErr) {
    console.error("[badgeService] loadContext error", pErr ?? eErr);
    return null;
  }

  // TODO: replace stubs with real queries once payment processor is live
  // const { data: txData } = await supabase.rpc("get_user_giving_summary", { p_user_id: userId });
  const totalGiven   = 0;
  const roundUpCount = 0;

  return {
    totalGiven,
    roundUpCount,
    bankConnected: profile.bank_connected ?? false,
    joinedAt:      profile.created_at,
    churchId:      profile.church_id,
    earnedIds:     new Set((earned ?? []).map((r) => r.badge_id)),
  };
}

// ── checkAndAwardBadges ───────────────────────────────────────────────────────
// Safe to call on every dashboard load — awards are idempotent (ON CONFLICT DO NOTHING).
// Returns array of newly-awarded badge IDs.

export async function checkAndAwardBadges(userId) {
  const ctx = await loadContext(userId);
  if (!ctx) return [];

  const { data: settingsRow } = await supabase
    .from("user_badge_settings")
    .select("show_on_feed")
    .eq("user_id", userId)
    .maybeSingle();

  const showOnFeed = settingsRow?.show_on_feed ?? true;
  const newlyAwarded = [];

  for (const [badgeId, criteriaFn] of Object.entries(BADGE_CRITERIA)) {
    if (ctx.earnedIds.has(badgeId)) continue;
    if (!criteriaFn(ctx)) continue;

    const { error: awardErr } = await supabase.rpc("award_badge", {
      p_user_id:  userId,
      p_badge_id: badgeId,
    });

    if (awardErr) {
      console.error(`[badgeService] award_badge failed for ${badgeId}:`, awardErr);
      continue;
    }

    newlyAwarded.push(badgeId);

    // Post to feed if user has a church and privacy allows
    if (ctx.churchId && showOnFeed) {
      const display = BADGE_DISPLAY.find((b) => b.id === badgeId);
      if (display) {
        await supabase.rpc("create_feed_post", {
          p_church_id: ctx.churchId,
          p_user_id:   userId,
          p_post_type: "badge",
          p_body:      `Earned the "${display.name}" badge — ${display.desc}`,
          p_badge_id:  badgeId,
        });
      }
    }
  }

  return newlyAwarded;
}

// ── getUserBadges ─────────────────────────────────────────────────────────────
// Returns array of { id, emoji, name, desc, earned, awardedAt } in display order.

export async function getUserBadges(userId) {
  const { data: earned } = await supabase
    .from("user_badges")
    .select("badge_id, awarded_at")
    .eq("user_id", userId);

  const earnedMap = new Map((earned ?? []).map((r) => [r.badge_id, r.awarded_at]));

  return BADGE_DISPLAY.map((b) => ({
    ...b,
    earned:    earnedMap.has(b.id),
    awardedAt: earnedMap.get(b.id) ?? null,
  }));
}

// ── getBadgeSettings / setBadgeSettings ───────────────────────────────────────

export async function getBadgeSettings(userId) {
  const { data } = await supabase
    .from("user_badge_settings")
    .select("show_on_feed")
    .eq("user_id", userId)
    .maybeSingle();

  return { showOnFeed: data?.show_on_feed ?? true };
}

export async function setBadgeSettings(userId, showOnFeed) {
  const { error } = await supabase
    .from("user_badge_settings")
    .upsert(
      { user_id: userId, show_on_feed: showOnFeed, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) console.error("[badgeService] setBadgeSettings error:", error);
}
