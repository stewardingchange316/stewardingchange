import { Routes, Route, Navigate } from "react-router-dom";

import AppShell from "./components/AppShell.jsx";
import PublicRoute from "./components/PublicRoute.jsx";
import OnboardingRoute from "./components/OnboardingRoute.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Signup from "./pages/Signup.jsx";
import Signin from "./pages/Signin.jsx";

import ChurchSelect from "./pages/ChurchSelect.jsx";
import GivingCap from "./pages/GivingCap.jsx";
import Bank from "./pages/Bank.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* Public */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
        </Route>

        {/* Onboarding (must be logged in) */}
        <Route element={<OnboardingRoute />}>
          <Route path="/onboarding/church" element={<ChurchSelect />} />
          <Route path="/onboarding/cap" element={<GivingCap />} />
          <Route path="/onboarding/bank" element={<Bank />} />
        </Route>

        {/* Protected app */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
