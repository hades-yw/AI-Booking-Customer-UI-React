import type { ApiClient } from "./client";
import { ApiError } from "./client";
import { formatLocalNaiveTime, toISODate } from "../lib/date";
import type {
  AuthUser,
  BookingConfirmation,
  BookingReceipt,
  BookingSummary,
  CreateBookingPayload,
  DayAvailability,
  FavoriteMerchant,
  GalleryImage,
  GradientPair,
  Merchant,
  ProfileUpdate,
  Quote,
  Service,
  Staff,
  StaffDayAvailability,
  TimeSlot,
} from "../types";

// ─── HTTP API CLIENT ─────────────────────────────────────────────────────────
// Talks to the real FastAPI backend: tenant browsing/availability under
// /v1/public/*, auth under /v1/auth/* and /v1/customers/me.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

type AuthMode = "none" | "optional" | "required";
type AccessTokenProvider = () => Promise<string | undefined>;

let accessTokenProvider: AccessTokenProvider | undefined;

export function setAccessTokenProvider(provider: AccessTokenProvider): void {
  accessTokenProvider = provider;
}

async function tokenFor(mode: AuthMode): Promise<string | undefined> {
  if (mode === "none") return undefined;
  const token = await accessTokenProvider?.();
  if (!token && mode === "required") throw new ApiError("Please sign in", 401);
  return token;
}

async function request<T>(path: string, init?: RequestInit, auth: AuthMode = "none"): Promise<T> {
  const token = await tokenFor(auth);
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") message = body.detail;
    } catch {
      // Response wasn't JSON — fall back to the status-based message.
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { method: "POST", body: formData });
  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") message = body.detail;
    } catch {
      // Response wasn't JSON — fall back to the status-based message.
    }
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

// ─── LOCAL-NAIVE → UTC CONVERSION ────────────────────────────────────────────
// The availability endpoints return tenant-LOCAL NAIVE datetime strings (see
// the note above). The backend's booking/quote endpoints, on the other hand,
// treat a naive datetime they receive as already UTC (see the start_time
// validator in app/schemas/booking_slot.py) — so a naive local string must be
// explicitly converted to a real UTC instant before being submitted, using
// the tenant's IANA timezone (now exposed as `Tenant.timezone` on the public
// tenant response). `Intl.DateTimeFormat` with a target timeZone is used to
// find that zone's UTC offset for the given wall-clock moment (handles DST
// correctly, unlike a fixed offset).
function localNaiveToUtcIso(localNaiveIso: string, timeZone: string): string {
  const [datePart, timePart] = localNaiveIso.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second = 0] = (timePart ?? "00:00:00").split(":").map(Number);
  // Treat the wall-clock fields as if they were UTC to get a baseline instant,
  // then measure how far `timeZone`'s local rendering of that instant drifts
  // from the intended wall-clock time — that drift is the zone's offset.
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(asUtc));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const renderedAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  const offsetMs = renderedAsUtc - asUtc;
  return new Date(asUtc - offsetMs).toISOString();
}

interface BackendUser {
  id: number;
  name: string | null;
  email: string;
}

// ─── AVAILABILITY ────────────────────────────────────────────────────────────
// The backend's available-slots endpoints return start_time/end_time as
// tenant-LOCAL NAIVE datetime strings ("YYYY-MM-DDTHH:MM:SS", no UTC offset)
// — not UTC. `formatSlotLabel` parses the clock-time portion directly with a
// string split rather than `new Date(iso)`, since feeding a naive local
// string through JS's Date would silently reinterpret it in the browser's
// own timezone and shift the displayed hour. These raw strings are kept on
// TimeSlot and carried through SelectedSchedule; getQuote/createBooking
// convert them to UTC via localNaiveToUtcIso before submitting.

interface BackendTimeSlot {
  start_time: string;
  end_time: string;
  duration_minutes: number;
  available: boolean;
  reason: string | null;
}

interface BackendAvailableSlots {
  tenant_slug: string;
  date: string;
  business_hours: { open: string; close: string } | Record<string, never>;
  session_length_minutes: number;
  slots: BackendTimeSlot[];
  available_slots: { start_time: string; end_time: string; duration_minutes: number }[];
  total_slots: number;
  total_available_slots: number;
  message?: string;
}

interface BackendStaffSlots {
  staff_id: number;
  staff_name: string;
  slots: BackendTimeSlot[];
  total_available_slots: number;
}

interface BackendAvailableSlotsByStaff {
  tenant_slug: string;
  date: string;
  business_hours: { open: string; close: string } | Record<string, never>;
  session_length_minutes: number;
  staff: BackendStaffSlots[];
}

interface BackendStaff {
  id: number;
  name: string;
  role: string;
  is_active: boolean;
}

const formatSlotLabel = formatLocalNaiveTime;

function toStaff(s: BackendStaff): Staff {
  return { id: String(s.id), name: s.name, role: s.role };
}

function toAuthUser(user: BackendUser): AuthUser {
  return { id: user.id, name: user.name ?? "", email: user.email };
}

// ─── TENANT → MERCHANT MAPPING ──────────────────────────────────────────────
// The public tenant endpoints don't carry UI-only decoration (rating,
// reviews, distance, tag, gradient) that the mock data has, since those
// aren't real backend concepts yet. We derive a stable placeholder for them
// from the tenant slug so cards render consistently across loads.

const GRADIENTS: GradientPair[] = [
  ["#f472b6", "#e11d48"],
  ["#2dd4bf", "#0284c7"],
  ["#fb923c", "#d97706"],
  ["#60a5fa", "#4f46e5"],
  ["#a78bfa", "#7c3aed"],
  ["#34d399", "#059669"],
];

const TAGS: { tag: string; tagColor: string; tagText: string }[] = [
  { tag: "Top Rated", tagColor: "#fbbf24", tagText: "#78350f" },
  { tag: "Best Seller", tagColor: "#34d399", tagText: "#064e3b" },
  { tag: "New", tagColor: "#818cf8", tagText: "#1e1b4b" },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function resolveAssetUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const origin = BASE_URL.replace(/\/v1\/?$/, "");
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

interface BackendOption {
  id: number;
  name: string;
  description: string | null;
  price: string | number | null;
  pricing_basis?: string | null;
}

interface BackendPackage {
  id: number;
  name: string;
  description: string | null;
  price: string | number | null;
  pricing_basis?: string | null;
  options: BackendOption[];
}

interface BackendService {
  id: number;
  name: string;
  description: string | null;
  price: string | number | null;
  pricing_basis?: string | null;
  packages: BackendPackage[];
}

interface BackendGallery {
  id: number;
  name: string | null;
  description: string | null;
  public_url: string;
}

interface BackendDayHours {
  open: string;
  close: string;
}

interface BackendTenant {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  address: string | null;
  business_sector: string | null;
  logo_url: string | null;
  banner_url: string | null;
  portfolio_url: string | null;
  business_hours: Record<string, BackendDayHours | null> | null;
  default_currency?: string | null;
  default_session_length?: number | null;
  timezone?: string | null;
  qr_code_image: string | null;
  faqs: string | null;
  terms_and_conditions: string | null;
  services: BackendService[];
  galleries: BackendGallery[];
}

interface BackendTenantCard {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  business_sector: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
}

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

function toBusinessHours(hours: BackendTenant["business_hours"]): Merchant["businessHours"] {
  if (!hours) return undefined;
  const result: Merchant["businessHours"] = {};
  for (const [key, value] of Object.entries(hours)) {
    const day = key.toLowerCase() as (typeof DAY_KEYS)[number];
    if (!DAY_KEYS.includes(day)) continue;
    result[day] = value ? { open: value.open, close: value.close } : null;
  }
  return result;
}

function toPricingBasis(basis: string | null | undefined): "flat" | "per_hour" {
  return basis === "per_hour" ? "per_hour" : "flat";
}

function toServices(services: BackendService[], defaultSessionLength: number): Service[] {
  return (services ?? []).map((service) => {
    const price = Number(service.price ?? 0);
    const packages = (service.packages ?? []).map((pkg) => ({
      id: String(pkg.id),
      name: pkg.name,
      duration: defaultSessionLength,
      price: Number(pkg.price ?? 0),
      desc: pkg.description ?? service.description ?? "",
      pricingBasis: toPricingBasis(pkg.pricing_basis),
      options: (pkg.options ?? []).map((opt) => ({
        id: String(opt.id),
        name: opt.name,
        desc: opt.description ?? "",
        price: Number(opt.price ?? 0),
        pricingBasis: toPricingBasis(opt.pricing_basis),
      })),
    }));
    return {
      id: String(service.id),
      name: service.name,
      desc: service.description ?? "",
      price,
      duration: defaultSessionLength,
      packages,
      pricingBasis: toPricingBasis(service.pricing_basis),
    };
  });
}

function tenantCardToMerchant(tenant: BackendTenantCard): Merchant {
  const hash = hashString(tenant.slug);
  return {
    id: tenant.slug,
    name: tenant.name,
    category: tenant.business_sector ?? "General",
    rating: 4.5,
    reviews: 0,
    location: tenant.location ?? [tenant.city, tenant.state].filter(Boolean).join(", "),
    distance: "",
    priceFrom: 0,
    ...TAGS[hash % TAGS.length],
    gradient: GRADIENTS[hash % GRADIENTS.length],
    description: tenant.description ?? "",
    features: [],
    gallery: [],
    services: [],
    bannerUrl: resolveAssetUrl(tenant.banner_url),
    logoUrl: resolveAssetUrl(tenant.logo_url),
  };
}

function tenantToMerchant(tenant: BackendTenant): Merchant {
  const hash = hashString(tenant.slug);
  const services = toServices(tenant.services ?? [], tenant.default_session_length ?? 60);
  const priceFrom = services.length ? Math.min(...services.map((s) => s.price)) : 0;
  return {
    id: tenant.slug,
    name: tenant.name,
    category: tenant.business_sector ?? "General",
    rating: 4.5,
    reviews: 0,
    location: tenant.location ?? [tenant.city, tenant.state].filter(Boolean).join(", "),
    distance: "",
    priceFrom,
    ...TAGS[hash % TAGS.length],
    gradient: GRADIENTS[hash % GRADIENTS.length],
    description: tenant.description ?? "",
    features: (tenant.services ?? []).map((s) => s.name),
    gallery: (tenant.galleries ?? []).map(
      (g): GalleryImage => ({
        gradient: GRADIENTS[hashString(String(g.id)) % GRADIENTS.length],
        label: g.name ?? "Gallery",
        imageUrl: resolveAssetUrl(g.public_url),
      }),
    ),
    services,
    email: tenant.email ?? undefined,
    phone: tenant.phone ?? undefined,
    address: tenant.address ?? undefined,
    businessHours: toBusinessHours(tenant.business_hours),
    faqs: tenant.faqs ?? undefined,
    termsAndConditions: tenant.terms_and_conditions ?? undefined,
    portfolioUrl: tenant.portfolio_url ?? undefined,
    timezone: tenant.timezone ?? undefined,
    currency: tenant.default_currency ?? undefined,
    bannerUrl: resolveAssetUrl(tenant.banner_url),
    logoUrl: resolveAssetUrl(tenant.logo_url),
    qrCodeImage: resolveAssetUrl(tenant.qr_code_image),
  };
}

interface BackendQuoteLine {
  type: "service" | "package" | "option";
  id: number;
  name: string;
  amount: string | number;
  pricing_basis: string;
  pricing_role: string;
}

interface BackendQuoteResponse {
  currency: string;
  billable_duration_minutes: number;
  bonus_duration_minutes: number;
  lines: BackendQuoteLine[];
  subtotal: string | number;
  peak_adjustment: string | number;
  discount_amount: string | number;
  processing_fee: string | number;
  total_amount: string | number;
  coupon: { code: string } | null;
}

function toQuote(res: BackendQuoteResponse): Quote {
  return {
    currency: res.currency,
    billableDurationMinutes: res.billable_duration_minutes,
    bonusDurationMinutes: res.bonus_duration_minutes,
    lines: res.lines.map((line) => ({
      type: line.type,
      name: line.name,
      amount: Number(line.amount),
      pricingBasis: line.pricing_basis === "per_hour" ? "per_hour" : "flat",
    })),
    subtotal: Number(res.subtotal),
    peakAdjustment: Number(res.peak_adjustment),
    discountAmount: Number(res.discount_amount),
    processingFee: Number(res.processing_fee),
    totalAmount: Number(res.total_amount),
    couponCode: res.coupon?.code,
  };
}

interface BackendBookingResponse {
  id: number;
  booking_number: string;
  status: string;
  start_time: string;
  currency: string;
  total_amount: string | number;
  discount_amount: string | number;
  tenant_slug?: string | null;
  tenant_name?: string | null;
  status_remarks?: string | null;
}

// GET /public/bookings/{tenantSlug}/booking/{bookingNumber} — a past
// booking's public receipt view (no guest/customer contact details).
interface BackendPublicBookingSlotOption {
  option_name_snapshot?: string | null;
}

interface BackendPublicBookingSlot {
  service_name_snapshot?: string | null;
  package_name_snapshot?: string | null;
  staff_name?: string | null;
  start_time: string;
  end_time: string;
  options: BackendPublicBookingSlotOption[];
}

interface BackendPublicBooking {
  id: number;
  booking_number: string;
  status: string;
  start_time: string;
  end_time: string;
  total_amount: string | number;
  discount_amount: string | number;
  currency: string;
  slots: BackendPublicBookingSlot[];
  status_remarks?: string | null;
  payment_proof_uploaded?: boolean;
}

interface BackendFavoriteTenant {
  id: number;
  tenant_id: number;
  created_at: string;
  tenant: BackendTenantCard;
}

function toBookingSummary(res: BackendBookingResponse): BookingSummary {
  return {
    id: res.id,
    bookingRef: res.booking_number,
    status: res.status,
    startTime: res.start_time,
    totalAmount: Number(res.total_amount),
    currency: res.currency,
    tenantSlug: res.tenant_slug ?? undefined,
    merchantName: res.tenant_name ?? undefined,
    statusRemarks: res.status_remarks ?? undefined,
  };
}

function toBookingReceipt(res: BackendPublicBooking, merchant: Merchant): BookingReceipt {
  return {
    id: res.id,
    bookingRef: res.booking_number,
    status: res.status,
    merchant,
    startTime: res.start_time,
    endTime: res.end_time,
    items: res.slots.map((slot) => ({
      serviceName: slot.service_name_snapshot ?? undefined,
      packageName: slot.package_name_snapshot ?? undefined,
      staffName: slot.staff_name ?? undefined,
      optionNames: slot.options.map((o) => o.option_name_snapshot).filter((n): n is string => Boolean(n)),
    })),
    totalAmount: Number(res.total_amount),
    discountAmount: Number(res.discount_amount),
    currency: res.currency,
    cancellationReason: res.status_remarks ?? undefined,
    paymentProofUploaded: res.payment_proof_uploaded ?? false,
  };
}

function toFavoriteMerchant(res: BackendFavoriteTenant): FavoriteMerchant {
  return {
    merchant: tenantCardToMerchant(res.tenant),
    favoritedAt: res.created_at,
  };
}

export const httpApiClient: ApiClient = {
  async getCategories() {
    const sectors = await request<{ sector: string; tenant_count: number }[]>(
      "/public/tenants/business-sectors",
    );
    return ["All", ...sectors.map((s) => s.sector)];
  },

  async getMerchants(params) {
    const query = new URLSearchParams();
    if (params?.category && params.category !== "All") query.set("sector", params.category);
    const qs = query.toString();
    const tenants = await request<BackendTenantCard[]>(`/public/tenants/${qs ? `?${qs}` : ""}`);
    const search = params?.search?.trim().toLowerCase();
    return tenants
      .filter((t) => !search || t.name.toLowerCase().includes(search) || (t.business_sector ?? "").toLowerCase().includes(search))
      .map(tenantCardToMerchant);
  },

  async getMerchant(id) {
    try {
      const tenant = await request<BackendTenant>(`/public/tenants/${id}`);
      return tenantToMerchant(tenant);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined;
      throw err;
    }
  },

  async getAvailability(merchantId, _packageId) {
    const today = new Date();
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return toISODate(d);
    });
    const days = await Promise.all(
      dates.map(async (date) => {
        const res = await request<BackendAvailableSlots>(
          `/public/bookings/${merchantId}/available-slots?date=${date}`,
        );
        return {
          date,
          slots: res.available_slots.map(
            (s): TimeSlot => ({
              label: formatSlotLabel(s.start_time),
              startTime: s.start_time,
              endTime: s.end_time,
              available: true,
            }),
          ),
        } satisfies DayAvailability;
      }),
    );
    return days;
  },

  async getAvailabilityForDate(merchantId, _packageId, date) {
    const res = await request<BackendAvailableSlots>(
      `/public/bookings/${merchantId}/available-slots?date=${date}`,
    );
    return {
      date,
      slots: res.available_slots.map(
        (s): TimeSlot => ({
          label: formatSlotLabel(s.start_time),
          startTime: s.start_time,
          endTime: s.end_time,
          available: true,
        }),
      ),
    };
  },

  async getStaff(merchantId) {
    const staff = await request<BackendStaff[]>(`/public/staff/${merchantId}`);
    return staff.filter((s) => s.is_active).map(toStaff);
  },

  async getAvailabilityByStaff(merchantId, _packageId, date) {
    const res = await request<BackendAvailableSlotsByStaff>(
      `/public/bookings/${merchantId}/available-slots-by-staff?date=${date}`,
    );
    return res.staff.map(
      (s): StaffDayAvailability => ({
        date,
        staffId: String(s.staff_id),
        staffName: s.staff_name,
        slots: s.slots
          .filter((sl) => sl.available)
          .map(
            (sl): TimeSlot => ({
              label: formatSlotLabel(sl.start_time),
              startTime: sl.start_time,
              endTime: sl.end_time,
              available: sl.available,
            }),
          ),
      }),
    );
  },

  async getQuote(tenantSlug, req) {
    const res = await request<BackendQuoteResponse>(`/public/bookings/${tenantSlug}/quote`, {
      method: "POST",
      body: JSON.stringify({
        start_time: localNaiveToUtcIso(req.startTimeLocalNaive, req.tenantTimezone),
        duration_minutes: req.durationMinutes,
        service_id: req.serviceId,
        package_id: req.packageId,
        option_ids: req.optionIds,
        coupon_code: req.couponCode,
      }),
    });
    return toQuote(res);
  },

  async createBooking(payload: CreateBookingPayload) {
    const { schedule } = payload;
    if (!schedule.startTime) {
      throw new ApiError("Selected time slot is missing a start time.");
    }
    // Backend slot model supports one package per slot; the UI allows
    // checking multiple packages as additive add-ons (see CLAUDE.md's
    // pricing model), which has no single-slot backend equivalent — the
    // first checked package is sent as the slot's package_id, matching the
    // common case of at most one package checked. Every checked option
    // (already flattened by the caller into optionIds) rides along regardless
    // of which package it came from.
    const firstPackageId = payload.pkg.selectedPackages[0]?.id;
    // Passing the logged-in customer's token (when present) lets the backend
    // link this booking to their CustomerProfile (app/routes/booking.py's
    // create_guest_booking sets customer_id from get_optional_current_user) —
    // without it the booking is unlinked and never shows up under "My
    // Bookings" even for a signed-in customer.
    const res = await request<BackendBookingResponse>(
      `/public/bookings/${payload.tenantSlug}`,
      {
        method: "POST",
        body: JSON.stringify({
          guest_name: payload.customer.name,
          guest_phone: payload.customer.phone,
          tenant_id: 0, // overwritten server-side from the tenant_slug path param
          pax: 1,
          coupon_code: payload.couponCode || undefined,
          remarks: payload.customer.notes || undefined,
          slots: [
            {
              start_time: localNaiveToUtcIso(schedule.startTime, payload.tenantTimezone),
              duration_minutes: payload.pkg.duration,
              service_id: payload.serviceId,
              package_id: firstPackageId ? Number(firstPackageId) : undefined,
              option_ids: payload.optionIds,
              staff_id: schedule.staffId ? Number(schedule.staffId) : undefined,
            },
          ],
        }),
      },
      "optional",
    );
    return {
      id: res.id,
      bookingRef: res.booking_number,
      status: res.status,
      merchant: payload.merchant,
      pkg: payload.pkg,
      schedule: payload.schedule,
      customer: payload.customer,
      paymentMethod: payload.paymentMethod,
      total: Number(res.total_amount),
      discountAmount: Number(res.discount_amount),
      couponCode: payload.couponCode,
    } satisfies BookingConfirmation;
  },

  uploadPaymentReceipt(tenantSlug, bookingId, file) {
    const formData = new FormData();
    formData.append("file", file);
    return requestForm<{ url: string }>(`/public/upload/${tenantSlug}/payment-receipt/${bookingId}`, formData);
  },

  async getMe() {
    const user = await request<BackendUser>("/auth/me", undefined, "required");
    return toAuthUser(user);
  },

  async updateProfile(update: ProfileUpdate) {
    const user = await request<BackendUser>(
      "/customers/me",
      { method: "PATCH", body: JSON.stringify(update) },
      "required",
    );
    return toAuthUser(user);
  },

  async getMyBookings() {
    const bookings = await request<BackendBookingResponse[]>("/customers/me/bookings", undefined, "required");
    return bookings.map(toBookingSummary);
  },

  async getBookingReceipt(tenantSlug: string, bookingRef: string) {
    try {
      const [booking, merchant] = await Promise.all([
        request<BackendPublicBooking>(`/public/bookings/${tenantSlug}/booking/${bookingRef}`),
        request<BackendTenant>(`/public/tenants/${tenantSlug}`),
      ]);
      return toBookingReceipt(booking, tenantToMerchant(merchant));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined;
      throw err;
    }
  },

  async getFavorites() {
    const favorites = await request<BackendFavoriteTenant[]>("/customers/me/favorites", undefined, "required");
    return favorites.map(toFavoriteMerchant);
  },

  async addFavorite(tenantSlug: string) {
    const favorite = await request<BackendFavoriteTenant>(
      `/customers/me/favorites/${tenantSlug}`,
      { method: "POST" },
      "required",
    );
    return toFavoriteMerchant(favorite);
  },

  async removeFavorite(tenantSlug: string) {
    await request<{ message: string }>(`/customers/me/favorites/${tenantSlug}`, { method: "DELETE" }, "required");
  },
};
