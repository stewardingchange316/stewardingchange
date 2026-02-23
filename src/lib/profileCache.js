/**
 * Thin localStorage cache for the user's onboarding_step.
 *
 * Shared between RequireAuth (reads on mount + Phase 2 navigation guard)
 * and onboarding pages (write before navigate so RequireAuth never sees
 * a stale DB value on the critical routing render).
 *
 * Security: this cache is a rendering hint only. Supabase RLS enforces
 * actual data access. A tampered cache entry cannot grant real data access.
 *
 * Only the "done" value is trusted for instant rendering in RequireAuth.
 * All other steps still trigger a fresh DB fetch on navigation.
 */

const CACHE_KEY = "sc_profile_v1";

export function readProfileCache(userId) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.userId !== userId) return null;
    return parsed.step ?? null;
  } catch {
    return null;
  }
}

export function writeProfileCache(userId, step) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, step }));
  } catch {}
}

export function clearProfileCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}
