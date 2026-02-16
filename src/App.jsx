import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";

import Home from "./pages/Home";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ChurchSelect from "./pages/ChurchSelect";
import GivingCap from "./pages/GivingCap";
import Bank from "./pages/Bank";

import RequireAuth from "./components/guards/RequireAuth";

export default function App() {

  // 🔥 THIS FIXES EMAIL CONFIRM PKCE FLOW
  useEffect(() => {
    const handleCodeExchange = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession();
      if (error) {
        console.error("Code exchange failed:", error.message);
      }
    };

    handleCodeExchange();
  }, []);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected + Onboarding */}
      <Route element={<RequireAuth />}>
        <Route path="/church-select" element={<ChurchSelect />} />
        <Route path="/giving-cap" element={<GivingCap />} />
        <Route path="/bank" element={<Bank />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
