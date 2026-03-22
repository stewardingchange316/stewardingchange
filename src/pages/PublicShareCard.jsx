import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function PublicShareCard() {
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); return; }

    supabase
      .from("share_cards")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setCard(data);
      });
  }, [id]);

  if (notFound) {
    return (
      <div className="sc-public-page">
        <div className="sc-public-card">
          <h2>Card not found</h2>
          <p className="muted">This share link may have expired.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>
            Visit Stewarding Change
          </Link>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="sc-public-page">
        <div className="spinner" />
      </div>
    );
  }

  const memberDate = new Date(card.member_since).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="sc-public-page">
      <div className="sc-public-card">
        <div className="sc-public-brand">
          <img src="/logo.png" alt="" style={{ width: 28, height: 28 }} />
          <span>Stewarding Change</span>
        </div>

        <div className="sc-public-avatar">
          {card.first_name.charAt(0).toUpperCase()}
        </div>

        <h1 className="sc-public-name">{card.first_name}</h1>
        {card.church_name && (
          <div className="sc-public-church">{card.church_name}</div>
        )}
        <div className="sc-public-since">Member since {memberDate}</div>

        <div className="sc-public-stats">
          <div className="sc-public-stat">
            <div className="sc-public-stat-val">${Math.round(card.total_given)}</div>
            <div className="sc-public-stat-label">total given</div>
          </div>
          <div className="sc-public-stat-divider" />
          <div className="sc-public-stat">
            <div className="sc-public-stat-val">{card.streak_weeks}</div>
            <div className="sc-public-stat-label">week streak</div>
          </div>
          <div className="sc-public-stat-divider" />
          <div className="sc-public-stat">
            <div className="sc-public-stat-val">{card.badges_earned}</div>
            <div className="sc-public-stat-label">badges</div>
          </div>
        </div>

        {card.badge_emojis?.length > 0 && (
          <div className="sc-public-badges">
            {card.badge_emojis.map((emoji, i) => (
              <span key={i}>{emoji}</span>
            ))}
          </div>
        )}

        <div className="sc-public-cta-section">
          <p>Your spare change can make a difference too.</p>
          <Link to="/" className="btn btn-primary btn-lg">
            Start Giving
          </Link>
        </div>

        <div className="sc-public-footer">stewardingchange.org</div>
      </div>
    </div>
  );
}
