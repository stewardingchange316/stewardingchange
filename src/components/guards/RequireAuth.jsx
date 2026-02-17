import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function RequireAuth() {
  const location = useLocation();
  const [user, setUser] = useState(undefined);
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setUser(null);
        setProfile(null);
        return;
      }

      setUser(user);

      // 🔥 SAFE PROFILE FETCH
      const { data, error } = await supabase
        .from("users")
        .select("onboarding_step")
        .eq("id", user.id)
        .limit(1);

      if (!mounted) return;

      if (error) {
        console.error("Profile load error:", error);
        setProfile(null);
        return;
      }

      // If no row exists yet, default to first onboarding step
      if (!data || data.length === 0) {
        setProfile({ onboarding_step: "church" });
        return;
      }

      setProfile(data[0]);
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

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

  const stepRouteMap = {
    church: "/church-select",
    cap: "/giving-cap",
    bank: "/bank",
  };

  const currentStep = profile?.onboarding_step;

  // If no step exists, start onboarding
  if (!currentStep) {
    return <Navigate to="/church-select" replace />;
  }

  if (currentStep !== "done") {
    const target = stepRouteMap[currentStep];

    if (target && location.pathname !== target) {
      return <Navigate to={target} replace />;
    }
  }

  return <Outlet />;
}
