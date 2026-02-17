import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function RequireAuth() {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(user);

      const { data: existing, error } = await supabase
        .from("users")
        .select("id, onboarding_step")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Profile load error:", error);
      }

      if (!existing) {
        const { error: insertError } = await supabase
          .from("users")
          .upsert(
            {
              id: user.id,
              email: user.email,
              first_name: user.user_metadata?.first_name || null,
              last_name: user.user_metadata?.last_name || null,
              phone: user.user_metadata?.phone || null,
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

        if (!mounted) return;

        setProfile({ onboarding_step: "church" });
        setLoading(false);
        return;
      }

      setProfile(existing);
      setLoading(false);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

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

  if (!currentStep) {
    return <Navigate to="/church-select" replace />;
  }

  // ✅ CRITICAL FIX
  // If onboarding is complete, allow free navigation inside app
  if (currentStep === "done") {
    return <Outlet />;
  }

  // 🔒 Otherwise enforce onboarding flow
  const target = stepRouteMap[currentStep];
  if (target && location.pathname !== target) {
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
