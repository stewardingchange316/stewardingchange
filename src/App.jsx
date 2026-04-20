import { Routes, Route, Navigate, useLocation } from "react-router-dom";

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
import RequireAdmin from "./components/guards/RequireAdmin";
import Admin from "./pages/Admin";
import SocialPage from "./pages/SocialPage";
import GivingProfile from "./pages/GivingProfile";
import PublicShareCard from "./pages/PublicShareCard";
import TitheCalculator from "./pages/TitheCalculator";
import Faq from "./pages/Faq";
import About from "./pages/About";
import Help from "./pages/Help";
import AddChurch from "./pages/AddChurch";
import ConnectCard from "./pages/ConnectCard";
import AllSet from "./pages/AllSet";
import Footer from "./components/Footer";

export default function App() {
  const location = useLocation();
  const darkPages = ["/", "/about", "/help", "/add-church"];
  const isDarkPage = darkPages.includes(location.pathname);

  return (
    <div className={isDarkPage ? "" : "bg-wrap"}>
      <Routes>

        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/verified" element={<Verified />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/s/:id" element={<PublicShareCard />} />
        <Route path="/tithe-calculator" element={<TitheCalculator />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/about" element={<About />} />
        <Route path="/help" element={<Help />} />
        <Route path="/add-church" element={<AddChurch />} />


        {/* Protected + Onboarding */}
        <Route element={<RequireAuth />}>
          <Route path="/church-select" element={<ChurchSelect />} />
          <Route path="/giving-cap" element={<GivingCap />} />
          <Route path="/connect-card" element={<ConnectCard />} />
          <Route path="/connect-bank" element={<Bank />} />
          <Route path="/bank" element={<Bank />} />
          <Route path="/all-set" element={<AllSet />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/social"    element={<SocialPage />} />
          <Route path="/impact"    element={<GivingProfile />} />
        </Route>

        {/* Admin only */}
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<Admin />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

      {!isDarkPage && <Footer />}
    </div>
  );
}
