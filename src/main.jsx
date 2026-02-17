import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { supabase } from "./lib/supabase";
import App from "./App";

import "./styles/tokens.css";
import "./styles/base.css";
import "./App.css";

async function bootstrap() {
  // If we returned from email confirmation
  if (window.location.search.includes("code=")) {
    try {
      await supabase.auth.exchangeCodeForSession(window.location.href);
      window.history.replaceState({}, document.title, window.location.pathname);
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
