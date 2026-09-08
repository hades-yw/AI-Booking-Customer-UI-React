import type { ApiClient } from "./client";
import { ApiError } from "./client";
import { CATEGORIES, MERCHANTS } from "./mockData";
import type {
  AuthUser,
  BookingConfirmation,
  BookingSummary,
  CreateBookingPayload,
  DayAvailability,
  FavoriteMerchant,
  ProfileUpdate,
  Quote,
  RegisterPayload,
  Staff,
  StaffDayAvailability,
  TimeSlot,
} from "../types";
import { toISODate } from "../lib/date";

const MOCK_COUPONS: Record<string, { discountType: "percentage" | "fixed_amount"; value: number }> = {
  SAVE10: { discountType: "percentage", value: 10 },
  RM20OFF: { discountType: "fixed_amount", value: 20 },
};

const NETWORK_DELAY_MS = 350;
const SERVICE_FEE = 2;

function delay<T>(value: T, ms = NETWORK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ─── MOCK AUTH STORE ────────────────────────────────────────────────────────
// Persisted to localStorage (not just in-memory) so that flows spanning a
// real page navigation — like clicking a password-reset link from "email" —
// still see the same users after the page reloads.

interface MockUserRecord extends AuthUser {
  password: string;
}

const STORAGE_KEY = "booklocal_mock_users";
const RESET_TOKEN_PREFIX = "mock-reset-";

function loadMockUsers(): MockUserRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MockUserRecord[]) : [];
  } catch {
    return [];
  }
}

function saveMockUsers(users: MockUserRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

const mockUsers: MockUserRecord[] = loadMockUsers();
let nextUserId = mockUsers.reduce((max, u) => Math.max(max, u.id), 0) + 1;

function tokenForUser(id: number): string {
  return `mock-token-${id}`;
}

function userIdFromToken(token: string): number | null {
  const match = /^mock-token-(\d+)$/.exec(token);
  return match ? Number(match[1]) : null;
}

function toAuthUser(record: MockUserRecord): AuthUser {
  return { id: record.id, name: record.name, email: record.email };
}

const TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

/** Cheap deterministic hash so the same ISO date always yields the same slots. */
function seededRandom(seed: string, index: number): number {
  let hash = 0;
  const str = `${seed}-${index}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

function slotsForDate(iso: string): TimeSlot[] {
  return TIME_SLOTS.filter((_, i) => seededRandom(iso, i) > 0.35).map((label) => ({
    label,
    startTime: `${iso}T${labelTo24hHHMM(label)}:00`,
    endTime: `${iso}T${labelTo24hHHMM(label)}:00`,
    available: true,
  }));
}

function generateAvailability(): DayAvailability[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const date = toISODate(d);
    return { date, slots: slotsForDate(date) };
  });
}

// ─── MOCK STAFF ──────────────────────────────────────────────────────────────
// Keyed by merchant id. Merchant "4" is deliberately absent to exercise the
// "tenant has no staff → hide the By Staff toggle" path in mock mode too.
const MOCK_STAFF: Record<string, Staff[]> = {
  "1": [
    { id: "staff-1", name: "Amy Lee", role: "Senior Stylist" },
    { id: "staff-2", name: "Ben Tan", role: "Colorist" },
  ],
  "2": [
    { id: "staff-3", name: "Chloe Ng", role: "Massage Therapist" },
    { id: "staff-4", name: "Daniel Goh", role: "Physiotherapist" },
  ],
  "3": [{ id: "staff-5", name: "Ella Wong", role: "Photographer" }],
};

function labelTo24hHHMM(label: string): string {
  const [time, period] = label.split(" ");
  const [hourStr, minuteStr] = time.split(":");
  let hour = Number(hourStr);
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minuteStr}`;
}

function slotsForStaffDate(staffId: string, iso: string): TimeSlot[] {
  return TIME_SLOTS.filter((_, i) => seededRandom(`${staffId}-${iso}`, i) > 0.4).map((label) => ({
    label,
    startTime: `${iso}T${labelTo24hHHMM(label)}:00`,
    endTime: `${iso}T${labelTo24hHHMM(label)}:00`,
    available: true,
  }));
}

// ─── MOCK FAVORITES STORE ────────────────────────────────────────────────────
// Keyed by mock user id, persisted alongside the mock users so favorites
// survive a page reload within the same mock session.

const FAVORITES_STORAGE_KEY = "booklocal_mock_favorites";

function loadMockFavorites(): Record<number, FavoriteMerchant[]> {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<number, FavoriteMerchant[]>) : {};
  } catch {
    return {};
  }
}

function saveMockFavorites(favorites: Record<number, FavoriteMerchant[]>): void {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
}

const mockFavorites: Record<number, FavoriteMerchant[]> = loadMockFavorites();

function requireMockUserId(token: string): number {
  const id = userIdFromToken(token);
  if (id === null) throw new ApiError("Invalid credentials", 401);
  return id;
}

export const mockApiClient: ApiClient = {
  async getCategories() {
    return delay([...CATEGORIES]);
  },

  async getMerchants(params) {
    const { category, search } = params ?? {};
    const filtered = MERCHANTS.filter((m) => {
      const matchCat = !category || category === "All" || m.category === category;
      const query = (search ?? "").trim().toLowerCase();
      const matchSearch =
        !query || m.name.toLowerCase().includes(query) || m.category.toLowerCase().includes(query);
      return matchCat && matchSearch;
    });
    return delay(filtered);
  },

  async getMerchant(id) {
    return delay(MERCHANTS.find((m) => m.id === id));
  },

  async getAvailability(merchantId, packageId) {
    // `packageId` here is actually the booked ServicePackage.id, which
    // ServiceAccordion.tsx always sets to the parent service's id (never a
    // ServicePackageTier.id) — see handleBook in ServiceAccordion.tsx.
    const merchant = MERCHANTS.find((m) => m.id === merchantId);
    const hasService = merchant?.services.some((s) => s.id === packageId);
    if (!hasService) {
      throw new ApiError("Merchant or service not found", 404);
    }
    return delay(generateAvailability());
  },

  async getAvailabilityForDate(merchantId, packageId, date) {
    const merchant = MERCHANTS.find((m) => m.id === merchantId);
    const hasService = merchant?.services.some((s) => s.id === packageId);
    if (!hasService) {
      throw new ApiError("Merchant or service not found", 404);
    }
    return delay({ date, slots: slotsForDate(date) });
  },

  async getStaff(merchantId) {
    return delay([...(MOCK_STAFF[merchantId] ?? [])]);
  },

  async getAvailabilityByStaff(merchantId, _packageId, date) {
    const staffList = MOCK_STAFF[merchantId] ?? [];
    return delay(
      staffList.map(
        (s): StaffDayAvailability => ({
          date,
          staffId: s.id,
          staffName: s.name,
          slots: slotsForStaffDate(s.id, date),
        }),
      ),
    );
  },

  async getQuote(_tenantSlug, req): Promise<Quote> {
    const coupon = req.couponCode ? MOCK_COUPONS[req.couponCode.toUpperCase()] : undefined;
    if (req.couponCode && !coupon) {
      throw new ApiError("Invalid coupon code", 400);
    }
    // Mock subtotal has no visibility into per-service/package/option pricing
    // here (unlike the real quote endpoint) — approximate using SERVICE_FEE
    // as the processing fee and a flat subtotal derived from the request.
    const subtotal = 0;
    const discountAmount = coupon
      ? coupon.discountType === "percentage"
        ? (subtotal * coupon.value) / 100
        : Math.min(coupon.value, subtotal)
      : 0;
    return delay(
      {
        currency: "MYR",
        billableDurationMinutes: req.durationMinutes,
        bonusDurationMinutes: 0,
        lines: [],
        subtotal,
        peakAdjustment: 0,
        discountAmount,
        processingFee: SERVICE_FEE,
        totalAmount: Math.max(subtotal - discountAmount, 0) + SERVICE_FEE,
        couponCode: coupon ? req.couponCode : undefined,
      },
      300,
    );
  },

  async createBooking(payload: CreateBookingPayload, _token?: string): Promise<BookingConfirmation> {
    const { pkg } = payload;
    const bookingRef = "BK-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const discountAmount = payload.couponCode && MOCK_COUPONS[payload.couponCode.toUpperCase()]
      ? MOCK_COUPONS[payload.couponCode.toUpperCase()].discountType === "percentage"
        ? (pkg.total * MOCK_COUPONS[payload.couponCode.toUpperCase()].value) / 100
        : Math.min(MOCK_COUPONS[payload.couponCode.toUpperCase()].value, pkg.total)
      : 0;

    return delay(
      {
        id: Math.floor(Math.random() * 100000),
        bookingRef,
        status: "pending",
        merchant: payload.merchant,
        pkg,
        schedule: payload.schedule,
        customer: payload.customer,
        paymentMethod: payload.paymentMethod,
        total: pkg.total + SERVICE_FEE - discountAmount,
        discountAmount,
        couponCode: payload.couponCode,
      },
      600,
    );
  },

  uploadPaymentReceipt(_tenantSlug, _bookingId, _file) {
    return delay({ url: "mock://payment-receipt.jpg" }, 400);
  },

  async register(payload: RegisterPayload) {
    const exists = mockUsers.some((u) => u.email.toLowerCase() === payload.email.toLowerCase());
    if (exists) throw new ApiError("Email already registered", 400);
    const record: MockUserRecord = {
      id: nextUserId++,
      name: payload.name,
      email: payload.email,
      password: payload.password,
    };
    mockUsers.push(record);
    saveMockUsers(mockUsers);
    return delay(toAuthUser(record));
  },

  async login(email: string, password: string) {
    const record = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!record || record.password !== password) {
      throw new ApiError("Invalid credentials", 401);
    }
    return delay({ token: tokenForUser(record.id) });
  },

  async getMe(token: string) {
    const id = userIdFromToken(token);
    const record = mockUsers.find((u) => u.id === id);
    if (!record) throw new ApiError("Invalid credentials", 401);
    return delay(toAuthUser(record));
  },

  async updateProfile(token: string, update: ProfileUpdate) {
    const id = userIdFromToken(token);
    const record = mockUsers.find((u) => u.id === id);
    if (!record) throw new ApiError("Invalid credentials", 401);
    if (update.name !== undefined) record.name = update.name;
    if (update.email !== undefined) record.email = update.email;
    saveMockUsers(mockUsers);
    return delay(toAuthUser(record));
  },

  async forgotPassword(email: string) {
    // Always resolves — never reveal whether an email is registered.
    const record = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (record) {
      // No email transport in the mock client — log the reset link like the
      // real backend does in dev mode (ENABLE_EMAIL_SENDING=false).
      console.info(`[mock] Password reset link: /reset-password?token=${RESET_TOKEN_PREFIX}${record.id}`);
    }
    await delay(undefined);
  },

  async resetPassword(token: string, newPassword: string) {
    if (!token.startsWith(RESET_TOKEN_PREFIX)) {
      throw new ApiError("Invalid or expired reset link", 400);
    }
    const id = Number(token.slice(RESET_TOKEN_PREFIX.length));
    const record = mockUsers.find((u) => u.id === id);
    if (!record) throw new ApiError("Invalid or expired reset link", 400);
    record.password = newPassword;
    saveMockUsers(mockUsers);
    await delay(undefined);
  },

  async changePassword(token: string, currentPassword: string, newPassword: string) {
    const id = userIdFromToken(token);
    const record = mockUsers.find((u) => u.id === id);
    if (!record) throw new ApiError("Invalid credentials", 401);
    if (record.password !== currentPassword) {
      throw new ApiError("Current password is incorrect", 400);
    }
    record.password = newPassword;
    saveMockUsers(mockUsers);
    await delay(undefined);
  },

  async getMyBookings(_token: string) {
    // Mock client has no booking-history store — the mock login flow is
    // exercised without a preceding createBooking call.
    return delay([] as BookingSummary[]);
  },

  async getBookingReceipt(_tenantSlug: string, _bookingRef: string) {
    // Mock client has no booking-history store — see getMyBookings above.
    return delay(undefined);
  },

  async getFavorites(token: string) {
    const id = requireMockUserId(token);
    return delay([...(mockFavorites[id] ?? [])]);
  },

  async addFavorite(token: string, tenantSlug: string) {
    const id = requireMockUserId(token);
    const merchant = MERCHANTS.find((m) => m.id === tenantSlug);
    if (!merchant) throw new ApiError("Tenant not found", 404);
    const existing = mockFavorites[id] ?? [];
    const already = existing.find((f) => f.merchant.id === tenantSlug);
    if (already) return delay(already);
    const favorite: FavoriteMerchant = { merchant, favoritedAt: new Date().toISOString() };
    mockFavorites[id] = [favorite, ...existing];
    saveMockFavorites(mockFavorites);
    return delay(favorite);
  },

  async removeFavorite(token: string, tenantSlug: string) {
    const id = requireMockUserId(token);
    mockFavorites[id] = (mockFavorites[id] ?? []).filter((f) => f.merchant.id !== tenantSlug);
    saveMockFavorites(mockFavorites);
    await delay(undefined);
  },
};
