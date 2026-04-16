import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "../lib/supabase";
import { writeProfileCache } from "../lib/profileCache";

// Stripe.js is loaded once at module level — avoids reloading on re-render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);


// Polling config: check every 2 s for up to 30 s
const POLL_INTERVAL_MS  = 2_000;
const POLL_MAX_ATTEMPTS = 15;

// ── Component ─────────────────────────────────────────────────────────────────

export default function Bank() {
  const navigate = useNavigate();

  // 'connect' | 'mandate' | 'verifying' | 'timeout'
  const [view,            setView]            = useState("connect");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [clientSecret,    setClientSecret]    = useState(null);
  const [mandateAccepted, setMandateAccepted] = useState(false);

  // ── Step 1 — open Financial Connections ──────────────────────────────────────

  async function handleConnectBank() {
    setError("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired. Please sign in again.");

      // supabase.functions.invoke() automatically attaches the correct
      // Authorization and apikey headers from the initialized client.
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "stripe-setup-intent",
        { method: "POST" }
      );

      if (fnError) throw new Error(fnError.message ?? "Failed to reach server");

      const { client_secret } = fnData;

      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe.js failed to load.");

      // Open Stripe Financial Connections — pops a Stripe-hosted modal
      const billingName = session.user.user_metadata?.first_name
        ? `${session.user.user_metadata.first_name} ${session.user.user_metadata.last_name ?? ""}`.trim()
        : session.user.email;

      const { setupIntent, error: collectError } =
        await stripe.collectBankAccountForSetup({
          clientSecret: client_secret,
          params: {
            payment_method_type: "us_bank_account",
            payment_method_data: {
              billing_details: {
                name:  billingName,
                email: session.user.email,
              },
            },
          },
          expand: ["payment_method"],
        });

      if (collectError) throw new Error(collectError.message);

      // User cancelled — modal closed without selecting an account
      if (setupIntent.status === "requires_payment_method") {
        setLoading(false);
        return;
      }

      // Bank selected — show mandate before confirming
      if (setupIntent.status === "requires_confirmation") {
        setClientSecret(client_secret);
        setView("mandate");
        setLoading(false);
        return;
      }

      throw new Error(`Unexpected SetupIntent status: ${setupIntent.status}`);

    } catch (err) {
      console.error("[Bank] handleConnectBank:", err);
      setError(err.message ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // ── Step 2 — user accepts mandate, confirm SetupIntent ───────────────────────

  async function handleConfirmMandate() {
    if (!mandateAccepted) {
      setError("You must accept the authorization to continue.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe.js failed to load.");

      const { setupIntent, error: confirmError } =
        await stripe.confirmUsBankAccountSetup(clientSecret);

      if (confirmError) throw new Error(confirmError.message);

      if (setupIntent.status === "requires_payment_method") {
        throw new Error("Bank account setup failed. Please try again.");
      }

      // Status is "processing" — the webhook will set bank_connected = true.
      // Mark onboarding_step done from the frontend now so RequireAuth
      // allows /dashboard while the webhook completes asynchronously.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("users")
          .update({ onboarding_step: "done" })
          .eq("id", user.id);

        writeProfileCache(user.id, "done");

        // Poll for bank_connected = true (set by webhook)
        setView("verifying");
        setLoading(false);
        pollBankConnected(user.id);
      }

    } catch (err) {
      console.error("[Bank] handleConfirmMandate:", err);
      setError(err.message ?? "Failed to confirm. Please try again.");
      setLoading(false);
    }
  }

  // ── Polling — wait for webhook to update bank_connected ──────────────────────

  function pollBankConnected(userId) {
    let attempts = 0;

    async function check() {
      attempts++;

      const { data } = await supabase
        .from("users")
        .select("bank_connected")
        .eq("id", userId)
        .single();

      if (data?.bank_connected) {
        // Webhook has fired — head to dashboard
        navigate("/dashboard", { replace: true });
        return;
      }

      if (attempts < POLL_MAX_ATTEMPTS) {
        setTimeout(check, POLL_INTERVAL_MS);
      } else {
        // Webhook hasn't fired within 30 s — let the user proceed anyway.
        // bank_connected will update in the background via webhook.
        setView("timeout");
      }
    }

    check();
  }

  // ── Skip for now ─────────────────────────────────────────────────────────────

  async function handleSkipForNow() {
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("users")
        .update({ onboarding_step: "done", bank_connected: false })
        .eq("id", user.id);

      if (error) throw error;

      writeProfileCache(user.id, "done");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("[Bank] handleSkipForNow:", err);
      setError(err.message ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // ── Views ────────────────────────────────────────────────────────────────────

  if (view === "verifying") {
    return (
      <div className="page">
        <div className="container-narrow">
          <div className="card stack-6 mt-8" style={{ textAlign: "center" }}>
            <h2>Verifying your bank connection&hellip;</h2>
            <p className="muted">
              This usually takes just a few seconds. Please don&rsquo;t close
              this page.
            </p>
            <div className="spinner" aria-label="Loading" />
          </div>
        </div>
      </div>
    );
  }

  if (view === "timeout") {
    return (
      <div className="page">
        <div className="container-narrow">
          <div className="card stack-6 mt-8">
            <h2>Almost there</h2>
            <p className="muted">
              Your bank account is linked and pending final verification. This
              can occasionally take a minute or two. Your dashboard will show
              the confirmed status once it&rsquo;s ready.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/dashboard", { replace: true })}
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "mandate") {
    return (
      <div className="page">
        <div className="container-narrow">
          <div className="progress-indicator">
            <div className="progress-dot" />
            <div className="progress-dot is-active" />
          </div>

          <h1 className="page-title">Authorize bank debits</h1>

          <div className="card stack-6 mt-8">
            <div>
              <h3 className="mb-2">ACH Direct Debit Authorization</h3>
              <p className="muted small">
                By authorizing, you allow Stewarding Change to electronically
                debit your bank account for your configured roundup amounts, up
                to your weekly cap. Debits are subject to{" "}
                <a
                  href="https://stripe.com/legal/ach"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link"
                >
                  Stripe&rsquo;s ACH Direct Debit Terms
                </a>
                . You may cancel this authorization at any time from your
                dashboard.
              </p>
            </div>

            <label className="mandate-row">
              <input
                type="checkbox"
                checked={mandateAccepted}
                onChange={(e) => setMandateAccepted(e.target.checked)}
              />
              <span className="small" style={{ color: "var(--color-text-body)" }}>
                I authorize Stewarding Change to debit my bank account as
                described above.
              </span>
            </label>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="row-between">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setView("connect");
                  setClientSecret(null);
                  setMandateAccepted(false);
                  setError("");
                }}
                disabled={loading}
              >
                ← Cancel
              </button>

              <button
                className="btn btn-primary"
                onClick={handleConfirmMandate}
                disabled={!mandateAccepted || loading}
              >
                {loading ? "Confirming…" : "Authorize & Connect"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Default: connect view ────────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="container-narrow">
        <div className="progress-indicator">
          <div className="progress-dot" />
          <div className="progress-dot is-active" />
        </div>

        <h1 className="page-title">Connect your bank</h1>

        <p className="page-subtitle">
          Stewarding Change uses bank-level encryption to securely manage
          donations. You remain fully in control at all times.
        </p>

        <div className="card stack-6 mt-8">
          <div className="cap-nav">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate("/giving-cap", { replace: true })}
              disabled={loading}
            >
              ← Back
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleSkipForNow}
              disabled={loading}
            >
              Skip for now →
            </button>
          </div>

          <div>
            <h3 className="mb-2">Link your bank account</h3>
            <p className="muted">
              We use Stripe Financial Connections to securely link your account.
              Your login credentials are never shared with us.
            </p>
          </div>

          <div className="divider" />

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="row-between">
            <span className="muted">Powered by Stripe. Bank-grade security.</span>

            <button
              className="btn btn-primary"
              onClick={handleConnectBank}
              disabled={loading}
            >
              {loading ? "Opening…" : "Connect bank"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
