import Head from "next/head";

const APP_NAME = "Alimenta";
const EFFECTIVE_DATE = "January 13, 2026";

// TODO: Replace placeholders with your real info
const COMPANY_NAME = "[Company Name / Legal Entity]";
const CONTACT_EMAIL = "[support@yourdomain.com]";
const CONTACT_ADDRESS = "[Company Address]";

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>{APP_NAME} | Terms of Service</title>
        <meta name="description" content={`Terms of Service for ${APP_NAME}.`} />
      </Head>

      <main style={styles.main}>
        <div style={styles.container}>
          <header style={styles.header}>
            <h1 style={styles.h1}>Terms of Service</h1>
            <p style={styles.meta}>
              <strong>Effective Date:</strong> {EFFECTIVE_DATE}
            </p>
            <p style={styles.p}>
              These Terms of Service (“Terms”) govern your access to and use of {APP_NAME} (the
              “Service”), operated by {COMPANY_NAME} (“we,” “us,” or “our”). By accessing or using the
              Service, you agree to these Terms.
            </p>
          </header>

          <section style={styles.section}>
            <h2 style={styles.h2}>1. Eligibility</h2>
            <p style={styles.p}>
              You must be at least 13 years old (or the minimum age required in your jurisdiction) to
              use the Service. If you are using the Service on behalf of an organization, you
              represent that you have authority to bind that organization to these Terms.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>2. Accounts and Security</h2>
            <ul style={styles.ul}>
              <li style={styles.li}>
                You may need an account to access certain features. You agree to provide accurate,
                complete information and keep it updated.
              </li>
              <li style={styles.li}>
                You are responsible for maintaining the confidentiality of your credentials and for
                all activity that occurs under your account.
              </li>
              <li style={styles.li}>
                Notify us promptly at {CONTACT_EMAIL} if you suspect unauthorized access.
              </li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>3. Health and Nutrition Disclaimer</h2>
            <p style={styles.p}>
              {APP_NAME} may provide meal ideas, macro estimates, nutrition information, or other
              guidance. The Service is provided for informational purposes only and is not medical
              advice. You should consult a qualified healthcare professional before making
              significant dietary changes, especially if you have medical conditions, allergies, or
              dietary restrictions. You are responsible for verifying ingredients, nutrition values,
              and suitability for your needs.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>4. Your Content</h2>
            <p style={styles.p}>
              “User Content” includes text, images, meal logs, and other materials you submit to the
              Service. You retain ownership of your User Content, but you grant us a limited license
              to host, store, reproduce, and display it solely to operate and improve the Service
              and to provide features you request.
            </p>
            <ul style={styles.ul}>
              <li style={styles.li}>
                You represent that you have the rights necessary to submit User Content and that it
                does not violate any law or third-party rights.
              </li>
              <li style={styles.li}>
                We may remove or restrict User Content that violates these Terms or is otherwise
                harmful to the Service or others.
              </li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>5. Acceptable Use</h2>
            <p style={styles.p}>You agree not to:</p>
            <ul style={styles.ul}>
              <li style={styles.li}>Use the Service for any illegal purpose or in violation of law.</li>
              <li style={styles.li}>
                Attempt to gain unauthorized access to accounts, systems, or networks.
              </li>
              <li style={styles.li}>
                Interfere with or disrupt the Service (e.g., scraping at scale, denial-of-service).
              </li>
              <li style={styles.li}>
                Reverse engineer, decompile, or attempt to extract source code except as permitted by law.
              </li>
              <li style={styles.li}>
                Upload malware or other harmful code, or use the Service to transmit spam.
              </li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>6. Subscriptions, Purchases, and Payments (If Applicable)</h2>
            <p style={styles.p}>
              If the Service offers paid features, you agree to pay all applicable fees and taxes.
              Subscription terms, renewal rules, and cancellation details (including through your app
              store, if applicable) will be disclosed at purchase time. Except where required by
              law, payments are non-refundable.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>7. Intellectual Property</h2>
            <p style={styles.p}>
              The Service, including its software, design, and content (excluding User Content), is
              owned by {COMPANY_NAME} and protected by intellectual property laws. You may not use
              our trademarks, logos, or branding without our prior written permission.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>8. Third-Party Services</h2>
            <p style={styles.p}>
              The Service may integrate with third-party services (e.g., hosting, analytics, payment
              processors). We are not responsible for third-party services, and your use of them may
              be governed by their own terms and policies.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>9. Disclaimer of Warranties</h2>
            <p style={styles.p}>
              THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY
              LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT
              GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR ACCURATE.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>10. Limitation of Liability</h2>
            <p style={styles.p}>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, {COMPANY_NAME} WILL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
              PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
              OUR TOTAL LIABILITY FOR ANY CLAIM WILL NOT EXCEED THE AMOUNT YOU PAID (IF ANY) TO USE
              THE SERVICE IN THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>11. Indemnification</h2>
            <p style={styles.p}>
              You agree to indemnify and hold harmless {COMPANY_NAME} from claims, liabilities,
              damages, and expenses (including reasonable attorneys’ fees) arising from your use of
              the Service, your User Content, or your violation of these Terms.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>12. Termination</h2>
            <p style={styles.p}>
              You may stop using the Service at any time. We may suspend or terminate your access if
              we believe you have violated these Terms, or if necessary to protect the Service or
              others. Upon termination, sections that by their nature should survive will survive
              (e.g., IP, disclaimers, limitation of liability).
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>13. Changes to These Terms</h2>
            <p style={styles.p}>
              We may update these Terms from time to time. If changes are material, we will provide
              notice as required by law (e.g., via the Service). Your continued use after the
              effective date of updated Terms constitutes acceptance.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>14. Governing Law</h2>
            <p style={styles.p}>
              These Terms are governed by the laws of <strong>[Your State/Country]</strong>, without
              regard to conflict of law rules. Venue for disputes will be in{" "}
              <strong>[Your County/State]</strong>, unless otherwise required by law.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>15. Contact</h2>
            <p style={styles.p}>
              Questions about these Terms? Contact us at <strong>{CONTACT_EMAIL}</strong>.
            </p>
            <p style={styles.p}>
              Mailing address: <strong>{CONTACT_ADDRESS}</strong>
            </p>
          </section>

          <footer style={styles.footer}>
            <p style={styles.small}>
              This template is provided for convenience and is not legal advice. You should tailor
              it to your product, data flows, and jurisdiction(s).
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}

const styles = {
  main: { padding: "48px 16px", background: "#F7F8F9", minHeight: "100vh" },
  container: {
    maxWidth: 900,
    margin: "0 auto",
    background: "#FFFFFF",
    border: "1px solid #E3E6E8",
    borderRadius: 16,
    padding: "32px 24px",
  },
  header: { marginBottom: 24 },
  h1: { margin: 0, fontSize: 32, lineHeight: 1.2 },
  h2: { margin: "24px 0 8px", fontSize: 20, lineHeight: 1.3 },
  p: { margin: "8px 0", fontSize: 16, lineHeight: 1.6, color: "#0B0D0E" },
  meta: { margin: "12px 0 0", fontSize: 14, color: "#5C666B" },
  section: { marginTop: 8 },
  ul: { margin: "8px 0 8px 18px", padding: 0, color: "#0B0D0E" },
  li: { margin: "6px 0", lineHeight: 1.6 },
  footer: { marginTop: 32, paddingTop: 16, borderTop: "1px solid #E3E6E8" },
  small: { margin: 0, fontSize: 13, lineHeight: 1.5, color: "#5C666B" },
};
