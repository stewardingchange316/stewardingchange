import { useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import { supabase } from "../lib/supabase";

export default function PlaidLinkButton({
  onSuccess,
  onExit,
  buttonText = "Connect Account",
  buttonClass = "btn btn-primary btn-lg btn-wide",
}) {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchLinkToken() {
    setLoading(true);
    setError("");

    try {
      const { data, error: fnErr } = await supabase.functions.invoke("plaid-link-token");

      if (fnErr) throw fnErr;
      if (!data?.link_token) throw new Error("No link token returned");

      setLinkToken(data.link_token);
    } catch (err) {
      console.error("Failed to create link token:", err);
      setError("Unable to connect. Please try again.");
      setLoading(false);
    }
  }

  const handleSuccess = useCallback(
    async (publicToken, metadata) => {
      try {
        const { error: fnErr } = await supabase.functions.invoke("plaid-exchange-token", {
          body: { public_token: publicToken, metadata },
        });

        if (fnErr) throw fnErr;

        onSuccess?.({ publicToken, metadata });
      } catch (err) {
        console.error("Failed to exchange token:", err);
        setError("Failed to link account. Please try again.");
      }
    },
    [onSuccess]
  );

  const handleExit = useCallback(
    (err, metadata) => {
      setLoading(false);
      setLinkToken(null);
      if (err) {
        console.error("Plaid Link exit with error:", err);
      }
      onExit?.(err, metadata);
    },
    [onExit]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: handleSuccess,
    onExit: handleExit,
  });

  // Auto-open Plaid Link when we get the token
  if (linkToken && ready) {
    // Use setTimeout to avoid calling open() during render
    setTimeout(() => open(), 0);
  }

  return (
    <>
      <button
        className={buttonClass}
        onClick={fetchLinkToken}
        disabled={loading}
      >
        {loading ? "Connecting..." : buttonText}
      </button>
      {error && (
        <p className="small" style={{ color: "var(--color-danger)", marginTop: "var(--s-2)" }}>
          {error}
        </p>
      )}
    </>
  );
}
