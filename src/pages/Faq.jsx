import { useState } from "react";
import { Link } from "react-router-dom";

const faqs = [
  {
    q: "What is a tithe?",
    a: "A tithe is a biblical practice of giving 10% of your income to your church. The word \"tithe\" literally means \"a tenth.\" It's referenced throughout the Bible as a way to honor God with your finances and support the work of the church.",
  },
  {
    q: "How does Stewarding Change work?",
    a: "You link your bank account, choose your church, and set a monthly cap. Every time you make a purchase, the amount rounds up to the nearest dollar. That spare change goes directly to your church's active mission — automatically.",
  },
  {
    q: "Should I tithe on gross or net income?",
    a: "This is a personal decision. Some people tithe on their gross (pre-tax) income, while others tithe on their net (after-tax) income. Both are valid — what matters most is giving cheerfully and consistently.",
  },
  {
    q: "Do I have to give exactly 10%?",
    a: "No. A tithe of 10% is a biblical guideline, not a strict requirement. Many Christians use it as a starting point. You're free to give any amount you're comfortable with — even small, consistent giving makes an impact.",
  },
  {
    q: "Is my giving tax-deductible?",
    a: "Yes. Donations made through Stewarding Change to your church are tax-deductible. You'll receive records of your giving that you can use when filing your taxes.",
  },
  {
    q: "What if I want to stop or pause?",
    a: "You're always in full control. You can pause giving, adjust your monthly cap, or disconnect your bank at any time from your dashboard — no questions asked.",
  },
  {
    q: "Is my bank information safe?",
    a: "Absolutely. We use bank-grade encryption and never store your banking credentials. Your financial data is handled securely through trusted, industry-standard providers.",
  },
  {
    q: "How much does it cost to use Stewarding Change?",
    a: "Stewarding Change is completely free for givers. There are no fees or deductions from your donations — 100% of your round-ups go directly to your church.",
  },
  {
    q: "My church isn't listed — can I still use it?",
    a: "Yes! If your church isn't on the platform yet, just email us at info@stewardingchange.org and let us know. We'll reach out to your church and work to get them set up so you can start giving.",
  },
  {
    q: "Do you have access to my bank account?",
    a: "No. We never hold your money and we never have access to your bank login or account details. Your round-ups are calculated once a week and transferred directly to your church — we simply facilitate the connection. Your information is handled securely through trusted, bank-level providers.",
  },
  {
    q: "What happens to my money if my church leaves the platform?",
    a: "If your church ever leaves Stewarding Change, all giving is immediately paused. No money is taken without an active church to receive it. Any funds already in transit go directly to your church as intended, and if anything can't be delivered, it's returned to you.",
  },
  {
    q: "Can I see where my money actually goes?",
    a: "Absolutely. Your church updates their active mission and goals on a regular basis, and many churches post video updates directly on the mission feed so you can see the real-world impact of your giving. You'll always know exactly what your spare change is helping accomplish.",
  },
  {
    q: "I already give at church on Sundays. Is this a replacement?",
    a: "Not at all — Stewarding Change is designed to complement your existing giving, not replace it. Think of it as an easy way to give a little extra throughout the week without even thinking about it. Whether you give at church, here, or both, every bit makes a difference. There's no pressure either way.",
  },
  {
    q: "How do I get my tax receipt?",
    a: "At the end of each year, a tax receipt summarizing all of your donations will be sent to the email address on your account. You can use it when filing your taxes — no need to track anything yourself.",
  },
  {
    q: "Who is behind Stewarding Change?",
    a: "Stewarding Change was founded by Terence and Andrew — two friends who met working at Waffle House. Terence is a father of one, a restaurant GM, and a lifelong entrepreneur. Andrew is a father of three and a lead pastor at Countryside Christian in Clearwater, FL. They built this because they believe giving should be simple, honest, and something everyone can do — no matter how small the amount.",
  },
];

export default function Faq() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="faq-page">
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
        </div>
      </header>

      <main className="container" style={{ paddingTop: "var(--s-9)", paddingBottom: "var(--s-12)" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 36px)", fontWeight: "var(--fw-bold)", marginBottom: "var(--s-3)" }}>
            Frequently Asked Questions
          </h1>
          <p className="muted" style={{ fontSize: "var(--fs-2)", marginBottom: "var(--s-7)" }}>
            Everything you need to know about Stewarding Change.
          </p>

          <div className="tithe-faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className={`tithe-faq-item ${openFaq === i ? "is-open" : ""}`}>
                <button
                  className="tithe-faq-question"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{faq.q}</span>
                  <svg
                    width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="tithe-faq-chevron"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div className="tithe-faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FAQ structured data for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.a,
              },
            })),
          }),
        }}
      />
    </div>
  );
}
