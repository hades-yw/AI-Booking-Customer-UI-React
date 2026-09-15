import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CustomerDetails, Merchant, PaymentMethodId, Quote, SelectedSchedule, ServicePackage } from "../types";

// ─── BOOKING FLOW STATE ──────────────────────────────────────────────────────
// Carries the in-progress booking (chosen package, schedule, customer info)
// across the /merchants/:id/book -> /confirm -> /checkout routes. Each of
// those pages also validates its own prerequisites via route guards
// (see routes.tsx) so a direct link to e.g. /checkout without a package
// selected redirects back rather than crashing.

interface BookingFlowState {
  merchant: Merchant | null;
  pkg: ServicePackage | null;
  schedule: SelectedSchedule | null;
  customer: CustomerDetails | null;
  paymentMethod: PaymentMethodId;
  couponCode: string | null;
  quote: Quote | null;
}

interface BookingFlowContextValue extends BookingFlowState {
  startBooking: (merchant: Merchant, pkg: ServicePackage) => void;
  setSchedule: (schedule: SelectedSchedule) => void;
  setCustomer: (customer: CustomerDetails) => void;
  setPaymentMethod: (method: PaymentMethodId) => void;
  setCoupon: (couponCode: string | null, quote: Quote | null) => void;
  clearSavedDraft: () => void;
  reset: () => void;
}

const DRAFT_STORAGE_KEY = "rservo_booking_draft";
const DRAFT_TTL_MS = 30 * 60 * 1000;

const initialState: BookingFlowState = {
  merchant: null,
  pkg: null,
  schedule: null,
  customer: null,
  paymentMethod: "card",
  couponCode: null,
  quote: null,
};

const BookingFlowContext = createContext<BookingFlowContextValue | undefined>(undefined);

function restoreDraft(): BookingFlowState {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return initialState;
    const saved = JSON.parse(raw) as { savedAt: number; state: BookingFlowState };
    if (!saved.savedAt || Date.now() - saved.savedAt > DRAFT_TTL_MS || !saved.state?.merchant) {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      return initialState;
    }
    // Quotes can become stale while the customer is authenticating. The
    // confirmation page fetches a fresh authoritative quote after restore.
    return { ...saved.state, quote: null, couponCode: null };
  } catch {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    return initialState;
  }
}

export function BookingFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingFlowState>(restoreDraft);

  useEffect(() => {
    if (!state.merchant) {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), state }));
  }, [state]);

  const startBooking = useCallback((merchant: Merchant, pkg: ServicePackage) => {
    setState((prev) => ({ ...prev, merchant, pkg, schedule: null, customer: null, couponCode: null, quote: null }));
  }, []);

  const setSchedule = useCallback((schedule: SelectedSchedule) => {
    // A quote is priced against a specific start_time/duration — invalidate
    // any previously-applied coupon/quote when the schedule changes under it.
    setState((prev) => ({ ...prev, schedule, couponCode: null, quote: null }));
  }, []);

  const setCustomer = useCallback((customer: CustomerDetails) => {
    setState((prev) => ({ ...prev, customer }));
  }, []);

  const setPaymentMethod = useCallback((paymentMethod: PaymentMethodId) => {
    setState((prev) => ({ ...prev, paymentMethod }));
  }, []);

  const setCoupon = useCallback((couponCode: string | null, quote: Quote | null) => {
    setState((prev) => ({ ...prev, couponCode, quote }));
  }, []);

  const clearSavedDraft = useCallback(() => sessionStorage.removeItem(DRAFT_STORAGE_KEY), []);

  const reset = useCallback(() => {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    setState(initialState);
  }, []);

  const value = useMemo(
    () => ({ ...state, startBooking, setSchedule, setCustomer, setPaymentMethod, setCoupon, clearSavedDraft, reset }),
    [state, startBooking, setSchedule, setCustomer, setPaymentMethod, setCoupon, clearSavedDraft, reset],
  );

  return <BookingFlowContext.Provider value={value}>{children}</BookingFlowContext.Provider>;
}

export function useBookingFlow(): BookingFlowContextValue {
  const ctx = useContext(BookingFlowContext);
  if (!ctx) throw new Error("useBookingFlow must be used within a BookingFlowProvider");
  return ctx;
}
