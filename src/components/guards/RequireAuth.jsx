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
      setUser(user ?? null);

      if (user) {
        const { data, error } = await supabase
          .from("users")
          .select("onboarding_step")
          .eq("id", user.id)
          .single();

        if (!mounted) return;

        if (error) {
          console.error("Profile load error:", error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      } else {
        setProfile(null);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  if (user === undefined || profile === undefined) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
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
