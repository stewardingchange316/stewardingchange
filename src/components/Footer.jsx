import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Footer() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.rpc("is_admin").then(({ data }) => {
      if (data === true) setIsAdmin(true);
    });
  }, []);

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          © {new Date().getFullYear()} Stewarding Change
        </div>

        <div className="footer-links">
          <Link to="/faq">FAQ</Link>
          <Link to="/about">About</Link>
          <Link to="/help">Help</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy">Privacy Policy</Link>
          {isAdmin && <Link to="/admin">Admin</Link>}
        </div>

        <div>
          Secure • Transparent • Simple
        </div>
      </div>
    </footer>
  );
}
