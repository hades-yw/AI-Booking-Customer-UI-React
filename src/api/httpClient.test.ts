// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateBookingPayload } from "../types";
import { httpApiClient, setAccessTokenProvider } from "./httpClient";

const payload = {
  tenantSlug: "salon",
  tenantTimezone: "UTC",
  merchant: { id: "salon", name: "Salon" },
  pkg: { id: "1", name: "Cut", duration: 60, selectedPackages: [], selectedOptions: [] },
  schedule: { date: "2026-09-09", slot: "10:00 AM", startTime: "2026-09-09T10:00:00" },
  customer: { name: "Guest", phone: "0123456789", notes: "" },
  paymentMethod: "card",
  serviceId: 1,
  optionIds: [],
} as unknown as CreateBookingPayload;

describe("optional booking authentication", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      id: 1,
      booking_number: "BOOK-1",
      status: "pending",
      total_amount: 10,
      discount_amount: 0,
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
  });

  it("omits Authorization for a guest booking", async () => {
    setAccessTokenProvider(async () => undefined);
    await httpApiClient.createBooking(payload);
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(new Headers(init?.headers).has("Authorization")).toBe(false);
  });

  it("uses the current Keycloak token for a signed-in booking", async () => {
    setAccessTokenProvider(async () => "customer-token");
    await httpApiClient.createBooking(payload);
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer customer-token");
  });

  it("does not retry an expired signed-in session as a guest booking", async () => {
    setAccessTokenProvider(async () => {
      throw new Error("Your session expired");
    });
    await expect(httpApiClient.createBooking(payload)).rejects.toThrow("session expired");
    expect(fetch).not.toHaveBeenCalled();
  });
});
