import type { ApiClient } from "./client";
import { httpApiClient } from "./httpClient";

// ─── API ENTRY POINT ─────────────────────────────────────────────────────────
// The rest of the app imports `api` from here, never from mockClient/httpClient
// directly. Tenant browsing (getCategories/getMerchants/getMerchant) and
// availability (getAvailability/getAvailabilityForDate/getStaff/
// getAvailabilityByStaff) are live against the real backend's /v1/public/*
// endpoints (VITE_API_BASE_URL, see .env). Auth/booking-creation in
// httpClient.ts are still placeholders — swap to mockApiClient (./mockClient)
// if you need those flows working end-to-end before the real endpoints exist.

export const api: ApiClient = httpApiClient;

export type { ApiClient } from "./client";
export { ApiError } from "./client";
