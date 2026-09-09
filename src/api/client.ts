import type {
  AuthUser,
  BookingConfirmation,
  BookingReceipt,
  BookingSummary,
  CreateBookingPayload,
  DayAvailability,
  FavoriteMerchant,
  Merchant,
  ProfileUpdate,
  Quote,
  Staff,
  StaffDayAvailability,
} from "../types";

// ─── API CLIENT CONTRACT ────────────────────────────────────────────────────
// This is the single interface the rest of the app depends on. Swap
// `mockApiClient` (api/mockClient.ts) for a real HTTP-backed implementation
// (api/httpClient.ts) in api/index.ts and nothing outside this folder needs
// to change.

export interface ApiClient {
  getCategories(): Promise<string[]>;
  getMerchants(params?: { category?: string; search?: string }): Promise<Merchant[]>;
  getMerchant(id: string): Promise<Merchant | undefined>;
  getAvailability(merchantId: string, packageId: string): Promise<DayAvailability[]>;
  getAvailabilityForDate(merchantId: string, packageId: string, date: string): Promise<DayAvailability>;
  getStaff(merchantId: string): Promise<Staff[]>;
  getAvailabilityByStaff(merchantId: string, packageId: string, date: string): Promise<StaffDayAvailability[]>;
  getQuote(
    tenantSlug: string,
    request: {
      startTimeLocalNaive: string;
      tenantTimezone: string;
      durationMinutes: number;
      serviceId: number;
      packageId?: number;
      optionIds: number[];
      couponCode?: string;
    },
  ): Promise<Quote>;
  createBooking(payload: CreateBookingPayload): Promise<BookingConfirmation>;
  getBookingReceipt(tenantSlug: string, bookingRef: string): Promise<BookingReceipt | undefined>;
  uploadPaymentReceipt(tenantSlug: string, bookingId: number, file: File): Promise<{ url: string }>;
  getMe(): Promise<AuthUser>;
  updateProfile(update: ProfileUpdate): Promise<AuthUser>;
  getMyBookings(): Promise<BookingSummary[]>;
  getFavorites(): Promise<FavoriteMerchant[]>;
  addFavorite(tenantSlug: string): Promise<FavoriteMerchant>;
  removeFavorite(tenantSlug: string): Promise<void>;
}

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
