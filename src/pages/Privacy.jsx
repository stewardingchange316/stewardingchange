// src/pages/Privacy.jsx
// IMPORTANT: This document is a draft template and should be reviewed by licensed legal counsel prior to launch.

export default function Privacy() {
  return (
    <div className="page container-narrow">
      <h1 className="page-title">Privacy Policy</h1>
      <p className="page-subtitle">
        Stewarding Change LLC — Effective Date: February 17, 2026
      </p>

      <div className="stack-6">
        <h3>1. Scope & Overview</h3>
        <p>
          Stewarding Change LLC (“Stewarding Change,” “Company,” “we,” “us,” or “our”) respects your
          privacy. This Privacy Policy explains how we collect, use, disclose, and protect
          information when you access or use our platform, website, and related services (the “Service”).
        </p>
        <p>
          This Policy applies to information collected through the Service. It does not apply to
          third-party websites, services, or applications (including Plaid and Stripe) that may be
          linked to or integrated with the Service.
        </p>
        <p>
          The Service is intended for users located in the United States. If you use the Service from
          outside the United States, you understand that your information may be processed in the United States.
        </p>

        <h3>2. Key Definitions</h3>
        <ul>
          <li>
            <strong>“Personal Information”</strong> means information that identifies, relates to,
            describes, is reasonably capable of being associated with, or could reasonably be linked
            with an individual.
          </li>
          <li>
            <strong>“Sensitive Information”</strong> includes certain information that may require
            additional protections under applicable law (for example, certain financial account data).
          </li>
          <li>
            <strong>“Church”</strong> means the organization you select to receive donations facilitated through the Service.
          </li>
          <li>
            <strong>“Service Providers”</strong> means vendors and processors that perform services on our behalf.
          </li>
        </ul>

        <h3>3. Information We Collect</h3>

        <h4>A. Information You Provide</h4>
        <ul>
          <li>Full name (if provided)</li>
          <li>Email address</li>
          <li>Account profile information you submit</li>
          <li>Church selection</li>
          <li>Donation preferences (e.g., giving cap and related settings)</li>
          <li>Support communications (messages you send us)</li>
        </ul>

        <h4>B. Authentication Information (Supabase)</h4>
        <p>
          We use Supabase for authentication and backend services. Your login credentials are handled
          through Supabase authentication. We do not receive or store your raw password in plain text.
        </p>

        <h4>C. Financial Connectivity & Transaction Data (Plaid)</h4>
        <p>
          If you choose to connect a financial account, we use Plaid to access and retrieve certain
          account and transaction data necessary to provide the Service and calculate round-up amounts.
        </p>
        <p>Depending on what you connect and what your financial institution supports, this may include:</p>
        <ul>
          <li>Account metadata (institution name, account type, masked account identifiers)</li>
          <li>Transaction data (merchant, amount, date, category, pending/posted status)</li>
          <li>Balance information (if enabled/available)</li>
        </ul>
        <p>
          <strong>We do not store your bank login credentials.</strong> Plaid provides secure tokens and
          connectivity mechanisms; we rely on those tokens rather than collecting your credentials.
        </p>

        <h4>D. Payment Processing Information (Stripe)</h4>
        <p>
          We use <strong>Stripe, Inc. and its affiliates</strong> to process payments. Payment information is collected
          and processed by Stripe pursuant to Stripe’s terms and privacy policy.
        </p>
        <p>
          <strong>We do not store full bank account numbers, full debit card numbers, or full credit card numbers.</strong>
          We may store limited identifiers and references (e.g., Stripe customer ID, payment method token/ID, and transaction IDs)
          necessary to operate the Service, reconcile activity, prevent fraud, and provide support.
        </p>

        <h4>E. Automatically Collected Data</h4>
        <p>
          When you use the Service, we may automatically collect information such as:
        </p>
        <ul>
          <li>IP address</li>
          <li>Device and browser type and settings</li>
          <li>Approximate location derived from IP (not precise geolocation)</li>
          <li>Usage data (pages viewed, features used, timestamps, referring/exit pages)</li>
          <li>Log and diagnostic data (error reports, performance metrics)</li>
        </ul>

        <h4>F. Cookies & Similar Technologies</h4>
        <p>
          We may use cookies or similar technologies to help the Service function, improve user experience,
          and understand usage patterns. You can control cookies through your browser settings. Disabling cookies
          may affect functionality.
        </p>

        <h3>4. How We Use Information</h3>
        <p>We use information for the following purposes:</p>
        <ul>
          <li>Provide, operate, maintain, and improve the Service</li>
          <li>Authenticate users and secure accounts</li>
          <li>Calculate donation round-ups and enforce user preferences (e.g., caps)</li>
          <li>Initiate authorized payments through Stripe</li>
          <li>Provide donation activity confirmations, receipts, service notices, and support responses</li>
          <li>Send marketing and promotional communications (you may opt out at any time)</li>
          <li>Detect, prevent, and investigate fraud, abuse, or security incidents</li>
          <li>Comply with legal obligations and enforce agreements</li>
        </ul>

        <h3>5. How We Share Information</h3>
        <p>We may disclose information as follows:</p>
        <ul>
          <li>
            <strong>With Third-Party Providers:</strong> including Plaid (financial connectivity) and Stripe, Inc. and its affiliates
            (payment processing), to provide the Service.
          </li>
          <li>
            <strong>With Your Selected Church:</strong> donation reporting and related records reasonably necessary for the Church to
            acknowledge donations, administer donor records, and support donor inquiries.
          </li>
          <li>
            <strong>With Service Providers:</strong> vendors who help us operate the Service (hosting, analytics, security, support tools)
            under contractual obligations.
          </li>
          <li>
            <strong>For Legal & Compliance Reasons:</strong> to comply with law, court orders, subpoenas, or lawful requests, or to protect
            rights, safety, and security.
          </li>
          <li>
            <strong>Business Transfers:</strong> in connection with mergers, acquisitions, financing, or sale of assets (subject to appropriate safeguards).
          </li>
        </ul>
        <p>
          <strong>We do not sell</strong> your Personal Information, and we do not share it for “cross-context behavioral advertising”
          in a manner that would be considered a sale or share under certain state privacy laws.
        </p>

        <h3>6. Marketing Communications</h3>
        <p>
          We may send marketing or promotional emails. You can opt out at any time by using the “unsubscribe” link in those emails.
          Even if you opt out, we may continue to send non-promotional transactional messages (e.g., account notices, security alerts, receipts).
        </p>

        <h3>7. Data Retention (Operational & Legal)</h3>
        <p>
          We retain information only as long as reasonably necessary to provide the Service, comply with legal obligations,
          resolve disputes, enforce agreements, and maintain security.
        </p>
        <p>
          <strong>Account Deletion:</strong> If you request account deletion, we will delete or de-identify Personal Information
          within a reasonable period, except where retention is required or reasonably necessary for:
        </p>
        <ul>
          <li>Fraud prevention and security investigations</li>
          <li>Compliance with applicable laws and financial recordkeeping</li>
          <li>Audit logs and dispute resolution</li>
          <li>Operational backups (which may persist for a limited time)</li>
        </ul>
        <p className="muted">
          Note: Payment processors and financial institutions may retain records under their own legal obligations.
        </p>

        <h3>8. Your Choices & Rights</h3>
        <p>You may have the right to:</p>
        <ul>
          <li>Access and review certain Personal Information</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion (subject to retention requirements described above)</li>
          <li>Disconnect linked financial accounts (stopping future transaction access)</li>
          <li>Opt out of marketing communications</li>
        </ul>
        <p>
          To exercise these rights, contact us at <strong>terence@stewardingchange.org</strong>.
        </p>

        <h3>9. Children & Youth Use</h3>
        <p>
          The Service is intended for individuals <strong>18 years of age or older</strong>. We do not knowingly collect
          Personal Information from children under 13. If you believe a child has provided information through the Service,
          contact us and we will take reasonable steps to address it.
        </p>
        <p>
          If a minor uses the Service (including in connection with a youth group), that use is outside the intended scope
          of the Service and occurs at the user’s and/or supervising adult’s own risk. Stewarding Change disclaims responsibility
          to the maximum extent permitted by law for unauthorized minor use.
        </p>

        <h3>10. Security</h3>
        <p>
          We implement commercially reasonable administrative, technical, and organizational safeguards designed to protect information,
          including (as applicable): HTTPS encryption in transit, access controls, least-privilege permissions, and monitoring.
        </p>
        <p>
          However, no security measure is perfect. You are responsible for maintaining the confidentiality of your credentials and
          notifying us promptly of any suspected unauthorized access.
        </p>

        <h3>11. State Privacy Disclosures (U.S.)</h3>
        <p>
          Certain U.S. state privacy laws may provide additional rights (e.g., California). Where applicable, you may have rights
          to request access, deletion, and information about disclosures. We do not sell your Personal Information.
        </p>

        <h3>12. Changes to This Policy</h3>
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we may provide notice through the Service
          or by email where required. Continued use of the Service after changes become effective constitutes acceptance.
        </p>

        <h3>13. Contact</h3>
        <p>
          If you have questions or requests regarding privacy, contact:
          <br />
          <strong>terence@stewardingchange.org</strong>
        </p>
      </div>
    </div>
  );
}
