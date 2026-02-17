import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getNextOnboardingPath } from "../utils/auth";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleAuth() {
      // Let Supabase establish session from URL
      await supabase.auth.getSession();

      // Route based on onboarding state
      const nextPath = await getNextOnboardingPath();
      navigate(nextPath, { replace: true });
    }

    handleAuth();
  }, [navigate]);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      Completing sign in...
    </div>
  );
}
