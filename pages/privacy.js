import Head from "next/head";

const APP_NAME = "Alimenta";
const EFFECTIVE_DATE = "January 13, 2026";

// TODO: Replace placeholders with your real info
const COMPANY_NAME = "Alimenta";
const CONTACT_EMAIL = "alimentanutrition@gmail.com";
const CONTACT_ADDRESS = "[Company Address]";

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>{APP_NAME} | Privacy Policy</title>
        <meta name="description" content={`Privacy Policy for ${APP_NAME}.`} />
      </Head>

      <main style={styles.main}>
        <div style={styles.container}>
          <header style={styles.header}>
            <h1 style={styles.h1}>Privacy Policy</h1>
            <p style={styles.meta}>
              <strong>Effective Date:</strong> {EFFECTIVE_DATE}
            </p>
            <p style={styles.p}>
              This Privacy Policy explains how {COMPANY_NAME} (“we,” “us,” or “our”) collects, uses,
              and shares information when you use {APP_NAME} (the “Service”).
            </p>
          </header>

          <section style={styles.section}>
            <h2 style={styles.h2}>1. Information We Collect</h2>
            <p style={styles.p}>We may collect the following categories of information:</p>
            <ul style={styles.ul}>
              <li style={styles.li}>
                <strong>Account Information:</strong> name, email, username, authentication tokens,
                and similar identifiers.
              </li>
              <li style={styles.li}>
                <strong>Meal and Nutrition Data:</strong> meal descriptions, meal logs, preferences,
                goals, macro estimates, and other entries you provide.
              </li>
              <li style={styles.li}>
                <strong>User Content:</strong> photos, text, and other content you upload or submit.
              </li>
              <li style={styles.li}>
                <strong>Device and Usage Data:</strong> device type, operating system, app version,
                pages/screens viewed, events, approximate location (derived from IP), and diagnostic
                logs.
              </li>
              <li style={styles.li}>
                <strong>Cookies and Similar Technologies (Web):</strong> if you use our website,
                we may use cookies/local storage for session management and analytics.
              </li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>2. How We Use Information</h2>
            <p style={styles.p}>We use information to:</p>
            <ul style={styles.ul}>
              <li style={styles.li}>Provide, maintain, and improve the Service.</li>
              <li style={styles.li}>Personalize experiences (e.g., recommendations, preferences).</li>
              <li style={styles.li}>Communicate with you (support, updates, security notices).</li>
              <li style={styles.li}>Monitor and enhance security, prevent fraud, and debug issues.</li>
              <li style={styles.li}>Comply with legal obligations and enforce our terms.</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>3. How We Share Information</h2>
            <p style={styles.p}>
              We do not sell your personal information. We may share information in the following
              situations:
            </p>
            <ul style={styles.ul}>
              <li style={styles.li}>
                <strong>Service Providers:</strong> vendors who help us operate the Service (e.g.,
                hosting, databases, analytics, customer support, email delivery, payments).
              </li>
              <li style={styles.li}>
                <strong>Legal and Safety:</strong> to comply with law, respond to lawful requests, or
                protect the rights, safety, and security of users, the public, or our Service.
              </li>
              <li style={styles.li}>
                <strong>Business Transfers:</strong> if we are involved in a merger, acquisition,
                financing, or sale of assets, information may be transferred as part of that
                transaction.
              </li>
              <li style={styles.li}>
                <strong>With Your Direction:</strong> when you choose to share information (e.g.,
                exporting data, sharing plans with others if that feature exists).
              </li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>4. Data Retention</h2>
            <p style={styles.p}>
              We retain information for as long as necessary to provide the Service and for legitimate
              business purposes such as security, compliance, and dispute resolution. You may request
              deletion as described below, subject to legal requirements.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>5. Security</h2>
            <p style={styles.p}>
              We use reasonable administrative, technical, and organizational measures to protect
              information. However, no method of transmission or storage is fully secure, and we
              cannot guarantee absolute security.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>6. Your Choices and Rights</h2>
            <p style={styles.p}>
              Depending on your location, you may have rights to access, correct, delete, or export
              your information, or to object to or restrict certain processing. You can also opt out
              of certain communications.
            </p>
            <ul style={styles.ul}>
              <li style={styles.li}>
                <strong>Account:</strong> update certain information in your account settings (if
                available).
              </li>
              <li style={styles.li}>
                <strong>Deletion Requests:</strong> email us at <strong>{CONTACT_EMAIL}</strong>.
              </li>
              <li style={styles.li}>
                <strong>Cookies (Web):</strong> you can control cookies through your browser
                settings; disabling some cookies may affect functionality.
              </li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>7. Children’s Privacy</h2>
            <p style={styles.p}>
              The Service is not directed to children under 13 (or the age required by local law),
              and we do not knowingly collect personal information from children. If you believe a
              child has provided personal information, contact us at {CONTACT_EMAIL}.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>8. International Users</h2>
            <p style={styles.p}>
              If you access the Service from outside the country where we operate, your information
              may be processed and stored in countries that may have different data protection laws.
              We take steps to protect information as required by applicable law.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>9. Changes to This Privacy Policy</h2>
            <p style={styles.p}>
              We may update this Privacy Policy from time to time. If changes are material, we will
              provide notice as required by law (e.g., via the Service). The effective date above
              indicates when this policy was last updated.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>10. Contact</h2>
            <p style={styles.p}>
              If you have questions or requests regarding privacy, contact us at{" "}
              <strong>{CONTACT_EMAIL}</strong>.
            </p>
            <p style={styles.p}>
              Mailing address: <strong>{CONTACT_ADDRESS}</strong>
            </p>
          </section>

          <footer style={styles.footer}>
            <p style={styles.small}>
              This template is provided for convenience and is not legal advice. You should tailor
              it to your specific data collection practices (e.g., analytics providers, payments,
              health-related data, jurisdictions like GDPR/CCPA).
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
