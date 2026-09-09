import { LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Footer } from "../components/layout/Footer";
import { PageContainer } from "../components/layout/PageContainer";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { useAuth } from "../context/AuthContext";
import { consumeReturnPath, peekReturnPath, safeReturnPath, saveReturnPath } from "../auth/keycloak";

interface AuthLocationState {
  returnTo?: string;
}

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, error: authError, login, loginWithProvider, register } = useAuth();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const state = location.state as AuthLocationState | null;
  const returnTo = safeReturnPath(state?.returnTo ?? peekReturnPath());

  if (!loading && user) return <Navigate to={consumeReturnPath()} replace />;

  const begin = async (label: string, action: () => Promise<void>) => {
    setError(null);
    setSubmitting(label);
    try {
      await action();
    } catch {
      setError("Could not open sign-in. Check that Keycloak is running and try again.");
      setSubmitting(null);
    }
  };

  const continueAsGuest = () => {
    saveReturnPath(returnTo);
    navigate(consumeReturnPath(), { replace: true });
  };
  const callbackError = searchParams.has("authError")
    ? "Sign-in was cancelled or could not be completed. You can try again or continue as guest."
    : null;

  return (
    <PageContainer>
      <div className="flex w-full flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] md:p-8 md:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <p className="mb-1 text-xl font-black text-ink-900">Welcome to BookLocal</p>
          <p className="mb-6 text-[13px] text-ink-500">Sign in to save favourites and manage your bookings.</p>

          <div className="flex flex-col gap-3">
            <PrimaryButton fullWidth disabled={loading || submitting !== null} onClick={() => void begin("email", () => login(returnTo))}>
              <LogIn size={16} />
              {submitting === "email" ? "Opening sign-in…" : "Sign in with email"}
            </PrimaryButton>

            <button type="button" disabled={loading || submitting !== null} onClick={() => void begin("google", () => loginWithProvider("google", returnTo))} className="w-full cursor-pointer rounded-2xl border border-ink-200 bg-white py-3.5 text-sm font-bold text-ink-700 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting === "google" ? "Opening Google…" : "Continue with Google"}
            </button>
            <button type="button" disabled={loading || submitting !== null} onClick={() => void begin("facebook", () => loginWithProvider("facebook", returnTo))} className="w-full cursor-pointer rounded-2xl border border-ink-200 bg-white py-3.5 text-sm font-bold text-ink-700 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting === "facebook" ? "Opening Facebook…" : "Continue with Facebook"}
            </button>
            <button type="button" disabled={loading || submitting !== null} onClick={() => void begin("register", () => register(returnTo))} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 py-3.5 text-sm font-bold text-brand-700 disabled:cursor-not-allowed disabled:opacity-50">
              <UserPlus size={16} />
              {submitting === "register" ? "Opening registration…" : "Create an account"}
            </button>
          </div>

          {(error || authError || callbackError) && <p className="mt-4 text-sm font-semibold text-red-500">{error || callbackError || authError}</p>}

          <div className="my-5 flex items-center gap-3 text-xs text-ink-400"><span className="h-px flex-1 bg-ink-100" />or<span className="h-px flex-1 bg-ink-100" /></div>
          <button type="button" onClick={continueAsGuest} className="w-full cursor-pointer border-0 bg-transparent py-2 text-sm font-bold text-ink-600 hover:text-ink-900">Continue as guest</button>
          <p className="mt-3 text-center text-xs leading-relaxed text-ink-400">Guest checkout remains available. Sign in when you want booking history and saved merchants.</p>
        </div>
      </div>
      <Footer />
    </PageContainer>
  );
}
