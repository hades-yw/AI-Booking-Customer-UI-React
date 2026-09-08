import { Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Footer } from "../components/layout/Footer";
import { PageContainer } from "../components/layout/PageContainer";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { TextField } from "../components/ui/TextField";
import { ApiError } from "../api";
import { useAuth } from "../context/AuthContext";

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(location.pathname === "/register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleMode = () => {
    const next = !isRegister;
    setIsRegister(next);
    setError(null);
    navigate(next ? "/register" : "/login", { replace: true });
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    email.trim().length > 0 && password.length > 0 && (!isRegister || name.trim().length > 0);

  return (
    <PageContainer>
      <div className="flex w-full flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] md:p-8 md:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <p className="mb-1 text-xl font-black text-ink-900">
            {isRegister ? "Create your account" : "Welcome back"}
          </p>
          <p className="mb-6 text-[13px] text-ink-500">
            {isRegister ? "Sign up to start booking services" : "Sign in to manage your bookings"}
          </p>

          <div className="flex flex-col gap-3">
            {isRegister && (
              <TextField icon={<User size={14} />} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            )}
            <TextField
              icon={<Mail size={14} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              type="email"
            />
            <TextField
              icon={<Lock size={14} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
            />
          </div>

          {!isRegister && (
            <Link to="/forgot-password" className="mt-2 block text-right text-xs font-semibold text-brand-600 hover:underline">
              Forgot password?
            </Link>
          )}

          {error && <p className="mt-4 text-sm font-semibold text-red-500">{error}</p>}

          <PrimaryButton fullWidth className="mt-5" onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
          </PrimaryButton>

          <p className="mt-5 text-center text-[13px] text-ink-500">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button type="button" onClick={toggleMode} className="cursor-pointer border-0 bg-transparent p-0 font-bold text-brand-600">
              {isRegister ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </div>

      <Footer />
    </PageContainer>
  );
}
