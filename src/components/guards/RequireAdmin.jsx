import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function RequireAdmin() {
  // undefined = in-flight, null = denied, "admin" = ok
  const [role, setRole] = useState(undefined);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();

      if (authErr || !user) {
        if (!cancelled) setRole(null);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setRole((!error && data?.role === "admin") ? "admin" : null);
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  if (role === undefined) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
