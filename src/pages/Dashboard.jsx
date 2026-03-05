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
  const [myBadges,           setMyBadges]           = useState([]);
  const [paused,             setPaused]             = useState(false);
  const [showBadgesModal,    setShowBadgesModal]    = useState(false);
  const [showEditProfile,    setShowEditProfile]    = useState(false);
  const [menuOpen,           setMenuOpen]           = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        nav("/", { replace: true });
        return;
      }

      const user = session.user;
      setAuthUser(user);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Failed to load profile:", error);
        nav("/", { replace: true });
        return;
      }

      setProfile(data);
      setPaused(data.giving_paused ?? false);

      if (data.church_id) {
        const { data: churchData } = await supabase
          .from("churches")
          .select("name, mission_label, mission_title, mission_description, mission_progress")
          .eq("id", data.church_id)
          .maybeSingle();
        setChurch(churchData);
      }

      // Fetch earned badges for header display
      const { data: badgeRows } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", user.id);
      setMyBadges(badgeRows ?? []);

      setLoading(false);

      // Background badge check — fire and forget, does not block render
      checkAndAwardBadges(user.id).catch(console.error);
    }

    load();
  }, [nav]);

  async function handleTogglePause() {
    const next = !paused;
    setPaused(next);
    await supabase
      .from("users")
      .update({ giving_paused: next })
      .eq("id", authUser.id);
  }

  async function handleDisconnectBank() {
    if (!confirm("Disconnect your bank account? Giving will stop immediately. You can reconnect at any time.")) return;
    await supabase
      .from("users")
      .update({ bank_connected: false, giving_paused: false })
      .eq("id", authUser.id);
    setProfile((p) => ({ ...p, bank_connected: false }));
    setPaused(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
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
    ? "No limit"
    : typeof profile.weekly_cap === "number"
    ? `$${profile.weekly_cap} / week`
    : "Not set";

  const initials = firstName.charAt(0).toUpperCase();

  // Close menu on outside click
  useEffect(() => {
    function onOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

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
            {/* Earned badge strip */}
            {earnedEmojis.length > 0 && (
              <div className="social-header-badges" onClick={() => setShowBadgesModal(true)}
                   title="My Badges" style={{ cursor: "pointer" }}>
                {earnedEmojis.slice(0, 5).map((emoji, i) => (
                  <span key={i} className="social-header-badge-emoji">{emoji}</span>
                ))}
                {earnedEmojis.length > 5 && (
                  <span className="social-header-badge-more">+{earnedEmojis.length - 5}</span>
                )}
              </div>
            )}
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

          {/* ── Social teaser ── */}
          {church && (
            <div className="card stack-3" style={{ textAlign: "center", cursor: "pointer" }} onClick={() => nav("/social")}>
              <div className="kicker" style={{ justifyContent: "center", marginBottom: 0 }}>
                <span className="dot" />{church.name}
              </div>
              <h3 style={{ margin: 0 }}>See the community feed</h3>
              <p className="muted" style={{ margin: 0, fontSize: "var(--fs-2)" }}>
                Check out what your church is accomplishing — badges, milestones, and more.
              </p>
              <button className="btn btn-secondary btn-sm" style={{ alignSelf: "center" }}>
                Open Stewarding Social
              </button>
            </div>
          )}

          {/* ── Giving stats row ── */}
          <div className="dash-stats">
            <div className="dash-stat">
              <div className="dash-stat-label">This Month</div>
              <div className="dash-stat-value">$0.00</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-label">All Time</div>
              <div className="dash-stat-value">$0.00</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-label">Transactions</div>
              <div className="dash-stat-value">0</div>
            </div>
          </div>

          {/* ── Giving status banner (when bank connected) ── */}
          {bankConnected && (
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
          )}

          {/* ── Bank connect prompt (when not connected) ── */}
          {!bankConnected && (
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

          {/* ── Account card ── */}
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
                <div className="dash-row-label">Weekly Cap</div>
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
              All donations are 100% tax-deductible. Weekly statements and an annual giving
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
