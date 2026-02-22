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

// ─── Profile cache ────────────────────────────────────────────────────────────

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

// ─── Synchronous initial state ────────────────────────────────────────────────
//
// These two functions are used as React lazy useState initializers.
// They run synchronously — before the first render — so state is populated
// from localStorage with zero async delay.
//
// For returning "done" users both functions return real values, not undefined.
// That means the loading gate (`user === undefined || profile === undefined`)
// is never true on the first render, and the dashboard appears instantly.
//
// RequireAuth only needs user.id for its routing logic. The full verified
// user object is fetched in the background and replaces the minimal one.
// Child components (Dashboard etc.) source their own user data independently.
//
function readInitialUser() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const { userId, step } = JSON.parse(raw);
    if (!userId || step !== "done") return undefined;
    return { id: userId };                    // minimal — only .id is needed here
  } catch {
    return undefined;
  }
}

function readInitialProfile() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const { userId, step } = JSON.parse(raw);
    if (!userId || step !== "done") return undefined;
    return { id: userId, onboarding_step: "done" };
  } catch {
    return undefined;
  }
}

// ─── Async helpers ────────────────────────────────────────────────────────────

/**
 * Server-verified user. Always makes a network call.
 * Safe to use after getLocalSessionUser() has ensured a valid/refreshed token.
 */
async function getVerifiedUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Fast local session read. No network call if the access token is still valid.
 * If expired, Supabase refreshes it automatically before returning.
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
   * State is initialized synchronously by the lazy initializers above.
   *
   * Returning "done" users:  user = { id }, profile = { onboarding_step: "done" }
   *   → render gate never triggers, dashboard appears on frame 0.
   *
   * Everyone else:           user = undefined, profile = undefined
   *   → render gate shows "Loading..." while the async bootstrap runs.
   */
  const [user,    setUser]    = useState(readInitialUser);
  const [profile, setProfile] = useState(readInitialProfile);

  const lastFetchRef = useRef({ userId: null, pathname: null });
  const mountedRef   = useRef(true);

  // ── Phase 1: Bootstrap ───────────────────────────────────────────────────────
  //
  // Two paths:
  //
  // OPTIMISTIC (cache hit, step === "done")
  //   State is already populated → dashboard is on screen.
  //   We only need to validate the session server-side in the background.
  //   If valid   → upgrade minimal { id } user to the full verified object.
  //   If invalid → clear cache, set null, redirect to sign-in.
  //
  // FULL LOAD (no cache, or step !== "done")
  //   1. getLocalSessionUser()  — fast local read; auto-refreshes expired tokens.
  //   2. getVerifiedUser()      — server-side JWT validation.
  //   3. resolveProfile()       — DB fetch (or create for new users).
  //   4. writeProfileCache()    — so the NEXT visit uses the optimistic path.
  //
  useEffect(() => {
    mountedRef.current = true;

    // Capture initial state values from the lazy initializers.
    // These are the values as of the first render (what bootstrap should act on).
    const initialUserId        = user?.id;
    const initialStepIsDone    = profile?.onboarding_step === "done";

    async function bootstrap() {

      // ── Optimistic path ──────────────────────────────────────────────────────
      if (initialUserId && initialStepIsDone) {
        lastFetchRef.current = { userId: initialUserId, pathname: location.pathname };

        // IMPORTANT: use getLocalSessionUser() (= getSession()), NOT getVerifiedUser()
        // (= getUser()) here. getUser() does not auto-refresh an expired access token
        // and would incorrectly kick out a returning user whose access token has expired
        // but whose refresh token is still valid. getSession() handles the refresh
        // transparently, so the user is only evicted if their refresh token is also gone.
        const sessionUser = await getLocalSessionUser();
        if (!mountedRef.current) return;

        if (!sessionUser || sessionUser.id !== initialUserId) {
          // No valid session (both tokens gone) — redirect to sign-in.
          clearProfileCache();
          setUser(null);
          setProfile(null);
        } else {
          // Session valid — upgrade the minimal { id } object to the full session user.
          setUser(sessionUser);
        }
        return;
      }

      // ── Full load path ───────────────────────────────────────────────────────
      const sessionUser = await getLocalSessionUser();
      if (!mountedRef.current) return;

      if (!sessionUser) {
        setUser(null);
        setProfile(null);
        return;
      }

      // getLocalSessionUser() may have refreshed an expired token.
      // getVerifiedUser() now validates that refreshed token server-side.
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

      if (p?.onboarding_step) {
        writeProfileCache(authUser.id, p.onboarding_step);
      }

      lastFetchRef.current = { userId: authUser.id, pathname: location.pathname };
      setUser(authUser);
      setProfile(p);
    }

    bootstrap();

    // Handle auth events that fire after bootstrap (magic link, sign-out, etc.)
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

  // ── Phase 2: Re-fetch profile on navigation ───────────────────────────────────
  //
  // Ensures onboarding_step is always fresh when making routing decisions.
  // Skipped entirely for "done" users — the step is permanent, no re-fetch needed.
  //
  useEffect(() => {
    if (user    === undefined) return;
    if (!user)                 return;
    if (profile?.onboarding_step === "done") return;

    if (
      lastFetchRef.current.userId   === user.id &&
      lastFetchRef.current.pathname === location.pathname
    ) {
      return;
    }

    let cancelled = false;
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
  //
  // For returning "done" users, both values are non-undefined from frame 0
  // (set by the lazy initializers), so this block is never entered.
  //
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

  if (ONBOARDING_ROUTES.has(location.pathname)) {
    return <Outlet />;
  }

  return <Navigate to={expectedPath} replace />;
}
