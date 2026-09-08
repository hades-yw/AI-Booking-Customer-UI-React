import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
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
  reset: () => void;
}

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

export function BookingFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingFlowState>(initialState);

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

  const reset = useCallback(() => setState(initialState), []);

  const value = useMemo(
    () => ({ ...state, startBooking, setSchedule, setCustomer, setPaymentMethod, setCoupon, reset }),
    [state, startBooking, setSchedule, setCustomer, setPaymentMethod, setCoupon, reset],
  );

  return <BookingFlowContext.Provider value={value}>{children}</BookingFlowContext.Provider>;
}

export function useBookingFlow(): BookingFlowContextValue {
  const ctx = useContext(BookingFlowContext);
  if (!ctx) throw new Error("useBookingFlow must be used within a BookingFlowProvider");
  return ctx;
}
