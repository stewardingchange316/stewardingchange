import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

// ─── Static route tables ─────────────────────────────────────────────────────

/**
 * Every valid onboarding_step value → its canonical protected route.
 * Used to compute "where should this user be right now?"
 */
const STEP_TO_ROUTE = {
  church: "/church-select",
  cap:    "/giving-cap",
  bank:   "/bank",
};

/** All valid onboarding routes (for O(1) lookup). */
const ONBOARDING_ROUTES = new Set(Object.values(STEP_TO_ROUTE));

/**
 * Routes that bypass onboarding enforcement entirely.
 * /verified must be reachable right after magic-link confirmation,
 * before the profile row necessarily has a fully-resolved step.
 */
const BYPASS_ROUTES = new Set(["/verified"]);

// ─── Pure async helpers (no React state side-effects) ────────────────────────

/**
 * Returns the server-verified auth user, or null.
 * Uses getUser() (not getSession()) so the JWT is validated server-side.
 */
async function getVerifiedUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Fetches the profile row for userId.
 * Only selects the fields RequireAuth cares about.
 * Returns the row, or null on error / missing row.
 */
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

/**
 * Upserts a default profile row for a first-time user.
 * Returns the new profile object, or null on failure.
 */
async function createProfileRow(authUser) {
  const { error } = await supabase
    .from("users")
    .upsert(
      {
        id:               authUser.id,
        email:            authUser.email,
        first_name:       authUser.user_metadata?.first_name ?? null,
        last_name:        authUser.user_metadata?.last_name  ?? null,
        phone:            authUser.user_metadata?.phone      ?? null,
        onboarding_step:  "church",
        church_id:        null,
        weekly_cap:       null,
        bank_connected:   false,
      },
      { onConflict: "id" }
    );

  if (error) {
    console.error("[RequireAuth] createProfileRow error:", error);
    return null;
  }
  return { id: authUser.id, onboarding_step: "church" };
}

/**
 * Fetches the profile row, creating it if it doesn't exist yet.
 * This is only called from the auth bootstrap (Phase 1).
 */
async function resolveProfile(authUser) {
  const existing = await fetchProfileRow(authUser.id);
  return existing ?? createProfileRow(authUser);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RequireAuth() {
  const location = useLocation();

  /**
   * `undefined` = not yet resolved (loading).
   * `null`      = resolved: unauthenticated.
   * object      = resolved: authenticated user / profile row.
   *
   * Using undefined (not a boolean loading flag) lets a single gate condition
   * cover BOTH the initial auth load AND in-flight profile re-fetches:
   *
   *   if (user === undefined || profile === undefined) → show loading
   *
   * This guarantees we never make a routing decision with stale data.
   */
  const [user,    setUser]    = useState(undefined);
  const [profile, setProfile] = useState(undefined);

  /**
   * Tracks which (userId, pathname) pair was last fully fetched.
   * Phase 2 uses this to skip duplicate fetches when Phase 1 already
   * fetched for the current path, or when the path hasn't changed.
   */
  const lastFetchRef = useRef({ userId: null, pathname: null });

  /** Prevents state updates after unmount (StrictMode / fast navigations). */
  const mountedRef = useRef(true);

  // ── Phase 1: Auth bootstrap + initial profile load (runs once) ──────────────
  //
  // Resolves the auth session and initial profile, then sets state.
  // Also subscribes to Supabase auth events for sign-in / sign-out.
  useEffect(() => {
    mountedRef.current = true;

    async function bootstrap() {
      const authUser = await getVerifiedUser();
      if (!mountedRef.current) return;

      if (!authUser) {
        setUser(null);
        setProfile(null);
        return;
      }

      const p = await resolveProfile(authUser);
      if (!mountedRef.current) return;

      // Record the fetch BEFORE setting state, so Phase 2 sees it
      // as already-fetched when it runs after the re-render caused by setUser.
      lastFetchRef.current = {
        userId:   authUser.id,
        pathname: location.pathname,
      };
      setUser(authUser);
      setProfile(p);
    }

    bootstrap();

    // Auth state listener — handles sign-in and sign-out events that occur
    // AFTER the initial bootstrap (e.g., magic link in another tab, sign out).
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Ignore TOKEN_REFRESHED, INITIAL_SESSION, PASSWORD_RECOVERY, etc.
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;

        if (event === "SIGNED_OUT" || !session?.user) {
          if (!mountedRef.current) return;
          lastFetchRef.current = { userId: null, pathname: null };
          setUser(null);
          setProfile(null);
          return;
        }

        // SIGNED_IN after the initial bootstrap.
        const p = await resolveProfile(session.user);
        if (!mountedRef.current) return;

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

  // ── Phase 2: Re-fetch profile on every navigation (the loop-breaker) ────────
  //
  // This is the critical fix.
  //
  // Problem: Individual onboarding pages (ChurchSelect, GivingCap, Bank) write
  // `onboarding_step` directly to Supabase but have no way to update
  // RequireAuth's local `profile` state. Without a re-fetch, RequireAuth would
  // evaluate redirects against the step value that existed at mount time —
  // which can be several steps behind the DB truth.
  //
  // Example without this fix:
  //   Mount on /giving-cap → profile cached as "cap"
  //   Bank saves "done" → navigate /dashboard
  //   RequireAuth: profile still "cap" → stepRouteMap["cap"] = /giving-cap → REDIRECT
  //   → /giving-cap renders, user clicks Continue → Bank "done" → /dashboard → REDIRECT
  //   → infinite loop
  //
  // Fix: On every pathname change, re-fetch the profile from the DB.
  // While the fetch is in flight, set profile to `undefined` so the render gate
  // (user === undefined || profile === undefined) holds the component in loading
  // state. No routing decision is made until fresh data arrives.
  //
  // Optimisation: skip the re-fetch if onboarding is already "done" — that
  // step value can never revert, so re-fetching on every navigation would be
  // wasteful after onboarding is complete.
  //
  // Dependency array: [location.pathname, user]
  //   `profile` is intentionally excluded. Including it would cause Phase 2 to
  //   re-run whenever this effect sets profile to `undefined`, creating a
  //   redundant fetch loop within the same navigation.
  useEffect(() => {
    // Phase 1 hasn't resolved yet — Phase 2 should not run.
    if (user === undefined) return;

    // No authenticated user — nothing to fetch.
    if (!user) return;

    // Onboarding is complete. The step can never revert to an incomplete state,
    // so there is nothing to reconcile on future navigations.
    if (profile?.onboarding_step === "done") return;

    // Phase 1 already fetched for this exact (userId, pathname) pair.
    // Avoid a redundant round-trip on the first render after bootstrap.
    if (
      lastFetchRef.current.userId   === user.id &&
      lastFetchRef.current.pathname === location.pathname
    ) {
      return;
    }

    let cancelled = false;

    // Hold the render gate while the fresh data is in flight.
    // This prevents RequireAuth from evaluating redirects with the previous
    // (potentially stale) step value.
    setProfile(undefined);

    fetchProfileRow(user.id).then((p) => {
      if (cancelled) return;
      // If the row is missing here (shouldn't happen after Phase 1), fall back
      // gracefully to the first step rather than leaving profile null.
      setProfile(p ?? { id: user.id, onboarding_step: "church" });
      lastFetchRef.current = { userId: user.id, pathname: location.pathname };
    });

    return () => {
      cancelled = true;
    };
  }, [location.pathname, user]); // profile intentionally excluded — see above

  // ── Render gate ──────────────────────────────────────────────────────────────
  //
  // Do NOT make any routing decision until both user AND profile are resolved.
  // `undefined` means "in flight" for either value.
  if (user === undefined || profile === undefined) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  // ── Unauthenticated ──────────────────────────────────────────────────────────
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // ── Bypass routes ────────────────────────────────────────────────────────────
  // These routes are reachable without a fully-resolved onboarding step.
  if (BYPASS_ROUTES.has(location.pathname)) {
    return <Outlet />;
  }

  // ── Profile still null after all attempts ────────────────────────────────────
  // DB unavailable or RLS blocked the read. Restart onboarding.
  if (!profile) {
    return <Navigate to="/church-select" replace />;
  }

  const step = profile.onboarding_step;

  // ── Onboarding complete ───────────────────────────────────────────────────────
  // The user has finished all steps. Allow free navigation inside the app.
  if (step === "done") {
    return <Outlet />;
  }

  // ── Active onboarding step ────────────────────────────────────────────────────

  // Map the current step to its canonical route.
  const expectedPath = STEP_TO_ROUTE[step];

  if (!expectedPath) {
    // Unrecognised step value in the DB — reset to the beginning.
    return <Navigate to="/church-select" replace />;
  }

  // User is exactly where they should be.
  if (location.pathname === expectedPath) {
    return <Outlet />;
  }

  // User is on an earlier onboarding step (back-navigation via browser or
  // the "← Back" buttons in GivingCap / Bank). Allow it — the page components
  // are responsible for not letting users skip forward without completing the
  // current step.
  if (ONBOARDING_ROUTES.has(location.pathname)) {
    return <Outlet />;
  }

  // User is trying to reach a non-onboarding route (e.g. /dashboard) while
  // their onboarding step is still incomplete. Redirect to the correct step.
  // Because `profile` was freshly fetched above, this redirect is always
  // based on the true current DB state — never on stale cached data.
  return <Navigate to={expectedPath} replace />;
}
