import { Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Footer } from "../components/layout/Footer";
import { PageContainer } from "../components/layout/PageContainer";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { TextField } from "../components/ui/TextField";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.forgotPassword(email.trim());
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  };

  return (
    <PageContainer>
      <div className="flex w-full flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] md:p-8 md:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {sent ? (
            <>
              <p className="mb-1 text-xl font-black text-ink-900">Check your email</p>
              <p className="mb-6 text-[13px] leading-relaxed text-ink-500">
                If an account exists for {email.trim()}, we've sent a link to reset your password.
              </p>
              <Link to="/login" className="text-sm font-bold text-brand-600 hover:underline">
                Back to Sign In
              </Link>
            </>
          ) : (
            <>
              <p className="mb-1 text-xl font-black text-ink-900">Forgot your password?</p>
              <p className="mb-6 text-[13px] text-ink-500">
                Enter the email associated with your account and we'll send you a reset link.
              </p>
              <TextField
                icon={<Mail size={14} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                type="email"
              />
              <PrimaryButton
                fullWidth
                className="mt-5"
                onClick={handleSubmit}
                disabled={email.trim().length === 0 || submitting}
              >
                {submitting ? "Sending…" : "Send reset link"}
              </PrimaryButton>
              <p className="mt-5 text-center text-[13px] text-ink-500">
                Remembered your password?{" "}
                <Link to="/login" className="font-bold text-brand-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <Footer />
    </PageContainer>
  );
}
