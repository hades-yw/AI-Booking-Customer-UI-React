// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  init: vi.fn(async () => true),
  updateToken: vi.fn(async () => true),
  login: vi.fn(async () => undefined),
  register: vi.fn(async () => undefined),
  logout: vi.fn(async () => undefined),
  accountManagement: vi.fn(async () => undefined),
}));

vi.mock("keycloak-js", () => ({
  default: class MockKeycloak {
    authenticated = true;
    token = "fresh-token";
    onAuthLogout?: () => void;
    onTokenExpired?: () => void;
    init = mocks.init;
    updateToken = mocks.updateToken;
    login = mocks.login;
    register = mocks.register;
    logout = mocks.logout;
    accountManagement = mocks.accountManagement;
    clearToken = vi.fn(() => {
      this.authenticated = false;
      this.token = undefined as unknown as string;
    });
  },
}));

describe("Keycloak browser integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("accepts same-origin return paths and rejects external or auth-loop paths", async () => {
    const { safeReturnPath } = await import("./keycloak");
    expect(safeReturnPath("/merchants/salon/book?step=2")).toBe("/merchants/salon/book?step=2");
    expect(safeReturnPath("https://attacker.example/steal")).toBe("/");
    expect(safeReturnPath("/login")).toBe("/");
    expect(safeReturnPath("/auth/callback?code=secret")).toBe("/");
  });

  it("initializes the adapter once and removes the legacy persisted token", async () => {
    const { initializeAuth } = await import("./keycloak");
    localStorage.setItem("rservo_token", "legacy-token");
    const first = initializeAuth(vi.fn());
    const second = initializeAuth(vi.fn());
    await Promise.all([first, second]);
    expect(mocks.init).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("rservo_token")).toBeNull();
  });

  it("shares concurrent token refresh and returns the refreshed token", async () => {
    const { accessToken } = await import("./keycloak");
    const [first, second] = await Promise.all([accessToken(), accessToken()]);
    expect(first).toBe("fresh-token");
    expect(second).toBe("fresh-token");
    expect(mocks.updateToken).toHaveBeenCalledTimes(1);
  });

  it("rejects when an authenticated session cannot be refreshed", async () => {
    const { accessToken } = await import("./keycloak");
    mocks.updateToken.mockRejectedValueOnce(new Error("offline"));
    await expect(accessToken()).rejects.toThrow("session expired");
  });
});
