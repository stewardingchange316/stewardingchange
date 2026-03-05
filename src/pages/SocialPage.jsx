import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { BADGE_DISPLAY } from "../services/badgeService";

// Reaction options matching user spec
const REACTIONS = [
  { emoji: "🙏", label: "Amen" },
  { emoji: "🙌", label: "Praise" },
  { emoji: "🔥", label: "Let's Go" },
  { emoji: "👍", label: "Like" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function badgeDisplay(badgeId) {
  return BADGE_DISPLAY.find((b) => b.id === badgeId);
}

// ── FeedPostCard ──────────────────────────────────────────────────────────────

function FeedPostCard({ post, myEmoji, reactionCounts, onReact }) {
  const authorName = post.users?.first_name ?? "A member";
  const badge      = post.badge_id ? badgeDisplay(post.badge_id) : null;

  return (
    <div className={`feed-post-card${post.is_pinned ? " is-pinned" : ""}`}>
      {post.is_pinned && <div className="feed-post-pinned-label">Pinned</div>}

      <div className="feed-post-header">
        <div className="feed-post-avatar">{authorName.charAt(0).toUpperCase()}</div>
        <div>
          <div style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-2)", color: "var(--color-text-primary)" }}>
            {authorName}
          </div>
          <div className="small muted">{timeAgo(post.created_at)}</div>
        </div>
        {badge && (
          <span style={{ marginLeft: "auto", fontSize: "20px" }} title={badge.name}>
            {badge.emoji}
          </span>
        )}
      </div>

      <p style={{ margin: "var(--s-3) 0 0", fontSize: "var(--fs-2)", color: "var(--color-text-body)", lineHeight: "var(--lh-normal)" }}>
        {post.body}
      </p>

      {/* ── Reactions ── */}
      <div className="feed-post-reactions">
        {REACTIONS.map(({ emoji, label }) => {
          const count    = reactionCounts[emoji] ?? 0;
          const isActive = myEmoji === emoji;
          return (
            <button
              key={emoji}
              className={`feed-reaction-btn${isActive ? " is-active" : ""}`}
              onClick={() => onReact(emoji)}
              title={label}
            >
              {emoji}
              {count > 0 && (
                <span className="feed-reaction-count">{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── SocialPage ────────────────────────────────────────────────────────────────

export default function SocialPage() {
  const nav = useNavigate();

  const [loading,   setLoading]   = useState(true);
  const [authUser,  setAuthUser]  = useState(null);
  const [profile,   setProfile]   = useState(null);
  const [church,    setChurch]    = useState(null);
  const [banners,   setBanners]   = useState([]);
  const [posts,     setPosts]     = useState([]);
  // reactionState: { [postId]: { [emoji]: count, _myEmoji: string|null } }
  const [reactionState, setReactionState] = useState({});

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { nav("/", { replace: true }); return; }

      const user = session.user;
      setAuthUser(user);

      const { data: profileData, error: profileErr } = await supabase
        .from("users")
        .select("church_id, first_name")
        .eq("id", user.id)
        .single();

      if (profileErr) { setLoading(false); return; }
      setProfile(profileData);

      const churchId = profileData.church_id;
      if (!churchId) { setLoading(false); return; }

      // Parallel fetches
      const [
        { data: churchData },
        { data: bannerData },
        { data: postData },
      ] = await Promise.all([
        supabase
          .from("churches")
          .select("name, mission_title, mission_description, mission_progress")
          .eq("id", churchId)
          .single(),
        supabase
          .from("church_banners")
          .select("*")
          .or(`church_id.eq.${churchId},church_id.is.null`)
          .eq("is_active", true)
          .order("church_id", { nullsFirst: false })  // church-specific first, global last
          .order("created_at", { ascending: false }),
        supabase
          .from("social_feed_posts")
          .select("id, post_type, body, badge_id, is_pinned, created_at, users(first_name)")
          .eq("church_id", churchId)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      setChurch(churchData ?? null);
      setBanners(bannerData ?? []);

      const allPosts = postData ?? [];
      setPosts(allPosts);

      // Fetch reactions for all posts
      const postIds = allPosts.map((p) => p.id);
      if (postIds.length > 0) {
        const { data: reactionData } = await supabase
          .from("feed_reactions")
          .select("post_id, user_id, emoji")
          .in("post_id", postIds);

        const rMap = {};
        for (const r of (reactionData ?? [])) {
          if (!rMap[r.post_id]) rMap[r.post_id] = { _myEmoji: null };
          rMap[r.post_id][r.emoji] = (rMap[r.post_id][r.emoji] ?? 0) + 1;
          if (r.user_id === user.id) rMap[r.post_id]._myEmoji = r.emoji;
        }
        setReactionState(rMap);
      }

      setLoading(false);
    }

    load();
  }, [nav]);

  async function handleReact(postId, emoji) {
    if (!authUser) return;

    const current = reactionState[postId]?._myEmoji ?? null;

    // Optimistic update
    setReactionState((prev) => {
      const slot = { ...(prev[postId] ?? { _myEmoji: null }) };

      // Remove previous reaction
      if (current) {
        slot[current] = Math.max(0, (slot[current] ?? 1) - 1);
        if (slot[current] === 0) delete slot[current];
      }

      if (current === emoji) {
        // Toggle off
        slot._myEmoji = null;
      } else {
        // Add new
        slot[emoji]   = (slot[emoji] ?? 0) + 1;
        slot._myEmoji = emoji;
      }

      return { ...prev, [postId]: slot };
    });

    // Persist
    if (current) {
      await supabase
        .from("feed_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", authUser.id)
        .eq("emoji", current);
    }

    if (current !== emoji) {
      await supabase
        .from("feed_reactions")
        .upsert(
          { post_id: postId, user_id: authUser.id, emoji },
          { onConflict: "post_id,user_id,emoji" }
        );
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading || !profile) {
    return (
      <>
        <header className="header">
          <div className="header-inner">
            <Link to="/dashboard" className="brand">
              <img src="/logo.png" alt="Stewarding Change" className="brand-mark"
                   style={{ height: "36px", width: "36px", objectFit: "contain" }} />
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

  // ── No church selected ────────────────────────────────────────────────────

  if (!profile.church_id) {
    return (
      <div className="dash-root">
        <header className="header">
          <div className="header-inner">
            <Link to="/dashboard" className="brand">
              <img src="/logo.png" alt="Stewarding Change" className="brand-mark"
                   style={{ height: "36px", width: "36px", objectFit: "contain" }} />
              <span className="brand-name">Stewarding Change</span>
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={() => nav("/dashboard")}>← Dashboard</button>
          </div>
        </header>
        <div className="dash-body">
          <div className="container-narrow">
            <div className="card stack-4">
              <p className="muted" style={{ margin: 0 }}>
                You haven't selected a church yet.{" "}
                <button className="link-button" onClick={() => nav("/church-select")}>Choose one</button>
                {" "}to see your community feed.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="dash-root">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <Link to="/dashboard" className="brand">
            <img src="/logo.png" alt="Stewarding Change" className="brand-mark"
                 style={{ height: "36px", width: "36px", objectFit: "contain" }} />
            <span className="brand-name">Stewarding Change</span>
          </Link>
          <button className="btn btn-ghost btn-sm" onClick={() => nav("/dashboard")}>
            ← Dashboard
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="dash-body">
        <div className="container-narrow stack-7">

          {/* ── Church header ── */}
          <div className="stack-1">
            {church && (
              <div className="kicker"><span className="dot" />{church.name}</div>
            )}
            <h2 style={{ margin: 0 }}>Stewarding Social</h2>
            <p className="muted" style={{ margin: 0 }}>
              See what your church community is accomplishing together.
            </p>
          </div>

          {/* ── Impact stats (mission progress from church) ── */}
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
            </div>
          )}

          {/* ── Pinned banners ── */}
          {banners.map((banner) => (
            <div key={banner.id} className="dash-status-banner is-active"
                 style={{ flexDirection: "column", alignItems: "flex-start", gap: "var(--s-2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", width: "100%" }}>
                <div className="status-dot is-active" />
                <div style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-2)", color: "var(--color-text-primary)", flex: 1 }}>
                  {banner.title}
                </div>
                {banner.video_url && (
                  <a
                    href={banner.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-secondary"
                    style={{ flexShrink: 0 }}
                  >
                    Watch Video
                  </a>
                )}
              </div>
              <p className="small muted" style={{ margin: 0, paddingLeft: "calc(8px + var(--s-3))" }}>
                {banner.message}
              </p>
            </div>
          ))}

          {/* ── Community feed ── */}
          <div className="stack-4">
            <h3 style={{ margin: 0 }}>Community Feed</h3>

            {posts.length === 0 ? (
              <div className="dash-status-banner is-pending">
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
                  <div className="status-dot is-pending" />
                  <span className="small muted">
                    No posts yet — be the first to earn a badge!
                  </span>
                </div>
              </div>
            ) : (
              posts.map((post) => {
                const slot = reactionState[post.id] ?? { _myEmoji: null };
                const { _myEmoji, ...counts } = slot;
                return (
                  <FeedPostCard
                    key={post.id}
                    post={post}
                    myEmoji={_myEmoji}
                    reactionCounts={counts}
                    onReact={(emoji) => handleReact(post.id, emoji)}
                  />
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
