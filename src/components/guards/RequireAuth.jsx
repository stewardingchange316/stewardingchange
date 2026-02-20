import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function RequireAuth() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  async function loadProfile(authUser) {
    const { data: existing } = await supabase
      .from("users")
      .select("id, onboarding_step")
      .eq("id", authUser.id)
      .maybeSingle();

    if (!existing) {
      const { error: insertError } = await supabase
        .from("users")
        .upsert(
          {
            id: authUser.id,
            email: authUser.email,
            first_name: authUser.user_metadata?.first_name || null,
            last_name: authUser.user_metadata?.last_name || null,
            phone: authUser.user_metadata?.phone || null,
            onboarding_step: "church",
            church_id: null,
            weekly_cap: null,
            bank_connected: false,
          },
          { onConflict: "id" }
        );

      if (insertError) {
        console.error("Profile creation failed:", insertError);
      }

      return { onboarding_step: "church" };
    }

    return existing;
  }

  useEffect(() => {
    let mounted = true;

    // Initial load
    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!authUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(authUser);
      const p = await loadProfile(authUser);
      if (!mounted) return;
      setProfile(p);
      setLoading(false);
    }

    init();

    // Re-read profile whenever Supabase auth state changes
    // This fires after magic link verification AND after page navigations
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (!session?.user) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(session.user);
      const p = await loadProfile(session.user);
      if (!mounted) return;
      setProfile(p);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const stepRouteMap = {
    church: "/church-select",
    cap: "/giving-cap",
    bank: "/bank",
  };

  const currentStep = profile?.onboarding_step;

  // Allow verified screen before enforcing onboarding
  if (location.pathname === "/verified") {
    return <Outlet />;
  }

  if (!currentStep) {
    return <Navigate to="/church-select" replace />;
  }

  // If onboarding is complete, allow free navigation inside app
  if (currentStep === "done") {
    return <Outlet />;
  }

 // If user is on any onboarding page, let them through
  const onboardingPaths = ["/church-select", "/giving-cap", "/bank"];
  if (onboardingPaths.includes(location.pathname)) {
    return <Outlet />;
  }

  // If somehow off-flow, redirect to correct step
  const target = stepRouteMap[currentStep];
  if (target && location.pathname !== target) {
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}