import { Lock } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../api";
import { Footer } from "../components/layout/Footer";
import { PageContainer } from "../components/layout/PageContainer";
import { TopNav } from "../components/layout/TopNav";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { TextField } from "../components/ui/TextField";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!token) return;
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <TopNav title="Reset Password" onBack={() => navigate(-1)} />

      <div className="flex w-full flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] md:p-8 md:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {!token ? (
            <>
              <p className="mb-1 text-xl font-black text-ink-900">Invalid or missing reset link</p>
              <p className="mb-6 text-[13px] text-ink-500">
                This reset link is missing or malformed. Request a new one below.
              </p>
              <Link to="/forgot-password" className="text-sm font-bold text-brand-600 hover:underline">
                Request a new link
              </Link>
            </>
          ) : done ? (
            <>
              <p className="mb-1 text-xl font-black text-ink-900">Password updated</p>
              <p className="mb-6 text-[13px] text-ink-500">You can now sign in with your new password.</p>
              <Link to="/login" className="text-sm font-bold text-brand-600 hover:underline">
                Back to Sign In
              </Link>
            </>
          ) : (
            <>
              <p className="mb-1 text-xl font-black text-ink-900">Choose a new password</p>
              <p className="mb-6 text-[13px] text-ink-500">Enter and confirm your new password below.</p>
              <div className="flex flex-col gap-3">
                <TextField
                  icon={<Lock size={14} />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  type="password"
                />
                <TextField
                  icon={<Lock size={14} />}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  type="password"
                />
              </div>

              {error && <p className="mt-4 text-sm font-semibold text-red-500">{error}</p>}

              <PrimaryButton
                fullWidth
                className="mt-5"
                onClick={handleSubmit}
                disabled={password.length === 0 || confirmPassword.length === 0 || submitting}
              >
                {submitting ? "Saving…" : "Reset password"}
              </PrimaryButton>
            </>
          )}
        </div>
      </div>

      <Footer />
    </PageContainer>
  );
}
