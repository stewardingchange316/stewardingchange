import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ChurchSelect from "./pages/ChurchSelect";
import GivingCap from "./pages/GivingCap";
import Bank from "./pages/Bank";
import AuthCallback from "./pages/AuthCallback";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Verified from "./pages/Verified";
import UpdatePassword from "./pages/UpdatePassword";


import RequireAuth from "./components/guards/RequireAuth";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="bg-wrap">
      <Routes>

        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/update-password" element={<UpdatePassword />} />


        {/* Protected + Onboarding */}
        <Route element={<RequireAuth />}>
          <Route path="/verified" element={<Verified />} />
          <Route path="/church-select" element={<ChurchSelect />} />
          <Route path="/giving-cap" element={<GivingCap />} />
          <Route path="/bank" element={<Bank />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

      <Footer />
    </div>
  );
}
