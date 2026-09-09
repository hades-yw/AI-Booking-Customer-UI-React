import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { consumeReturnPath } from "../auth/keycloak";
import { LoadingState } from "../components/ui/AsyncState";
import { PageContainer } from "../components/layout/PageContainer";
import { useAuth } from "../context/AuthContext";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) navigate(consumeReturnPath(), { replace: true });
    else navigate("/login?authError=1", { replace: true });
  }, [loading, navigate, user]);

  return <PageContainer><div className="flex flex-1 items-center justify-center"><LoadingState label="Completing sign-in…" /></div></PageContainer>;
}
