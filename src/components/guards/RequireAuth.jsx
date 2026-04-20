import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  readProfileCache,
  writeProfileCache,
  clearProfileCache,
} from "../../lib/profileCache";

// ─── Static route tables ─────────────────────────────────────────────────────

const STEP_TO_ROUTE = {
  church: "/church-select",
  cap:    "/connect-card",  // cap step removed — redirect to card connect
  plaid:  "/connect-card",
  bank:   "/connect-bank",
  allset: "/all-set",
};

const ONBOARDING_ROUTES = new Set(Object.values(STEP_TO_ROUTE));

// ─── Synchronous initial state ────────────────────────────────────────────────
//
// Lazy useState initializers — run synchronously before the first render.
// For returning "done" users both return real values so the loading gate
// is never entered and the dashboard appears on frame 0.
//
function readInitialUser() {
  try {
    const cached = JSON.parse(localStorage.getItem("sc_profile_v1") ?? "null");
    if (!cached?.userId || cached.step !== "done") return undefined;
    return { id: cached.userId };
  } catch {
    return undefined;
  }
}

function readInitialProfile() {
  try {
    const cached = JSON.parse(localStorage.getItem("sc_profile_v1") ?? "null");
    if (!cached?.userId || cached.step !== "done") return undefined;
    return { id: cached.userId, onboarding_step: "done" };
  } catch {
    return undefined;
  }
}

// ─── Async helpers ────────────────────────────────────────────────────────────

async function getVerifiedUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

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

  const [user,    setUser]    = useState(readInitialUser);
  const [profile, setProfile] = useState(readInitialProfile);

  const lastFetchRef = useRef({ userId: null, pathname: null });
  const mountedRef   = useRef(true);

  // ── Phase 1: Bootstrap ───────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    const initialUserId     = user?.id;
    const initialStepIsDone = profile?.onboarding_step === "done";

    async function bootstrap() {

      // ── Optimistic path (returning "done" user, cache hit) ───────────────────
      if (initialUserId && initialStepIsDone) {
        lastFetchRef.current = { userId: initialUserId, pathname: location.pathname };

        // getSession() auto-refreshes expired access tokens; getUser() does not.
        const sessionUser = await getLocalSessionUser();
        if (!mountedRef.current) return;

        if (!sessionUser || sessionUser.id !== initialUserId) {
          clearProfileCache();
          setUser(null);
          setProfile(null);
        } else {
          setUser(sessionUser);
        }
        return;
      }

      // ── Full load path (new user / mid-onboarding) ───────────────────────────
      const sessionUser = await getLocalSessionUser();
      if (!mountedRef.current) return;

      if (!sessionUser) {
        setUser(null);
        setProfile(null);
        return;
      }

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
  // Prevents routing decisions based on stale onboarding_step values.
  //
  // Cache-first: before making a DB round-trip, check whether the onboarding
  // page that just navigated here already wrote "done" to the local cache.
  // This eliminates the race where Phase 2's DB read returns a stale value
  // (e.g. "bank") that would trigger a redirect back to /bank right after
  // Bank.jsx wrote "done" and navigated to /dashboard.
  //
  // Onboarding pages that complete the final step MUST call writeProfileCache
  // (from src/lib/profileCache.js) before calling navigate(). This guarantees
  // Phase 2 always sees the correct step on the first render after navigation.
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

    // ── Cache-first check ─────────────────────────────────────────────────────
    // If the cache already says "done" (written by the page before navigating),
    // trust it and skip the DB fetch entirely. No loading flash, no stale read.
    const cachedStep = readProfileCache(user.id);
    if (cachedStep === "done") {
      setProfile({ id: user.id, onboarding_step: "done" });
      lastFetchRef.current = { userId: user.id, pathname: location.pathname };
      return;
    }

    // ── Fresh DB fetch ────────────────────────────────────────────────────────
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
  if (user === undefined || profile === undefined) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!profile) {
    return <Navigate to="/church-select" replace />;
  }

  const step = profile.onboarding_step;

  if (step === "done") {
    return <Outlet />;
  }

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
