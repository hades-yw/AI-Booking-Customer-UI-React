import Keycloak, { type KeycloakLoginOptions } from "keycloak-js";

const RETURN_PATH_KEY = "booklocal_auth_return_path";
const CALLBACK_PATH = "/auth/callback";

let instance: Keycloak | undefined;
let initialization: Promise<boolean> | undefined;
let sessionLostHandler: (() => void) | undefined;
let refresh: Promise<string | undefined> | undefined;

function keycloak(): Keycloak {
  return instance ??= new Keycloak({
    url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8180",
    realm: import.meta.env.VITE_KEYCLOAK_REALM || "booking",
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "booking-web",
  });
}

export function safeReturnPath(value?: string | null): string {
  if (!value) return "/";
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin || !url.pathname.startsWith("/")) return "/";
    if (url.pathname === "/login" || url.pathname === "/register" || url.pathname === CALLBACK_PATH) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export function saveReturnPath(path?: string): void {
  sessionStorage.setItem(RETURN_PATH_KEY, safeReturnPath(path ?? `${window.location.pathname}${window.location.search}`));
}

export function peekReturnPath(): string {
  return safeReturnPath(sessionStorage.getItem(RETURN_PATH_KEY));
}

export function consumeReturnPath(): string {
  const path = peekReturnPath();
  sessionStorage.removeItem(RETURN_PATH_KEY);
  return path;
}

export function initializeAuth(onSessionLost: () => void): Promise<boolean> {
  localStorage.removeItem("booklocal_token");
  sessionLostHandler = onSessionLost;
  const kc = keycloak();
  kc.onAuthLogout = () => sessionLostHandler?.();
  kc.onTokenExpired = () => {
    void accessToken().then((token) => {
      if (!token) sessionLostHandler?.();
    }).catch(() => undefined);
  };
  return initialization ??= kc.init({
    onLoad: "check-sso",
    pkceMethod: "S256",
    checkLoginIframe: false,
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    silentCheckSsoFallback: false,
    messageReceiveTimeout: 5000,
  });
}

export async function accessToken(): Promise<string | undefined> {
  const kc = keycloak();
  if (!kc.authenticated) return undefined;
  refresh ??= kc
    .updateToken(30)
    .then(() => kc.token)
    .catch(() => {
      kc.clearToken();
      sessionLostHandler?.();
      throw new Error("Your session expired. Please sign in again before continuing.");
    })
    .finally(() => {
      refresh = undefined;
    });
  return refresh;
}

async function redirectToLogin(options: KeycloakLoginOptions, returnTo?: string): Promise<void> {
  saveReturnPath(returnTo);
  await keycloak().login({
    ...options,
    redirectUri: `${window.location.origin}${CALLBACK_PATH}`,
  });
}

export function login(returnTo?: string): Promise<void> {
  return redirectToLogin({ prompt: "login" }, returnTo);
}

export function loginWithProvider(provider: "google" | "facebook", returnTo?: string): Promise<void> {
  return redirectToLogin({ prompt: "login", idpHint: provider }, returnTo);
}

export async function register(returnTo?: string): Promise<void> {
  saveReturnPath(returnTo);
  await keycloak().register({ redirectUri: `${window.location.origin}${CALLBACK_PATH}` });
}

export function manageAccount(): Promise<void> {
  return keycloak().accountManagement();
}

export async function logout(): Promise<void> {
  sessionStorage.removeItem(RETURN_PATH_KEY);
  await keycloak().logout({ redirectUri: window.location.origin });
}
