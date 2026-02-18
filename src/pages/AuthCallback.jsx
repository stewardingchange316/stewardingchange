import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleAuth() {
      // Exchange PKCE code for session
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        console.error("Code exchange failed:", error);
        navigate("/signin", { replace: true });
        return;
      }

      // Get authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/signin", { replace: true });
        return;
      }

      // 🔥 Upsert profile safely (guarantees row exists)
      const { error: upsertError } = await supabase
        .from("users")
        .upsert(
          {
            id: user.id,
            email: user.email,
            first_name: user.user_metadata?.first_name || null,
            last_name: user.user_metadata?.last_name || null,
            phone: user.user_metadata?.phone || null,
          },
          { onConflict: "id" }
        );

      if (upsertError) {
        console.error("Profile upsert failed:", upsertError);
      }

      navigate("/verified", { replace: true });
    }

    handleAuth();
  }, [navigate]);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      Verifying your account...
    </div>
  );
}
