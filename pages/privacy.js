import Head from "next/head";

const APP_NAME = "Alimenta";
const EFFECTIVE_DATE = "July 21, 2026";

const COMPANY_NAME = "Alimenta Nutrition";
const CONTACT_EMAIL = "alimentanutrition@gmail.com";

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
              and shares information when you use {APP_NAME} (the “Service”), including our iOS and
              Android mobile applications and our website.
            </p>
          </header>

          <section style={styles.section}>
            <h2 style={styles.h2}>1. Information We Collect</h2>
            <p style={styles.p}>We may collect the following categories of information:</p>
            <ul style={styles.ul}>
              <li style={styles.li}>
                <strong>Account Information:</strong> name, email address, and authentication-related
                data (such as session tokens). You may create an account with email and password, or
                sign in with Google or Apple. When you use Google or Apple Sign-In, we receive
                identifiers and profile details those providers share with us (typically name and
                email), subject to your settings with those providers.
              </li>
              <li style={styles.li}>
                <strong>Profile and Health-Related Inputs:</strong> information you provide such as
                age, gender, height, weight, activity level, fitness or nutrition goals, and dietary
                restrictions. This information is used to personalize meal planning and is not a
                medical record.
              </li>
              <li style={styles.li}>
                <strong>Food Preferences:</strong> likes, dislikes, cuisine favorites, and similar
                preference data you enter.
              </li>
              <li style={styles.li}>
                <strong>Meal and Nutrition Data:</strong> meal plans, meal descriptions, saved meals,
                meal completions, meal ratings, grocery lists, recipes, macro estimates, and other
                nutrition-related content you generate or enter in the Service.
              </li>
              <li style={styles.li}>
                <strong>Training Data:</strong> workout or training schedules and related details you
                enter (for example, activity type, distance, or intensity) so we can tailor meal
                suggestions around your training.
              </li>
              <li style={styles.li}>
                <strong>Usage Limits Data:</strong> counts of certain actions (such as meal
                generation, recipe generation, or grocery list generation) so we can apply fair-use
                limits.
              </li>
              <li style={styles.li}>
                <strong>User Content:</strong> text and other materials you submit through the
                Service (for example, meal descriptions or preference notes). The mobile app does not
                currently collect photos or camera uploads.
              </li>
              <li style={styles.li}>
                <strong>Device and Technical Data:</strong> limited technical information needed to
                operate the Service, such as basic device or app context and server logs (which may
                include IP address) processed by our hosting and infrastructure providers. We do not
                currently use third-party analytics or advertising SDKs in the mobile app to track
                screens or events.
              </li>
              <li style={styles.li}>
                <strong>Local Device Storage:</strong> on mobile devices, we store limited data on
                your device (for example, authentication session data, theme preference, onboarding
                progress, and draft profile or preference information) so the app can function and
                remember your settings.
              </li>
              <li style={styles.li}>
                <strong>Cookies and Similar Technologies (Web):</strong> if you use our website, we
                may use cookies or local storage for session management and essential site
                functionality.
              </li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>2. How We Use Information</h2>
            <p style={styles.p}>We use information to:</p>
            <ul style={styles.ul}>
              <li style={styles.li}>Provide, maintain, and improve the Service.</li>
              <li style={styles.li}>
                Personalize meal plans, recipes, grocery lists, and related features using your
                profile, preferences, and training inputs.
              </li>
              <li style={styles.li}>
                Generate AI-assisted content (such as meal suggestions, recipes, grocery lists, and
                related embeddings) by sending relevant inputs to our AI service providers, as
                described below.
              </li>
              <li style={styles.li}>Apply usage limits and prevent abuse of generation features.</li>
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
                <strong>Service Providers:</strong> vendors who help us operate the Service. Depending
                on the features you use, this may include:
                <ul style={styles.ul}>
                  <li style={styles.li}>
                    <strong>Supabase</strong> — authentication and database hosting.
                  </li>
                  <li style={styles.li}>
                    <strong>Hosting providers</strong> (for example, Vercel) — application and API
                    hosting.
                  </li>
                  <li style={styles.li}>
                    <strong>OpenAI</strong> — AI features such as meal generation, recipes, grocery
                    lists, and meal embeddings. Relevant profile, preference, training, and meal
                    context may be sent to generate results you request.
                  </li>
                  <li style={styles.li}>
                    <strong>Google Gemini</strong> — AI features on certain web or alternate
                    generation paths, when enabled.
                  </li>
                  <li style={styles.li}>
                    <strong>Macro estimation service</strong> — meal description text may be sent to
                    our macro estimation backend to estimate nutrition values.
                  </li>
                  <li style={styles.li}>
                    <strong>Google and Apple</strong> — if you choose to sign in with those providers;
                    their handling of your information is also governed by their own policies.
                  </li>
                </ul>
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
                <strong>With Your Direction:</strong> when you choose to share information yourself
                (for example, using your device’s share sheet to send a grocery list or recipe to
                another app).
              </li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>4. Data Retention</h2>
            <p style={styles.p}>
              We retain information for as long as necessary to provide the Service and for legitimate
              business purposes such as security, compliance, and dispute resolution. You may delete
              your account or request deletion as described below, subject to legal requirements.
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
              Depending on your location, you may have rights to access, correct, delete, or obtain a
              copy of your information, or to object to or restrict certain processing. You can also
              opt out of certain communications.
            </p>
            <ul style={styles.ul}>
              <li style={styles.li}>
                <strong>Account:</strong> you can update certain information in the app (for example,
                profile details, preferences, password, and appearance settings).
              </li>
              <li style={styles.li}>
                <strong>Access or copy of your data:</strong> the app does not currently provide an
                in-app data export. To request a copy of your personal information, email us at{" "}
                <strong>{CONTACT_EMAIL}</strong>.
              </li>
              <li style={styles.li}>
                <strong>Account Deletion:</strong> you can permanently delete your account and
                associated data from the Service in the mobile app under{" "}
                <strong>Settings → Delete Account</strong>. You may also email us at{" "}
                <strong>{CONTACT_EMAIL}</strong> to request deletion. When deletion is completed, we
                remove account and related Service data from our systems, subject to any limited
                retention required by law or for legitimate security and dispute-resolution purposes.
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
              The Service is not directed to children under 13,
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
          </section>
        </div>
      </main>
    </>
  );
}

const styles = {
  main: { padding: "48px 16px", background: "#F7F4EC", minHeight: "100vh" },
  container: {
    maxWidth: 900,
    margin: "0 auto",
    background: "#FFFFFF",
    border: "1px solid #E8E2D6",
    borderRadius: 18,
    padding: "32px 24px",
    boxShadow: "0 2px 8px rgba(26, 26, 26, 0.05)",
  },
  header: { marginBottom: 24 },
  h1: { margin: 0, fontSize: 32, lineHeight: 1.2, fontFamily: 'Quicksand, ui-sans-serif, system-ui, sans-serif' },
  h2: { margin: "24px 0 8px", fontSize: 20, lineHeight: 1.3, fontFamily: 'Quicksand, ui-sans-serif, system-ui, sans-serif' },
  p: { margin: "8px 0", fontSize: 16, lineHeight: 1.6, color: "#0B0D0E" },
  meta: { margin: "12px 0 0", fontSize: 14, color: "#5C666B" },
  section: { marginTop: 8 },
  ul: { margin: "8px 0 8px 18px", padding: 0, color: "#0B0D0E" },
  li: { margin: "6px 0", lineHeight: 1.6 },
  footer: { marginTop: 32, paddingTop: 16, borderTop: "1px solid #E3E6E8" },
  small: { margin: 0, fontSize: 13, lineHeight: 1.5, color: "#5C666B" },
};
