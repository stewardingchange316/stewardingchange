import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <Link to="/" className="landing-brand">
          <div className="landing-brand-mark">
            <img src="/logo.png" alt="Stewarding Change" />
          </div>
          <span>Stewarding Change</span>
        </Link>
        <div className="landing-nav-cta">
          <Link to="/" className="landing-btn-sm">Home</Link>
        </div>
      </nav>

      <main className="about-page">
        {/* Mission */}
        <section className="about-mission">
          <span className="landing-eyebrow" style={{ marginBottom: 24 }}>
            <span className="landing-eyebrow-dot" />
            Our mission
          </span>
          <h1 className="about-mission-headline">
            Raise <span className="landing-serif">$100 billion</span> for the Kingdom of God.
          </h1>
          <p className="about-mission-sub">
            It's a bold number. It came from prayer, not a spreadsheet. We believe that if giving
            becomes effortless — woven into everyday life — then ordinary people can fund
            extraordinary things. One round-up at a time, for as long as it takes.
          </p>
        </section>

        {/* Origin story */}
        <section className="about-story">
          <h2 className="about-section-heading">How we got here</h2>
          <div className="about-timeline">
            <div className="about-timeline-item">
              <div className="about-timeline-dot" />
              <div className="about-timeline-content">
                <h4>Blue collar beginnings</h4>
                <p>
                  Terence and Andrew met working at Waffle House. Not at a tech conference, not
                  at a startup weekend — at a grill, on the night shift. They spent three years
                  side by side, building a friendship rooted in hard work and shared faith.
                </p>
              </div>
            </div>
            <div className="about-timeline-item">
              <div className="about-timeline-dot" />
              <div className="about-timeline-content">
                <h4>COVID pulled them apart</h4>
                <p>
                  When the pandemic hit, life took them in different directions. Terence leaned
                  into restaurant management and entrepreneurship. Andrew answered his calling
                  and became lead pastor at Countryside Christian in Clearwater, FL.
                </p>
              </div>
            </div>
            <div className="about-timeline-item">
              <div className="about-timeline-dot" />
              <div className="about-timeline-content">
                <h4>Reunited with a purpose</h4>
                <p>
                  Years later, they reconnected — and realized the thing they both cared about
                  most hadn't changed: making it easier for people to give. Andrew saw his
                  congregation struggle to give consistently. Terence saw a product that could
                  solve it. Stewarding Change was born.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Founders */}
        <section className="about-founders">
          <h2 className="about-section-heading">The founders</h2>
          <div className="about-founders-grid">
            <div className="about-founder-card">
              <div className="about-founder-photo">
                <span>TH</span>
              </div>
              <div className="about-founder-info">
                <h3>Terence Hinton</h3>
                <span className="about-founder-role">Co-Founder & CEO</span>
                <p>
                  Father of one, restaurant GM, and a lifelong entrepreneur. Terence believes
                  that giving should be effortless — something you never have to think twice
                  about. He built Stewarding Change to make that a reality.
                </p>
              </div>
            </div>
            <div className="about-founder-card">
              <div className="about-founder-photo">
                <span>AD</span>
              </div>
              <div className="about-founder-info">
                <h3>Andrew Davis</h3>
                <span className="about-founder-role">Co-Founder & Pastor</span>
                <p>
                  Father of three and lead pastor at Countryside Christian in Clearwater, FL.
                  Andrew saw firsthand how small, consistent giving transforms a church's ability
                  to serve its community — and how hard it is to make that consistent.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Countryside Christian */}
        <section className="about-church">
          <div className="about-church-card">
            <h3>Our first partner church</h3>
            <p>
              <strong>Countryside Christian</strong> in Clearwater, FL is where Stewarding Change
              started. They were the first church to believe in this vision, and their congregation
              is actively using round-ups to fund real missions — right now.
            </p>
            <div className="about-church-actions">
              <Link to="/add-church" className="landing-btn landing-btn-primary" style={{ fontSize: 14, padding: "12px 20px" }}>
                Add your church
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="about-contact">
          <p>
            Questions? Reach us at{" "}
            <a href="mailto:terence@stewardingchange.org" className="about-email">
              terence@stewardingchange.org
            </a>
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <Link to="/" className="landing-brand" style={{ fontSize: "15px" }}>
            <div className="landing-brand-mark" style={{ width: "24px", height: "24px" }}>
              <img src="/logo.png" alt="" />
            </div>
            Stewarding Change
          </Link>
          <div className="landing-footer-links">
            <Link to="/faq">FAQ</Link>
            <Link to="/about">About</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
          <div className="landing-footer-copy">
            &copy; {new Date().getFullYear()} Stewarding Change
          </div>
        </div>
      </footer>
    </div>
  );
}
