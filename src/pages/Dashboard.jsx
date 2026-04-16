import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import BadgesModal from "../components/BadgesModal";
import EditProfileModal from "../components/EditProfileModal";
import { checkAndAwardBadges, BADGE_DISPLAY } from "../services/badgeService";

export default function Dashboard() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [church, setChurch] = useState(null);
  const [banners, setBanners] = useState([]);
  const [myBadges,           setMyBadges]           = useState([]);
  const [paused,             setPaused]             = useState(false);
  const [showBadgesModal,    setShowBadgesModal]    = useState(false);
  const [showEditProfile,    setShowEditProfile]    = useState(false);
  const [menuOpen,           setMenuOpen]           = useState(false);
  const menuRef = useRef(null);

  // Close avatar menu on outside click — must be before any early returns
  useEffect(() => {
    function onOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          nav("/", { replace: true });
          return;
        }

        const user = session.user;
        if (cancelled) return;
        setAuthUser(user);

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error || !data) {
          console.error("Failed to load profile:", error);
          nav("/", { replace: true });
          return;
        }

        if (cancelled) return;
        setProfile(data);
        setPaused(data.giving_paused ?? false);

        if (data.church_id) {
          const { data: churchData } = await supabase
            .from("churches")
            .select("name, mission_label, mission_title, mission_description, mission_progress")
            .eq("id", data.church_id)
            .maybeSingle();

          if (cancelled) return;
          setChurch(churchData);

          const { data: bannerData } = await supabase
            .from("church_banners")
            .select("*")
            .or(`church_id.eq.${data.church_id},church_id.is.null`)
            .eq("is_active", true)
            .order("church_id", { nullsFirst: false })
            .order("created_at", { ascending: false });

          if (cancelled) return;
          setBanners(bannerData ?? []);
        }

        const { data: badgeRows } = await supabase
          .from("user_badges")
          .select("badge_id")
          .eq("user_id", user.id);

        if (cancelled) return;
        setMyBadges(badgeRows ?? []);

        checkAndAwardBadges(user.id).catch(console.error);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [nav]);

  async function handleTogglePause() {
    const next = !paused;
    setPaused(next);
    try {
      const { error } = await supabase
        .from("users")
        .update({ giving_paused: next })
        .eq("id", authUser.id);
      if (error) throw error;
    } catch (err) {
      console.error("Toggle pause error:", err);
      setPaused(!next); // revert on failure
    }
  }

  async function handleDisconnectBank() {
    if (!confirm("Disconnect your bank account? Giving will stop immediately. You can reconnect at any time.")) return;
    try {
      const { error } = await supabase
        .from("users")
        .update({ bank_connected: false, giving_paused: false })
        .eq("id", authUser.id);
      if (error) throw error;
      setProfile((p) => ({ ...p, bank_connected: false }));
      setPaused(false);
    } catch (err) {
      console.error("Disconnect bank error:", err);
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
    nav("/");
  }

  if (loading || !profile) {
    return (
      <>
        <header className="header">
          <div className="header-inner">
            <Link to="/" className="brand">
              <img src="/logo.png" alt="Stewarding Change" className="brand-mark" style={{ height: "36px", width: "36px", objectFit: "contain" }} />
              <span className="brand-name">Stewarding Change</span>
            </Link>
          </div>
        </header>
        <div className="center" style={{ minHeight: "60vh" }}>
          <div className="spinner" />
        </div>
      </>
    );
  }

  /* ── Derived values ── */
  const churchName   = church?.name || "Not selected";
  const bankConnected = profile.bank_connected === true;
  const firstName    = profile.first_name
    || authUser?.user_metadata?.first_name
    || authUser?.email?.split("@")[0]
    || "Friend";

  const givingCap = profile.weekly_cap === null
    ? "No limit set"
    : typeof profile.weekly_cap === "number"
    ? `$${profile.weekly_cap} / month`
    : "No limit set";

  const initials = firstName.charAt(0).toUpperCase();

  const earnedEmojis = myBadges
    .map((row) => BADGE_DISPLAY.find((b) => b.id === row.badge_id)?.emoji)
    .filter(Boolean);

  /* ── UI ── */
  return (
    <>
    <div className="dash-root">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="brand">
            <img
              src="/logo.png"
              alt="Stewarding Change"
              className="brand-mark"
              style={{ height: "36px", width: "36px", objectFit: "contain" }}
            />
            <span className="brand-name">Stewarding Change</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowBadgesModal(true)}>
              🏅 My Badges
            </button>

            {/* Avatar + hamburger menu */}
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                className="avatar-menu-trigger"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Account menu"
              >
                <div className="dash-avatar">{initials}</div>
                <div className="avatar-hamburger">
                  <span /><span /><span />
                </div>
              </button>

              {menuOpen && (
                <div className="avatar-dropdown">
                  <button
                    className="avatar-dropdown-item"
                    onClick={() => { setMenuOpen(false); setShowEditProfile(true); }}
                  >
                    <span>✏️</span> Edit Profile
                  </button>
                  <div className="avatar-dropdown-divider" />
                  <button
                    className="avatar-dropdown-item is-danger"
                    onClick={handleSignOut}
                  >
                    <span>→</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Page body ── */}
      <div className="dash-body">
        <div className="container-narrow stack-7">

          {/* ── Welcome ── */}
          <div className="stack-1">
            <h2 style={{ margin: 0 }}>Welcome back, {firstName}</h2>
            <p className="muted" style={{ margin: 0 }}>
              Stewarding with {churchName}
            </p>
          </div>

          {/* ── 1. Mission Progress + Video Box ── */}
          {church && (
            <div className="card stack-5">
              <div className="stack-1">
                <div className="kicker" style={{ marginBottom: 0 }}>
                  <span className="dot" />Mission Progress
                </div>
                <h3 style={{ margin: 0 }}>{church.mission_title || "Mission"}</h3>
              </div>
              {church.mission_description && (
                <p className="muted" style={{ margin: 0, fontSize: "var(--fs-2)" }}>
                  {church.mission_description}
                </p>
              )}
              <div className="stack-2">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="small muted">Progress toward goal</span>
                  <span className="small" style={{ color: "var(--color-brand)", fontWeight: "var(--fw-semibold)" }}>
                    {church.mission_progress ?? 0}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${church.mission_progress ?? 0}%` }} />
                </div>
              </div>

              {banners.map((banner) => {
                // Extract YouTube embed ID from various URL formats
                let embedId = null;
                if (banner.video_url) {
                  const url = banner.video_url;
                  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
                  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
                  const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
                  embedId = shortMatch?.[1] || longMatch?.[1] || embedMatch?.[1] || null;
                }

                return (
                  <div key={banner.id} style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
                    <div className="dash-divider" />

                    {embedId && (
                      <div className="dash-video-wrap">
                        <iframe
                          src={`https://www.youtube.com/embed/${embedId}`}
                          title={banner.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="dash-video-iframe"
                        />
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                      <div className="status-dot is-active" />
                      <div style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-2)", color: "var(--color-text-primary)" }}>
                        {banner.title}
                      </div>
                    </div>
                    {banner.message && (
                      <p className="small muted" style={{ margin: 0 }}>
                        {banner.message}
                      </p>
                    )}

                    {/* Fallback link if not a YouTube URL */}
                    {banner.video_url && !embedId && (
                      <a href={banner.video_url} target="_blank" rel="noopener noreferrer"
                         className="btn btn-sm btn-secondary" style={{ alignSelf: "flex-start" }}>
                        Watch Video
                      </a>
                    )}
                  </div>
                );
              })}

              <button className="btn btn-secondary btn-sm" style={{ alignSelf: "center" }} onClick={() => nav("/social")}>
                See Community Feed
              </button>
            </div>
          )}

          {/* ── 2. Connect Bank Box ── */}
          {bankConnected ? (
            <div className={`dash-status-banner ${paused ? "is-paused" : "is-active"}`}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
                <div className={`status-dot ${paused ? "is-paused" : "is-active"}`} />
                <div>
                  <div style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-2)", color: "var(--color-text-primary)" }}>
                    {paused ? "Giving Paused" : "Giving Active"}
                  </div>
                  <div className="small muted">
                    {paused
                      ? "Resume to continue rounding up purchases"
                      : "Rounding up purchases automatically"}
                  </div>
                </div>
              </div>
              <button
                className={`btn btn-sm ${paused ? "btn-primary" : "btn-secondary"}`}
                onClick={handleTogglePause}
              >
                {paused ? "Resume" : "Pause"}
              </button>
            </div>
          ) : (
            <div className="dash-status-banner is-pending">
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
                <div className="status-dot is-pending" />
                <div>
                  <div style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-2)", color: "var(--color-text-primary)" }}>
                    Bank not connected
                  </div>
                  <div className="small muted">Connect your bank to start giving</div>
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => nav("/bank")}>
                Connect Now
              </button>
            </div>
          )}

          {/* ── 3. Account Box ── */}
          <div className="card stack-5">
            <div className="row-between">
              <h3 style={{ margin: 0 }}>Account</h3>
            </div>

            <div className="dash-row">
              <div>
                <div className="dash-row-label">Church</div>
                <div className="dash-row-value">{churchName}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => nav("/church-select")}>Edit</button>
            </div>

            <div className="dash-divider" />

            <div className="dash-row">
              <div>
                <div className="dash-row-label">Giving Cap</div>
                <div className="dash-row-value">{givingCap}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => nav("/giving-cap")}>Edit</button>
            </div>

            <div className="dash-divider" />

            <div className="dash-row">
              <div>
                <div className="dash-row-label">Bank Account</div>
                <div className="dash-row-value">
                  {bankConnected ? "Connected securely" : "Not connected"}
                </div>
              </div>
              {bankConnected
                ? <button className="btn btn-danger btn-sm" onClick={handleDisconnectBank}>
                    Disconnect
                  </button>
                : <button className="btn btn-primary btn-sm" onClick={() => nav("/bank")}>
                    Connect
                  </button>
              }
            </div>

            <p className="small muted" style={{ margin: 0 }}>
              All donations are 100% tax-deductible. Monthly statements and an annual giving
              summary are provided automatically.
            </p>
          </div>

        </div>
      </div>
    </div>

    {showBadgesModal && (
      <BadgesModal
        userId={authUser.id}
        onClose={() => setShowBadgesModal(false)}
      />
    )}

    {showEditProfile && (
      <EditProfileModal
        userId={authUser.id}
        initialFirstName={profile.first_name ?? ""}
        initialLastName={profile.last_name ?? ""}
        initialEmail={authUser.email ?? ""}
        onClose={() => setShowEditProfile(false)}
        onSaved={(patch) => {
          setProfile((p) => ({ ...p, ...patch }));
          setShowEditProfile(false);
        }}
      />
    )}
    </>
  );
}
