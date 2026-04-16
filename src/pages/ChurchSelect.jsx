import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// FUTURE: Deep link route /give/:churchSlug that pre-selects a church on account creation. QR code support planned.

export default function ChurchSelect() {
  const navigate = useNavigate();

  const [churches, setChurches] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/", { replace: true });
        return;
      }

      const { data: existing } = await supabase
        .from("users")
        .select("church_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("users").upsert(
          {
            id: user.id,
            email: user.email,
            onboarding_step: "church",
            church_id: null,
            weekly_cap: null,
            bank_connected: false,
          },
          { onConflict: "id" }
        );
      } else if (existing?.church_id) {
        setSelected(existing.church_id);
      }

      let { data: churchList, error: churchErr } = await supabase
        .from("churches")
        .select("id, name, city, state")
        .eq("active", true)
        .order("name");

      // Fallback if city/state columns not yet available
      if (churchErr) {
        const fallback = await supabase
          .from("churches")
          .select("id, name")
          .eq("active", true)
          .order("name");
        churchList = fallback.data;
      }

      setChurches(churchList ?? []);

      setLoading(false);
    }

    init();
  }, [navigate]);

  const filtered = search.trim().length > 0
    ? churches.filter((c) => {
        const q = search.toLowerCase();
        return (
          c.name?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q)
        );
      })
    : [];

  async function continueNext() {
    if (!selected) return;

    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error, data } = await supabase
        .from("users")
        .update({ church_id: selected, onboarding_step: "bank", weekly_cap: null, church_joined_at: new Date().toISOString() })
        .eq("id", user.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Update did not persist");

      // Migrate existing feed posts to the new church so badges follow the user
      await supabase.rpc("migrate_feed_posts_to_church", {
        p_new_church_id: selected,
      });

      navigate("/bank", { replace: true });
    } catch (err) {
      console.error("Church save error:", err);
      setError("Unable to save your selection. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="onboarding-page">
        <div className="center" style={{ minHeight: "60vh" }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      <div className="progress-indicator">
        <div className="progress-dot is-active" />
        <div className="progress-dot" />
      </div>

      <h1>Find your church</h1>
      <p className="onboarding-subtext">
        Search by church name or city to get started.
      </p>

      {error && (
        <div className="alert alert-danger mb-4">
          {error}
        </div>
      )}

      <div className="church-search-wrap">
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="church-search-icon"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="church-search-input"
          autoFocus
        />
      </div>

      {search.trim().length > 0 && filtered.length === 0 && (
        <p className="church-no-results">
          No churches found. Email <a href="mailto:info@stewardingchange.org">info@stewardingchange.org</a> to request your church be added.
        </p>
      )}

      <div className="church-list">
        {filtered.map((church) => {
          const isSelected = selected === church.id;
          const location = [church.city, church.state].filter(Boolean).join(", ");

          return (
            <div
              key={church.id}
              className={`church-card ${isSelected ? "selected" : ""}`}
              onClick={() => setSelected(church.id)}
            >
              <div className="church-card-header">
                <div>
                  <h3>{church.name}</h3>
                  {location && (
                    <p className="church-address">{location}</p>
                  )}
                </div>
                {isSelected && <span className="checkmark">✓</span>}
              </div>

              {isSelected && (
                <button
                  className="church-continue-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    continueNext();
                  }}
                >
                  Continue →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
