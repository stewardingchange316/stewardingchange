import { Navigate, Outlet } from "react-router-dom";
import { auth } from "../utils/auth";

export default function OnboardingRoute() {
  if (!auth.isAuthenticated()) return <Navigate to="/signin" replace />;
  return <Outlet />;
}
