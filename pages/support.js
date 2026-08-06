import { useEffect, useState } from "react";
import Head from "next/head";
import { useAuth } from "../src/context/AuthContext";
import { supabase } from "../src/supabaseClient";

const APP_NAME = "Alimenta";
const CONTACT_EMAIL = "alimentanutrition@gmail.com";

// Matches mobile/components/modals/ShareFeedbackModal.jsx
const FEEDBACK_TYPE_OPTIONS = [
  { value: "feedback", label: "Feedback" },
  { value: "bug", label: "Bug" },
];

const SUCCESS_MESSAGE =
  "Thanks — we got your feedback and will get back to you soon";

export default function SupportPage() {
  const { user } = useAuth();

  const [feedbackType, setFeedbackType] = useState("feedback");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user?.email]);

  const trimmedBody = body.trim();
  const canSubmit = trimmedBody.length >= 10 && !loading;

  const resetForm = () => {
    setFeedbackType("feedback");
    setBody("");
    setEmail(user?.email || "");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (trimmedBody.length < 10) {
      setError("Please enter at least 10 characters.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Same destination as mobile ShareFeedbackModal:
      // supabase.from('user_feedback').insert(...) — there is no separate API route.
      const contactEmail = email.trim() || null;

      // For anonymous visitors, fold contact email into the body so follow-up
      // info is retained even if an email column is not present.
      const submitBody =
        !user?.id && contactEmail
          ? `${trimmedBody}\n\nContact email: ${contactEmail}`
          : trimmedBody;

      const payload = {
        user_id: user?.id ?? null,
        feedback_type: feedbackType,
        body: submitBody,
        app_version: null,
        platform: "web",
        build_number: null,
      };

      if (contactEmail) {
        payload.email = contactEmail;
      }

      let { error: insertError } = await supabase
        .from("user_feedback")
        .insert(payload);

      // If the table has no email column yet, retry with the mobile field set.
      if (insertError && payload.email && /column .*email/i.test(insertError.message || "")) {
        const { email: _omit, ...withoutEmail } = payload;
        ({ error: insertError } = await supabase
          .from("user_feedback")
          .insert(withoutEmail));
      }

      if (insertError) throw insertError;

      setSuccess(SUCCESS_MESSAGE);
      resetForm();
    } catch (err) {
      console.error("Support feedback error:", err);
      setError(
        err?.message
          ? `Something went wrong: ${err.message}`
          : "Something went wrong. Please try again or email us directly."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{APP_NAME} | Support & Feedback</title>
        <meta
          name="description"
          content="Get support, report a bug, or send feedback for Alimenta."
        />
      </Head>

      <main style={styles.main}>
        <div style={styles.container}>
          <header style={styles.header}>
            <h1 style={styles.h1}>Support & Feedback</h1>
            <p style={styles.p}>
              We&apos;d love to hear from you. Whether you&apos;ve hit a bug,
              have a feature idea, or just want to say hello — get in touch.
            </p>
          </header>

          <section style={styles.section}>
            <h2 style={styles.h2}>Contact</h2>
            <p style={styles.p}>
              Email us anytime at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} style={styles.emailLink}>
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>Send Feedback</h2>
            <p style={styles.p}>
              Tell us what you think or report a bug. We read every submission.
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.label} htmlFor="feedback-type">
                Type
              </label>
              <select
                id="feedback-type"
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                disabled={loading}
                style={styles.select}
              >
                {FEEDBACK_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <label style={{ ...styles.label, ...styles.labelSpaced }} htmlFor="feedback-body">
                Message
              </label>
              <textarea
                id="feedback-body"
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setError("");
                  setSuccess("");
                }}
                placeholder="What's on your mind?"
                rows={5}
                disabled={loading}
                required
                minLength={10}
                style={styles.textarea}
              />
              <p style={styles.hint}>At least 10 characters.</p>

              <label style={{ ...styles.label, ...styles.labelSpaced }} htmlFor="feedback-email">
                Email <span style={styles.optional}>(optional)</span>
              </label>
              <input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                style={styles.input}
              />
              <p style={styles.hint}>
                Include an email if you&apos;d like us to follow up
                {!user ? " (helpful if you're not signed in)" : ""}.
              </p>

              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  ...styles.button,
                  ...((!canSubmit || loading) && styles.buttonDisabled),
                }}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>

              {success ? (
                <div style={{ ...styles.message, ...styles.messageSuccess }}>
                  <p style={{ ...styles.messageText, ...styles.messageTextSuccess }}>
                    {success}
                  </p>
                </div>
              ) : null}

              {error ? (
                <div style={{ ...styles.message, ...styles.messageError }}>
                  <p style={{ ...styles.messageText, ...styles.messageTextError }}>
                    {error}
                  </p>
                </div>
              ) : null}
            </form>
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
  emailLink: {
    color: "#0B0D0E",
    fontWeight: 700,
    fontSize: 16,
    lineHeight: 1.6,
    textDecoration: "underline",
  },
  form: { marginTop: 16, maxWidth: 520 },
  label: {
    display: "block",
    margin: "0 0 8px",
    fontSize: 14,
    fontWeight: 600,
    color: "#5C666B",
  },
  labelSpaced: { marginTop: 16 },
  optional: { fontWeight: 400, color: "#5C666B" },
  select: {
    display: "block",
    width: "100%",
    padding: "12px",
    fontSize: 15,
    lineHeight: 1.4,
    color: "#0B0D0E",
    background: "#FFFFFF",
    border: "1px solid #E3E6E8",
    borderRadius: 10,
    boxSizing: "border-box",
  },
  textarea: {
    display: "block",
    width: "100%",
    padding: "12px",
    fontSize: 16,
    lineHeight: 1.5,
    color: "#0B0D0E",
    background: "#FFFFFF",
    border: "1px solid #E3E6E8",
    borderRadius: 12,
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: 120,
    fontFamily: "inherit",
  },
  input: {
    display: "block",
    width: "100%",
    padding: "12px",
    fontSize: 15,
    lineHeight: 1.4,
    color: "#0B0D0E",
    background: "#FFFFFF",
    border: "1px solid #E3E6E8",
    borderRadius: 10,
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  hint: { margin: "6px 0 0", fontSize: 13, lineHeight: 1.5, color: "#5C666B" },
  button: {
    marginTop: 20,
    padding: "13px 20px",
    fontSize: 14,
    fontWeight: 600,
    color: "#FFFFFF",
    background: "#0B0D0E",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  message: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    border: "1px solid",
  },
  messageSuccess: {
    background: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  messageError: {
    background: "#FEF2F2",
    borderColor: "#FECACA",
  },
  messageText: { margin: 0, fontSize: 14, lineHeight: 1.5 },
  messageTextSuccess: { color: "#166534" },
  messageTextError: { color: "#B91C1C" },
};
