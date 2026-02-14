import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { getOnboarding } from "../../utils/auth";

export default function RequireAuth() {
  const location = useLocation();

  const [user, setUser] = useState(undefined); // undefined = still loading

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user ?? null);
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔒 Still loading session
  if (user === undefined) return null;

  const onboarding = getOnboarding();

  // 1️⃣ Not signed in
  if (!user) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{ from: location }}
      />
    );
  }

  // 2️⃣ Signed in but onboarding missing
  if (!onboarding || !onboarding.step) {
    return <Navigate to="/church-select" replace />;
  }

  // 3️⃣ Enforce onboarding order
  if (onboarding.step !== "done") {
    const stepRouteMap = {
      church: "/church-select",
      cap: "/giving-cap",
      bank: "/bank",
    };

    const target = stepRouteMap[onboarding.step];

    if (target && location.pathname !== target) {
      return <Navigate to={target} replace />;
    }
  }

  // ✅ All good
  return <Outlet />;
}
