import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { supabase } from "./lib/supabase";
import App from "./App";

import "./styles/tokens.css";
import "./styles/base.css";
import "./App.css";

async function bootstrap() {
  // If returning from email confirmation (PKCE flow)
  if (window.location.search.includes("code=")) {
    try {
      await supabase.auth.exchangeCodeForSession(window.location.href);

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // 🔥 AFTER CONFIRMATION → SEND TO FIRST ONBOARDING STEP
      window.location.replace("/church-select");
      return; // stop rendering until redirect happens
    } catch (err) {
      console.error("Code exchange failed:", err);
    }
  }

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}


bootstrap();
