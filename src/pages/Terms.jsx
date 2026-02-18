// src/pages/Terms.jsx
// IMPORTANT: This document is a draft template and should be reviewed by licensed legal counsel prior to launch or scale.
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="page container-narrow">
      <h1 className="page-title">Terms of Service</h1>
      <p className="page-subtitle">
        Stewarding Change LLC — Effective Date: February 17, 2026
      </p>

      <div className="stack-6">

        <h3>1. Binding Agreement</h3>
        <p>
          These Terms of Service (“Terms”) constitute a legally binding agreement between you and
          <strong> Stewarding Change LLC</strong>, a Florida limited liability company
          (“Stewarding Change,” “Company,” “we,” “us,” or “our”).
        </p>
        <p>
          By accessing or using the Stewarding Change platform, website, mobile interfaces,
          or related services (collectively, the “Service”), you agree to be legally bound
          by these Terms. These Terms govern the entire legal relationship between you and
          Stewarding Change. If you do not agree, you must not use the Service.
        </p>

        <h3>2. Definitions</h3>
        <ul>
          <li><strong>User</strong> means any individual accessing or using the Service.</li>
          <li><strong>Service</strong> means the Stewarding Change technology platform facilitating donation round-up calculations and authorized payment initiation.</li>
          <li><strong>Church</strong> means a third-party organization designated to receive funds via Stripe.</li>
          <li><strong>Third-Party Providers</strong> include Stripe, Inc. and its affiliates, Plaid, and related financial service providers.</li>
        </ul>

        <h3>3. Description of Service; No Custody of Funds</h3>
        <p>
          Stewarding Change provides a software platform that connects to user-authorized
          financial accounts via Plaid, retrieves transaction data, calculates round-up
          donation amounts, and initiates authorized payment instructions via Stripe.
        </p>
        <p>
          <strong>
            Stewarding Change does not at any time hold, receive, transmit, control,
            possess, or take custody of User funds.
          </strong>
        </p>
        <p>
          All payments are processed exclusively by <strong>Stripe, Inc. and its affiliates</strong>.
          Funds flow directly from the User to Stripe and from Stripe to the designated Church.
        </p>
        <p>
          Stewarding Change is not a bank, money transmitter, payment processor,
          or financial institution.
        </p>

        <h3>4. Eligibility & Account Responsibilities</h3>
        <ul>
          <li>You must be at least 18 years old and legally capable of entering binding contracts.</li>
          <li>You must provide accurate and current information.</li>
          <li>You are responsible for maintaining account security.</li>
          <li>You are responsible for all activity under your account.</li>
        </ul>
        <p>
          Stewarding Change may suspend or terminate accounts for suspected fraud,
          misuse, or legal violations.
        </p>

        <h3>5. Authorization for Financial Data Access (Plaid)</h3>
        <p>
          By linking a financial account, you expressly authorize Stewarding Change
          to access transaction data via Plaid solely to calculate round-up amounts.
        </p>
        <ul>
          <li>You acknowledge Plaid is governed by its own terms and privacy policy.</li>
          <li>Stewarding Change does not store your banking credentials.</li>
          <li>You may revoke access at any time via your dashboard.</li>
        </ul>

        <h3>6. Payment Processing; ACH and Card Authorization</h3>
        <p>
          You authorize Stripe, Inc. and its affiliates to initiate ACH debits or
          card charges equal to your calculated round-up totals on a recurring basis.
        </p>
        <ul>
          <li>Transactions may be aggregated.</li>
          <li>Payments may fail due to insufficient funds or revoked authorization.</li>
          <li>Transactions are subject to NACHA rules and card network regulations.</li>
        </ul>

        <h3>7. Fees</h3>
        <p>
          Stewarding Change may charge Churches platform fees,
          which may include fixed monthly fees and/or percentage-based service fees.
          Fee structures may vary and may change with notice or agreement.
        </p>

        <h3>8. User Conduct</h3>
        <ul>
          <li>No fraudulent use.</li>
          <li>No illegal activity.</li>
          <li>No interference with the Service.</li>
          <li>No reverse engineering or exploitation.</li>
        </ul>

        <h3>9. Disclaimer of Warranties</h3>
        <p>
          THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.”
          STEWARDING CHANGE DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED.
        </p>

        <h3>10. Limitation of Liability</h3>
        <p>
          Stewarding Change shall not be liable for errors by banks, Plaid, Stripe,
          or network providers.
        </p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW,
          STEWARDING CHANGE’S TOTAL LIABILITY SHALL NOT EXCEED $100.
        </p>

        <h3>11. Privacy</h3>
        <p>
          Your use of the Service is subject to our <Link to="/privacy">Privacy Policy</Link>

        </p>

        <h3>12. Binding Arbitration; Class Action Waiver; Jury Waiver</h3>
        <p>
          PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS.
        </p>
        <p>
          Any dispute shall be resolved exclusively by binding arbitration
          administered by the <strong>American Arbitration Association (AAA)</strong>
          under its Commercial Arbitration Rules.
        </p>
        <p>
          Arbitration shall occur in Pinellas County, Florida.
          The Federal Arbitration Act governs this provision.
        </p>
        <p>
          The arbitrator shall have exclusive authority to determine arbitrability.
        </p>
        <p>
          You waive any right to a jury trial and any participation in
          class, collective, consolidated, or representative actions.
        </p>
        <p>
          You may opt out within 30 days of first acceptance
          by emailing terence@stewardingchange.org.
        </p>

        <h3>13. Modifications</h3>
        <p>
          Stewarding Change may modify these Terms at any time.
          Continued use constitutes acceptance.
        </p>

        <h3>14. Termination</h3>
        <p>
          You may cancel via your dashboard.
          Termination does not affect prior authorized payments.
        </p>

        <h3>15. Intellectual Property</h3>
        <p>
          All software, branding, algorithms, and platform technology are
          exclusively owned by Stewarding Change LLC.
        </p>
        <p>
          No rights are granted except limited personal use of the Service.
        </p>

        <h3>16. Third-Party Terms</h3>
        <p>
          Use of Stripe, Inc. and its affiliates and Plaid
          is subject to their respective terms.
        </p>

        <h3>17. General Provisions</h3>
        <ul>
          <li>Severability</li>
          <li>No Waiver</li>
          <li>Assignment Rights Reserved by Company</li>
          <li>Force Majeure</li>
          <li>Entire Agreement</li>
        </ul>

        <hr />

        <p className="small">
          Contact: terence@stewardingchange.org
        </p>

      </div>
    </div>
  );
}
