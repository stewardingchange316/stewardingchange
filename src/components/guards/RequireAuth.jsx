import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

// ─── Static route tables ─────────────────────────────────────────────────────

const STEP_TO_ROUTE = {
  church: "/church-select",
  cap:    "/giving-cap",
  bank:   "/bank",
};

const ONBOARDING_ROUTES = new Set(Object.values(STEP_TO_ROUTE));

const BYPASS_ROUTES = new Set(["/verified"]);

// ─── Local profile cache ──────────────────────────────────────────────────────
//
// Stores { userId, step } in localStorage so returning users with
// onboarding_step "done" can be identified instantly without any network call.
//
// Security model: this cache is used ONLY as an optimistic hint for rendering.
// The session is always validated server-side in the background; if validation
// fails the cache is cleared and the user is redirected to sign-in.
//
// We only trust the cache when step === "done", because that transition is
// permanent and irreversible. All other steps must still fetch from the DB
// because they change as the user progresses through onboarding.
//
const CACHE_KEY = "sc_profile_v1";

function readProfileCache(userId) {
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

function writeProfileCache(userId, step) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, step }));
  } catch {}
}

function clearProfileCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}

// ─── Pure async helpers ───────────────────────────────────────────────────────

/**
 * Server-verified auth user. Always makes a network call.
 * Use this when security matters (not on the hot render path).
 */
async function getVerifiedUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Fast local session read. Reads from localStorage; no network call unless
 * the access token is expired (in which case Supabase refreshes it).
 * Returns the session user, or null if no session exists.
 */
async function getLocalSessionUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

async function fetchProfileRow(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("id, onboarding_step")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[RequireAuth] fetchProfileRow error:", error);
    return null;
  }
  return data ?? null;
}

async function createProfileRow(authUser) {
  const { error } = await supabase
    .from("users")
    .upsert(
      {
        id:              authUser.id,
        email:           authUser.email,
        first_name:      authUser.user_metadata?.first_name ?? null,
        last_name:       authUser.user_metadata?.last_name  ?? null,
        phone:           authUser.user_metadata?.phone      ?? null,
        onboarding_step: "church",
        church_id:       null,
        weekly_cap:      null,
        bank_connected:  false,
      },
      { onConflict: "id" }
    );

  if (error) {
    console.error("[RequireAuth] createProfileRow error:", error);
    return null;
  }
  return { id: authUser.id, onboarding_step: "church" };
}

async function resolveProfile(authUser) {
  const existing = await fetchProfileRow(authUser.id);
  return existing ?? createProfileRow(authUser);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RequireAuth() {
  const location = useLocation();

  /**
   * `undefined` = in-flight (show loading gate).
   * `null`      = resolved: not present (unauthenticated / no profile).
   * object      = resolved: ready.
   *
   * The single gate `user === undefined || profile === undefined` blocks ALL
   * routing decisions until both values are settled — whether from the fast
   * optimistic path or the full network load.
   */
  const [user,    setUser]    = useState(undefined);
  const [profile, setProfile] = useState(undefined);

  /**
   * Tracks which (userId, pathname) pair was last fully fetched so Phase 2
   * can skip duplicate fetches after Phase 1 runs for the same path.
   */
  const lastFetchRef = useRef({ userId: null, pathname: null });

  const mountedRef = useRef(true);

  // ── Phase 1: Bootstrap ───────────────────────────────────────────────────────
  //
  // Two paths through bootstrap:
  //
  // FAST PATH — returning users with onboarding_step "done":
  //   1. getLocalSessionUser()  ← localStorage read, ~0 ms (no network for
  //                               non-expired tokens)
  //   2. readProfileCache()     ← sync localStorage read, ~0 ms
  //   3. If cache === "done":   render immediately, no loading flash
  //   4. Background:           getVerifiedUser() to validate the session
  //                             server-side; kick out if invalid
  //
  // FULL PATH — new users or users still in onboarding:
  //   1. getVerifiedUser()      ← network call, validates JWT server-side
  //   2. resolveProfile()       ← DB query, fetches / creates the profile row
  //   3. writeProfileCache()    ← saves step so next visit uses fast path
  //   (user sees loading spinner during these two calls)
  //
  useEffect(() => {
    mountedRef.current = true;

    async function bootstrap() {
      // ── Fast path ──────────────────────────────────────────────────────────
      const sessionUser = await getLocalSessionUser();
      if (!mountedRef.current) return;

      if (!sessionUser) {
        // No local session at all — definitively unauthenticated.
        setUser(null);
        setProfile(null);
        return;
      }

      const cachedStep = readProfileCache(sessionUser.id);

      if (cachedStep === "done") {
        // We know this user has completed onboarding. Render the dashboard
        // immediately using the locally cached data. No network call needed
        // on the critical render path.
        lastFetchRef.current = { userId: sessionUser.id, pathname: location.pathname };
        setUser(sessionUser);
        setProfile({ id: sessionUser.id, onboarding_step: "done" });

        // Background: server-verify the session. If it turns out to be
        // invalid (revoked, expired refresh token), clear state and cache
        // so the user is redirected to sign-in on the next render cycle.
        getVerifiedUser().then((verifiedUser) => {
          if (!mountedRef.current) return;
          if (!verifiedUser || verifiedUser.id !== sessionUser.id) {
            clearProfileCache();
            setUser(null);
            setProfile(null);
          }
          // Valid: the optimistic state was correct — nothing to update.
        });

        return;
      }

      // ── Full path ──────────────────────────────────────────────────────────
      // User is new, mid-onboarding, or the cache is empty/stale.
      // We need server-verified auth + a fresh profile row.
      const authUser = await getVerifiedUser();
      if (!mountedRef.current) return;

      if (!authUser) {
        clearProfileCache();
        setUser(null);
        setProfile(null);
        return;
      }

      const p = await resolveProfile(authUser);
      if (!mountedRef.current) return;

      // Populate the cache so the next visit can use the fast path (if done).
      if (p?.onboarding_step) {
        writeProfileCache(authUser.id, p.onboarding_step);
      }

      lastFetchRef.current = { userId: authUser.id, pathname: location.pathname };
      setUser(authUser);
      setProfile(p);
    }

    bootstrap();

    // Auth listener: handles sign-in / sign-out AFTER the initial bootstrap.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;

        if (event === "SIGNED_OUT" || !session?.user) {
          if (!mountedRef.current) return;
          clearProfileCache();
          lastFetchRef.current = { userId: null, pathname: null };
          setUser(null);
          setProfile(null);
          return;
        }

        // SIGNED_IN fired after bootstrap (magic link in another tab, etc.).
        const p = await resolveProfile(session.user);
        if (!mountedRef.current) return;

        if (p?.onboarding_step) {
          writeProfileCache(session.user.id, p.onboarding_step);
        }

        lastFetchRef.current = {
          userId:   session.user.id,
          pathname: location.pathname,
        };
        setUser(session.user);
        setProfile(p);
      }
    );

    return () => {
      mountedRef.current = false;
      authListener.subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Phase 2: Re-fetch profile on every navigation ────────────────────────────
  //
  // Prevents routing decisions based on stale onboarding_step values.
  // See the previous commit for the full explanation of why this is needed.
  //
  // Skipped for "done" users: the step is permanent. Once the cache and
  // profile agree on "done", no further DB reads are required for routing.
  //
  useEffect(() => {
    if (user === undefined) return;
    if (!user) return;

    // "done" is permanent — no reconciliation needed on future navigations.
    if (profile?.onboarding_step === "done") return;

    // Phase 1 already fetched for this (userId, pathname) pair.
    if (
      lastFetchRef.current.userId   === user.id &&
      lastFetchRef.current.pathname === location.pathname
    ) {
      return;
    }

    let cancelled = false;

    // Hold the render gate while fresh data is in flight.
    setProfile(undefined);

    fetchProfileRow(user.id).then((p) => {
      if (cancelled) return;
      const resolved = p ?? { id: user.id, onboarding_step: "church" };
      writeProfileCache(user.id, resolved.onboarding_step);
      setProfile(resolved);
      lastFetchRef.current = { userId: user.id, pathname: location.pathname };
    });

    return () => { cancelled = true; };
  }, [location.pathname, user]); // profile intentionally excluded

  // ── Render gate ───────────────────────────────────────────────────────────────
  if (user === undefined || profile === undefined) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  // ── Unauthenticated ───────────────────────────────────────────────────────────
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // ── Bypass routes ─────────────────────────────────────────────────────────────
  if (BYPASS_ROUTES.has(location.pathname)) {
    return <Outlet />;
  }

  // ── Profile unresolvable ──────────────────────────────────────────────────────
  if (!profile) {
    return <Navigate to="/church-select" replace />;
  }

  const step = profile.onboarding_step;

  // ── Onboarding complete ───────────────────────────────────────────────────────
  if (step === "done") {
    return <Outlet />;
  }

  // ── Active onboarding step ────────────────────────────────────────────────────
  const expectedPath = STEP_TO_ROUTE[step];

  if (!expectedPath) {
    return <Navigate to="/church-select" replace />;
  }

  if (location.pathname === expectedPath) {
    return <Outlet />;
  }

  // Allow back-navigation within onboarding.
  if (ONBOARDING_ROUTES.has(location.pathname)) {
    return <Outlet />;
  }

  // Non-onboarding route while onboarding is incomplete → redirect to correct step.
  // Profile was freshly fetched, so this is always based on current DB truth.
  return <Navigate to={expectedPath} replace />;
}
