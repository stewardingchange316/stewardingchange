import { Navigate, Outlet } from "react-router-dom";
import { auth } from "../utils/auth";

export default function PublicRoute() {
  if (!auth.isAuthenticated()) return <Outlet />;

  const ob = auth.getOnboarding();
  if (!ob?.step || ob.step < 3) return <Navigate to="/onboarding/church" replace />;
  if (ob.step === 3) return <Navigate to="/onboarding/cap" replace />;
  if (ob.step === 4) return <Navigate to="/onboarding/bank" replace />;
  return <Navigate to="/dashboard" replace />;
}
