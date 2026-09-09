import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../api";
import { setAccessTokenProvider } from "../api/httpClient";
import {
  accessToken,
  initializeAuth,
  login as keycloakLogin,
  loginWithProvider as keycloakLoginWithProvider,
  logout as keycloakLogout,
  manageAccount,
  register as keycloakRegister,
} from "../auth/keycloak";
import type { AuthUser, ProfileUpdate } from "../types";

type SocialProvider = "google" | "facebook";

interface AuthContextValue {
  user: AuthUser | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (returnTo?: string) => Promise<void>;
  loginWithProvider: (provider: SocialProvider, returnTo?: string) => Promise<void>;
  register: (returnTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  manageAccount: () => Promise<void>;
  updateProfile: (update: ProfileUpdate) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function authErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Sign-in is temporarily unavailable. You can still browse and book as a guest.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const availabilityTimer = window.setTimeout(() => {
      if (!active) return;
      setLoading(false);
      setError("Sign-in is taking longer than expected. You can continue browsing and book as a guest.");
    }, 8000);
    setAccessTokenProvider(accessToken);
    const clearSession = () => {
      if (!active) return;
      setAuthenticated(false);
      setUser(null);
    };

    initializeAuth(clearSession)
      .then(async (signedIn) => {
        if (!active) return;
        window.clearTimeout(availabilityTimer);
        setError(null);
        setAuthenticated(signedIn);
        if (signedIn) setUser(await api.getMe());
      })
      .catch((reason: unknown) => {
        if (!active) return;
        window.clearTimeout(availabilityTimer);
        clearSession();
        setError(authErrorMessage(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.clearTimeout(availabilityTimer);
    };
  }, []);

  const login = useCallback((returnTo?: string) => {
    setError(null);
    return keycloakLogin(returnTo);
  }, []);

  const loginWithProvider = useCallback((provider: SocialProvider, returnTo?: string) => {
    setError(null);
    return keycloakLoginWithProvider(provider, returnTo);
  }, []);

  const register = useCallback((returnTo?: string) => {
    setError(null);
    return keycloakRegister(returnTo);
  }, []);

  const logout = useCallback(async () => {
    setAuthenticated(false);
    setUser(null);
    await keycloakLogout();
  }, []);

  const updateProfile = useCallback(
    async (update: ProfileUpdate) => {
      if (!authenticated || !user) throw new Error("Please sign in");
      const profile = await api.updateProfile(update);
      setUser({ ...profile, id: user.id });
    },
    [authenticated, user],
  );

  const value = useMemo(
    () => ({
      user,
      authenticated,
      loading,
      error,
      login,
      loginWithProvider,
      register,
      logout,
      manageAccount,
      updateProfile,
    }),
    [user, authenticated, loading, error, login, loginWithProvider, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
