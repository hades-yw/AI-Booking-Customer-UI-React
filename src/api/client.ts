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
  RegisterPayload,
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
  createBooking(payload: CreateBookingPayload, token?: string): Promise<BookingConfirmation>;
  getBookingReceipt(tenantSlug: string, bookingRef: string): Promise<BookingReceipt | undefined>;
  uploadPaymentReceipt(tenantSlug: string, bookingId: number, file: File): Promise<{ url: string }>;
  register(payload: RegisterPayload): Promise<AuthUser>;
  login(email: string, password: string): Promise<{ token: string }>;
  getMe(token: string): Promise<AuthUser>;
  updateProfile(token: string, update: ProfileUpdate): Promise<AuthUser>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  changePassword(token: string, currentPassword: string, newPassword: string): Promise<void>;
  getMyBookings(token: string): Promise<BookingSummary[]>;
  getFavorites(token: string): Promise<FavoriteMerchant[]>;
  addFavorite(token: string, tenantSlug: string): Promise<FavoriteMerchant>;
  removeFavorite(token: string, tenantSlug: string): Promise<void>;
}

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
