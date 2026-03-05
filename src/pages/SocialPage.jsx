import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { BADGE_DISPLAY } from "../services/badgeService";

const REACTIONS = [
  { emoji: "🙏", label: "Amen" },
  { emoji: "🙌", label: "Praise" },
  { emoji: "🔥", label: "Let's Go" },
  { emoji: "👍", label: "Like" },
];

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

// ── Feed item (Venmo-style) ───────────────────────────────────────────────────

function FeedItem({ item, myEmoji, reactionCounts, onReact, isLast }) {
  const { type, authorName, authorInitial, body, badge, createdAt, postId, isPinned } = item;

  return (
    <div className={`social-feed-item${isPinned ? " is-pinned" : ""}${isLast ? " is-last" : ""}`}>
      {isPinned && <div className="social-pinned-label">Pinned</div>}

      <div className="social-item-row">
        {/* Avatar */}
        <div className="social-item-avatar">{authorInitial}</div>

        {/* Content */}
        <div className="social-item-content">
          <div className="social-item-header">
            <span className="social-item-name">{authorName}</span>
            <span className="social-item-time">{timeAgo(createdAt)}</span>
          </div>

          {badge && (
            <div className="social-item-badge-line">
              <span className="social-badge-emoji">{badge.emoji}</span>
              <span className="social-badge-name">earned {badge.name}</span>
            </div>
          )}

          <p className="social-item-body">{body}</p>

          {/* Reactions — only for church feed posts */}
          {postId && (
            <div className="social-item-reactions">
              {REACTIONS.map(({ emoji, label }) => {
                const count    = reactionCounts?.[emoji] ?? 0;
                const isActive = myEmoji === emoji;
                return (
                  <button
                    key={emoji}
                    className={`feed-reaction-btn${isActive ? " is-active" : ""}`}
                    onClick={() => onReact?.(emoji)}
                    title={label}
                  >
                    {emoji}
                    {count > 0 && <span className="feed-reaction-count">{count}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SocialPage ────────────────────────────────────────────────────────────────

export default function SocialPage() {
  const nav = useNavigate();

  const [loading,      setLoading]      = useState(true);
  const [authUser,     setAuthUser]     = useState(null);
  const [profile,      setProfile]      = useState(null);
  const [church,       setChurch]       = useState(null);
  const [banners,      setBanners]      = useState([]);
  const [myBadges,     setMyBadges]     = useState([]);  // from user_badges directly
  const [posts,        setPosts]        = useState([]);
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

      // Always fetch user's own badges regardless of church
      const { data: earnedRows } = await supabase
        .from("user_badges")
        .select("badge_id, awarded_at")
        .eq("user_id", user.id)
        .order("awarded_at", { ascending: false });

      setMyBadges(earnedRows ?? []);

      if (!churchId) { setLoading(false); return; }

      // Church-scoped fetches
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
          .order("church_id", { nullsFirst: false })
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
      console.log("[SocialPage] churchId:", churchId, "posts fetched:", allPosts.length, allPosts);
      setPosts(allPosts);

      // Fetch reactions
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

    setReactionState((prev) => {
      const slot = { ...(prev[postId] ?? { _myEmoji: null }) };
      if (current) {
        slot[current] = Math.max(0, (slot[current] ?? 1) - 1);
        if (slot[current] === 0) delete slot[current];
      }
      if (current === emoji) {
        slot._myEmoji = null;
      } else {
        slot[emoji]   = (slot[emoji] ?? 0) + 1;
        slot._myEmoji = emoji;
      }
      return { ...prev, [postId]: slot };
    });

    if (current) {
      await supabase.from("feed_reactions").delete()
        .eq("post_id", postId).eq("user_id", authUser.id).eq("emoji", current);
    }
    if (current !== emoji) {
      await supabase.from("feed_reactions")
        .upsert({ post_id: postId, user_id: authUser.id, emoji }, { onConflict: "post_id,user_id,emoji" });
    }
  }

  // ── Build unified feed items from posts ───────────────────────────────────

  const feedItems = posts.map((post) => {
    const authorName    = post.users?.first_name ?? "A member";
    const badgeInfo     = post.badge_id ? BADGE_DISPLAY.find((b) => b.id === post.badge_id) : null;
    const slot          = reactionState[post.id] ?? { _myEmoji: null };
    const { _myEmoji, ...counts } = slot;
    return {
      key:            post.id,
      type:           "post",
      postId:         post.id,
      authorName,
      authorInitial:  authorName.charAt(0).toUpperCase(),
      body:           post.body,
      badge:          badgeInfo ?? null,
      createdAt:      post.created_at,
      isPinned:       post.is_pinned,
      myEmoji:        _myEmoji,
      reactionCounts: counts,
    };
  });

  // ── My earned badges (always shown, pull directly from user_badges) ────────

  const firstName    = profile?.first_name ?? "You";
  const firstInitial = firstName.charAt(0).toUpperCase();

  const myBadgeItems = myBadges.map((row) => {
    const badgeInfo = BADGE_DISPLAY.find((b) => b.id === row.badge_id);
    if (!badgeInfo) return null;
    return {
      key:           `badge-${row.badge_id}`,
      type:          "my_badge",
      postId:        null,          // no reactions on personal badge items
      authorName:    firstName,
      authorInitial: firstInitial,
      body:          badgeInfo.desc,
      badge:         badgeInfo,
      createdAt:     row.awarded_at,
      isPinned:      false,
      myEmoji:       null,
      reactionCounts: {},
    };
  }).filter(Boolean);

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

      <div className="dash-body">
        <div className="container-narrow stack-7">

          {/* ── Church header ── */}
          <div className="stack-1">
            {church && <div className="kicker"><span className="dot" />{church.name}</div>}
            <h2 style={{ margin: 0 }}>Stewarding Social</h2>
            <p className="muted" style={{ margin: 0 }}>
              See what your church community is accomplishing together.
            </p>
          </div>

          {/* ── Mission progress ── */}
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

          {/* ── Banners ── */}
          {banners.map((banner) => (
            <div key={banner.id} className="dash-status-banner is-active"
                 style={{ flexDirection: "column", alignItems: "flex-start", gap: "var(--s-2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", width: "100%" }}>
                <div className="status-dot is-active" />
                <div style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-2)", color: "var(--color-text-primary)", flex: 1 }}>
                  {banner.title}
                </div>
                {banner.video_url && (
                  <a href={banner.video_url} target="_blank" rel="noopener noreferrer"
                     className="btn btn-sm btn-secondary" style={{ flexShrink: 0 }}>
                    Watch Video
                  </a>
                )}
              </div>
              <p className="small muted" style={{ margin: 0, paddingLeft: "calc(8px + var(--s-3))" }}>
                {banner.message}
              </p>
            </div>
          ))}

          {/* ── My Badges ── */}
          {myBadgeItems.length > 0 && (
            <div className="stack-3">
              <h3 style={{ margin: 0 }}>My Badges</h3>
              <div className="social-feed-list">
                {myBadgeItems.map((item, i) => (
                  <FeedItem
                    key={item.key}
                    item={item}
                    isLast={i === myBadgeItems.length - 1}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Community Feed ── */}
          <div className="stack-3">
            <h3 style={{ margin: 0 }}>Community Feed</h3>

            {feedItems.length === 0 ? (
              <div className="dash-status-banner is-pending">
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
                  <div className="status-dot is-pending" />
                  <span className="small muted">
                    No activity yet — badge posts will appear here as members earn them.
                  </span>
                </div>
              </div>
            ) : (
              <div className="social-feed-list">
                {feedItems.map((item, i) => (
                  <FeedItem
                    key={item.key}
                    item={item}
                    myEmoji={item.myEmoji}
                    reactionCounts={item.reactionCounts}
                    onReact={(emoji) => handleReact(item.postId, emoji)}
                    isLast={i === feedItems.length - 1}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
