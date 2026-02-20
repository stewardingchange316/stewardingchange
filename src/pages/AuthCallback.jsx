import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Give Supabase a moment to hydrate session from the URL (confirm/recovery/magic links)
      const waitForSession = async () => {
        // try immediately
        let { data } = await supabase.auth.getSession();
        if (data.session) return data.session;

        // small retries (handles race conditions on first load)
        for (let i = 0; i < 6; i++) {
          await new Promise((r) => setTimeout(r, 250));
          ({ data } = await supabase.auth.getSession());
          if (data.session) return data.session;
        }

        return null;
      };

      const session = await waitForSession();
      if (cancelled) return;

      if (!session?.user) {
        // If no session, user likely needs to sign in manually
        navigate("/signin", { replace: true });
        return;
      }

      const user = session.user;

      // Ensure profile row exists (same intention as your previous upsert)
     const { data: existingProfile } = await supabase
  .from("users")
  .select("onboarding_step")
  .eq("id", user.id)
  .maybeSingle();

if (!existingProfile) {
  const { error: upsertError } = await supabase
    .from("users")
    .insert({
      id: user.id,
      email: user.email,
      first_name: user.user_metadata?.first_name || null,
      last_name: user.user_metadata?.last_name || null,
      phone: user.user_metadata?.phone || null,
      onboarding_step: "church",
    });

  if (upsertError) {
    console.error("Profile insert failed:", upsertError);
  }
}

      if (upsertError) {
        console.error("Profile upsert failed:", upsertError);
        // Don't block the user if upsert fails—RequireAuth can still handle routing
      }

      // Important: don't wipe URL here. Let Home/other pages handle cleanup safely.
      navigate("/verified", { replace: true });
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      Verifying your account...
    </div>
  );
}
