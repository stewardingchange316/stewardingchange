import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getUser, getOnboarding } from "../../utils/auth";

export default function RequireAuth() {
  const location = useLocation();
  const user = getUser();
  const onboarding = getOnboarding();

  // 1️⃣ Not signed in → always go to sign in
  if (!user) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{ from: location }}
      />
    );
  }

  // 2️⃣ Signed in but onboarding missing → start onboarding
  if (!onboarding || !onboarding.step) {
    return <Navigate to="/church-select" replace />;
  }

  // 3️⃣ Enforce onboarding step order
  // If onboarding is not finished, force correct step
if (onboarding && onboarding.step !== "done") {
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

  // 4️⃣ All checks passed → render page
  return <Outlet />;
}
