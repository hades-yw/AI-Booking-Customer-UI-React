// ─── DOMAIN TYPES ───────────────────────────────────────────────────────────
// Shared shapes used across the API layer, pages, and components. Keeping
// these independent of any single API response shape makes it easy to map
// a real backend payload onto the same types the UI already consumes.

export type GradientPair = [start: string, end: string];

export interface GalleryImage {
  gradient: GradientPair;
  label: string;
  imageUrl?: string;
}

export interface DayHours {
  open: string; // "HH:mm"
  close: string; // "HH:mm"
}

export type BusinessHours = Partial<Record<
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
  DayHours | null
>>;

export interface ServiceOption {
  id: string;
  name: string;
  desc: string;
  price: number; // additive on top of service price + package price
  // "per_hour" scales `price` by duration/60 server-side (app/utils/pricing.py::price_for_basis on
  // the backend) — the flat additive sum shown client-side doesn't account for that. Undefined
  // (e.g. mock data) is treated as "flat".
  pricingBasis?: "flat" | "per_hour";
}

export interface ServicePackageTier {
  id: string;
  name: string;
  duration: number; // minutes
  price: number; // additive on top of the parent service's price
  desc: string;
  options: ServiceOption[];
  pricingBasis?: "flat" | "per_hour";
}

export interface Service {
  id: string;
  name: string;
  desc: string;
  // The service's own base price — the only mandatory price, and the actual minimum a customer
  // can pay for it (packages/options are opt-in checkboxes, never bundled in by default), so this
  // is also what's shown as "From RMx" on the collapsed card — there is no separate "priceFrom".
  price: number;
  duration: number; // minutes; used when booking the service directly with no package chosen
  packages: ServicePackageTier[]; // optional drill-down; can be empty
  pricingBasis?: "flat" | "per_hour";
}

// The bookable unit carried through the booking flow: a service, plus
// whichever packages the customer checked (zero or more — packages are
// additive checkboxes, not a single required tier) and whichever options
// the customer checked from those packages. `price` is the service's own
// base price alone; `total` adds every selected package's price and every
// selected option's price on top of that.
export interface ServicePackage {
  id: string;
  name: string;
  duration: number; // minutes
  price: number;
  desc: string;
  selectedPackages: ServicePackageTier[];
  selectedOptions: ServiceOption[];
  total: number;
}

export interface Merchant {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  location: string;
  distance: string;
  priceFrom: number;
  tag: string;
  tagColor: string;
  tagText: string;
  gradient: GradientPair;
  description: string;
  features: string[];
  gallery: GalleryImage[];
  services: Service[];
  // Tenant profile fields (from the tenants table)
  email?: string;
  phone?: string;
  address?: string;
  businessHours?: BusinessHours;
  faqs?: string; // sanitized HTML
  termsAndConditions?: string; // sanitized HTML
  portfolioUrl?: string;
  timezone?: string;
  currency?: string;
  bannerUrl?: string;
  logoUrl?: string;
  qrCodeImage?: string;
}

export interface DayAvailability {
  date: string; // ISO date string (yyyy-mm-dd)
  slots: TimeSlot[];
}

export interface Staff {
  id: string;
  name: string;
  role: string;
}

// One generated time slot. `startTime`/`endTime` are tenant-local naive ISO
// strings as returned by the backend (no UTC offset) — never run through
// `new Date(iso)` for display, since that silently applies the browser's own
// timezone on top. They're carried through to `SelectedSchedule` so
// `getQuote`/`createBooking` can convert them to UTC and submit.
export interface TimeSlot {
  label: string; // display string, e.g. "9:00 AM"
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface StaffDayAvailability {
  date: string; // ISO date string (yyyy-mm-dd)
  staffId: string;
  staffName: string;
  slots: TimeSlot[];
}

export interface SelectedSchedule {
  date: string; // ISO date string (yyyy-mm-dd)
  slot: string;
  staffId?: string;
  staffName?: string;
  startTime?: string;
  endTime?: string;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  notes: string;
}

export type PaymentMethodId = "card" | "wallet";

export interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
}

// ─── COUPONS & QUOTES ───────────────────────────────────────────────────────
// There is no public coupon-lookup endpoint on the backend — a coupon code is
// validated (and its discount computed) only by calling the public quote
// endpoint (POST /v1/public/bookings/{tenant_slug}/quote), which recomputes
// pricing server-side including any coupon. The same recomputation happens
// again, authoritatively, when the booking is actually created — the Quote
// here is a preview only, never trusted as the final charged amount.

export interface QuoteLine {
  type: "service" | "package" | "option";
  name: string;
  amount: number;
  pricingBasis: "per_hour" | "flat";
}

export interface Quote {
  currency: string;
  billableDurationMinutes: number;
  bonusDurationMinutes: number;
  lines: QuoteLine[];
  subtotal: number;
  peakAdjustment: number;
  discountAmount: number;
  processingFee: number;
  totalAmount: number;
  couponCode?: string;
}

export interface BookingConfirmation {
  id: number;
  bookingRef: string;
  status: string;
  merchant: Merchant;
  pkg: ServicePackage;
  schedule: SelectedSchedule;
  customer: CustomerDetails;
  paymentMethod: PaymentMethodId;
  total: number;
  discountAmount: number;
  couponCode?: string;
}

export interface CreateBookingPayload {
  tenantSlug: string;
  tenantTimezone: string;
  merchant: Merchant;
  pkg: ServicePackage;
  schedule: SelectedSchedule;
  customer: CustomerDetails;
  paymentMethod: PaymentMethodId;
  serviceId: number;
  packageId?: number;
  optionIds: number[];
  couponCode?: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface ProfileUpdate {
  name?: string;
  email?: string;
}

// A favorited merchant, as listed on the profile dashboard. `favoritedAt` is
// the favorite record's own created_at (not the merchant's) — used to sort
// the "Saved Merchants" list most-recently-favorited first.
export interface FavoriteMerchant {
  merchant: Merchant;
  favoritedAt: string;
}

// A condensed booking record for the profile dashboard's booking history —
// deliberately not the full BookingConfirmation shape. `tenantSlug` links
// each row to its receipt page at /merchants/:tenantSlug/booking/:bookingRef
// (GET /customers/me/bookings now eager-loads Booking.tenant for this).
export interface BookingSummary {
  id: number;
  bookingRef: string;
  status: string;
  startTime: string; // UTC ISO datetime
  totalAmount: number;
  currency: string;
  tenantSlug?: string;
  merchantName?: string;
  // Set by the merchant when changing status (rejection/approval/cancellation
  // note) — Booking.status_remarks on the backend. Shown truncated to one
  // line in the list; full text is on the receipt page.
  statusRemarks?: string;
}

// One line item within a past booking, as itemized on its receipt page —
// mirrors the backend's BookingSlotRead snapshot fields (service/package
// names as booked, not looked up live, since pricing/names can change
// after the fact).
export interface BookingReceiptItem {
  serviceName?: string;
  packageName?: string;
  staffName?: string;
  optionNames: string[];
}

// A past booking fetched by tenant slug + booking number for the
// "view receipt" page linked from the profile Bookings tab — built from the
// public GET /public/bookings/{tenantSlug}/booking/{bookingNumber} endpoint
// plus a merchant lookup, not the in-flow BookingConfirmation shape (which
// needs customer/package/schedule state that only exists mid-checkout).
export interface BookingReceipt {
  id: number;
  bookingRef: string;
  status: string;
  merchant: Merchant;
  startTime: string; // UTC ISO datetime
  endTime: string; // UTC ISO datetime
  items: BookingReceiptItem[];
  totalAmount: number;
  discountAmount: number;
  currency: string;
  // Set by the merchant when they cancel/reject a booking (Booking.status_remarks
  // on the backend) — only meaningful when status is "cancelled" or "rejected".
  cancellationReason?: string;
  // Whether a payment receipt has already been uploaded for this booking, so a
  // still-pending booking doesn't re-prompt for upload once one is on file.
  paymentProofUploaded: boolean;
}
