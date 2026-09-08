import { ArrowRight, FileText, Phone, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { ApiError } from "../api/client";
import { BottomActionBar } from "../components/layout/BottomActionBar";
import { Footer } from "../components/layout/Footer";
import { PageContainer } from "../components/layout/PageContainer";
import { TopNav } from "../components/layout/TopNav";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { Row } from "../components/ui/Row";
import { StepProgress } from "../components/ui/StepProgress";
import { TextAreaField } from "../components/ui/TextAreaField";
import { TextField } from "../components/ui/TextField";
import { useBookingFlow } from "../context/BookingFlowContext";
import { CouponInput } from "../features/booking/CouponInput";
import { formatDate } from "../lib/date";
import { formatCurrency } from "../lib/style";
import type { Quote } from "../types";

const STEPS = ["Package", "Schedule", "Details", "Checkout"];

function hoursLabel(minutes: number): string {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}hr` : `${hours.toFixed(2)}hr`;
}

function QuoteLineRow({ line, quote }: { line: Quote["lines"][number]; quote: Quote }) {
  const isPerHour = line.pricingBasis === "per_hour";
  const rate = isPerHour ? line.amount / (quote.billableDurationMinutes / 60) : null;
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <span className="text-xs text-ink-400">{line.type === "service" ? line.name : `+ ${line.name}`}</span>
        {rate !== null && (
          <p className="m-0 text-[10px] text-ink-400">
            {formatCurrency(rate)}/hr × {hoursLabel(quote.billableDurationMinutes)}
          </p>
        )}
      </div>
      <span className="shrink-0 text-[13px] font-medium text-ink-900">{formatCurrency(line.amount)}</span>
    </div>
  );
}

function QuoteLineItems({ pkg, quote }: { pkg: NonNullable<ReturnType<typeof useBookingFlow>["pkg"]>; quote: Quote | null }) {
  if (quote && quote.lines.length > 0) {
    return (
      <>
        {quote.lines.map((line, i) => (
          <QuoteLineRow key={`${line.type}-${i}`} line={line} quote={quote} />
        ))}
        {quote.peakAdjustment !== 0 && (
          <Row
            label="Peak pricing adjustment"
            value={`${quote.peakAdjustment > 0 ? "+" : ""}${formatCurrency(quote.peakAdjustment)}`}
          />
        )}
      </>
    );
  }
  return (
    <>
      {pkg.selectedPackages.map((selPkg) => (
        <Row key={selPkg.id} label={`+ ${selPkg.name}`} value={formatCurrency(selPkg.price)} />
      ))}
      {pkg.selectedOptions.map((opt) => (
        <Row key={opt.id} label={`+ ${opt.name}`} value={formatCurrency(opt.price)} />
      ))}
    </>
  );
}

export function ConfirmationPage() {
  const navigate = useNavigate();
  const { merchant, pkg, schedule, setCustomer, couponCode, quote, setCoupon } = useBookingFlow();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Both "By Date" and "By Staff" modes populate schedule.startTime (see
  // BookingPage.tsx's handleProceed) — this is just a defensive guard in
  // case a schedule was somehow set without one.
  const supportsQuote = Boolean(schedule?.startTime);

  // service.price/package.price/option.price can be "per_hour" on the
  // backend (app/utils/pricing.py::price_for_basis scales by
  // duration_minutes/60), which pkg.total (a flat additive sum) doesn't
  // account for — so the price actually charged by quote/createBooking can
  // differ from pkg.total. Fetch the real server quote as soon as we have a
  // start_time and treat it as the source of truth for what's displayed,
  // rather than trying to replicate the backend's pricing_basis/peak-pricing
  // logic here.
  useEffect(() => {
    if (!merchant || !pkg || !schedule?.startTime || quote) return;
    let cancelled = false;
    setQuoteLoading(true);
    setQuoteError(null);
    api
      .getQuote(merchant.id, {
        startTimeLocalNaive: schedule.startTime,
        tenantTimezone: merchant.timezone ?? "Asia/Kuala_Lumpur",
        durationMinutes: pkg.duration,
        serviceId: Number(pkg.id),
        packageId: pkg.selectedPackages[0] ? Number(pkg.selectedPackages[0].id) : undefined,
        optionIds: pkg.selectedOptions.map((o) => Number(o.id)),
      })
      .then((result) => {
        if (!cancelled) setCoupon(null, result);
      })
      .catch((err) => {
        if (!cancelled) setQuoteError(err instanceof ApiError ? err.message : "Could not load pricing.");
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant?.id, pkg?.id, schedule?.startTime]);

  if (!merchant || !pkg || !schedule) return <Navigate to="/" replace />;

  const canProceed = name.trim().length > 0 && phone.trim().length > 0;

  const handleCheckout = () => {
    if (!canProceed) return;
    setCustomer({ name, phone, notes });
    navigate(`/merchants/${merchant.id}/checkout`);
  };

  const handleApplyCoupon = async (code: string): Promise<Quote> => {
    if (!schedule.startTime) {
      throw new Error("Coupons aren't supported for this booking yet.");
    }
    const result = await api.getQuote(merchant.id, {
      startTimeLocalNaive: schedule.startTime,
      tenantTimezone: merchant.timezone ?? "Asia/Kuala_Lumpur",
      durationMinutes: pkg.duration,
      serviceId: Number(pkg.id),
      packageId: pkg.selectedPackages[0] ? Number(pkg.selectedPackages[0].id) : undefined,
      optionIds: pkg.selectedOptions.map((o) => Number(o.id)),
      couponCode: code,
    });
    setCoupon(code, result);
    return result;
  };

  const handleClearCoupon = () => setCoupon(null, null);

  const displayTotal = quote ? quote.totalAmount - quote.processingFee : pkg.total;

  return (
    <PageContainer withBottomBarSpacing>
      <TopNav title="Confirm Booking" onBack={() => navigate(-1)} />

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 md:px-8 lg:px-8 lg:pt-6">
        <StepProgress steps={STEPS} activeIndex={2} />

        <div className="mt-3.5 lg:flex lg:items-start lg:gap-8">
          <div className="min-w-0 flex-1">
            <div className="overflow-hidden rounded-[18px] border border-ink-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] lg:hidden">
              <div className="bg-linear-to-br from-brand-600 to-brand-500 px-4 py-2.5">
                <p className="m-0 text-[11px] text-white/70">Booking Summary</p>
              </div>
              <div className="flex flex-col gap-2.5 px-4 py-3.5">
                <Row label="Merchant" value={merchant.name} />
                <Row label="Service" value={pkg.name} />
                <Row label="Date" value={formatDate(schedule.date)} />
                <Row label="Time" value={schedule.slot} />
                {schedule.staffName && <Row label="Staff" value={schedule.staffName} />}
                <Row label="Duration" value={`${pkg.duration} min`} />
                <QuoteLineItems pkg={pkg} quote={quote} />
                {quote && quote.discountAmount > 0 && (
                  <Row label="Discount" value={`-${formatCurrency(quote.discountAmount)}`} accent />
                )}
                {quoteError && <p className="text-xs font-medium text-red-500">{quoteError}</p>}
                <div className="border-t border-ink-100 pt-2.5">
                  <Row
                    label="Total"
                    value={quoteLoading ? "Calculating…" : formatCurrency(displayTotal, { estimate: !quote })}
                    bold
                    accent
                  />
                </div>
                <div className="border-t border-ink-100 pt-2.5">
                  <CouponInput
                    appliedCode={couponCode}
                    onApply={handleApplyCoupon}
                    onClear={handleClearCoupon}
                    disabled={!supportsQuote}
                    disabledReason="Coupons need a date and time selection — pick a time on the Schedule step to use one."
                  />
                </div>
              </div>
            </div>

            <div className="mt-3.5 rounded-[18px] border border-ink-100 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] lg:mt-0">
              <p className="mb-3 text-[13px] font-bold text-ink-900">Your Details</p>
              <div className="mb-2.5">
                <TextField icon={<User size={14} />} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="mb-2.5">
                <TextField
                  icon={<Phone size={14} />}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  type="tel"
                />
              </div>
              <TextAreaField
                icon={<FileText size={14} />}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special requests (optional)"
                rows={2}
              />
            </div>
          </div>

          <aside className="hidden shrink-0 lg:sticky lg:top-6 lg:block lg:w-80">
            <div className="overflow-hidden rounded-[18px] border border-ink-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <div className="bg-linear-to-br from-brand-600 to-brand-500 px-4 py-2.5">
                <p className="m-0 text-[11px] text-white/70">Booking Summary</p>
              </div>
              <div className="flex flex-col gap-2.5 px-4 py-3.5">
                <Row label="Merchant" value={merchant.name} />
                <Row label="Service" value={pkg.name} />
                <Row label="Date" value={formatDate(schedule.date)} />
                <Row label="Time" value={schedule.slot} />
                {schedule.staffName && <Row label="Staff" value={schedule.staffName} />}
                <Row label="Duration" value={`${pkg.duration} min`} />
                <QuoteLineItems pkg={pkg} quote={quote} />
                {quote && quote.discountAmount > 0 && (
                  <Row label="Discount" value={`-${formatCurrency(quote.discountAmount)}`} accent />
                )}
                {quoteError && <p className="text-xs font-medium text-red-500">{quoteError}</p>}
                <div className="border-t border-ink-100 pt-2.5">
                  <Row
                    label="Total"
                    value={quoteLoading ? "Calculating…" : formatCurrency(displayTotal, { estimate: !quote })}
                    bold
                    accent
                  />
                </div>
                <div className="border-t border-ink-100 pt-2.5">
                  <CouponInput
                    appliedCode={couponCode}
                    onApply={handleApplyCoupon}
                    onClear={handleClearCoupon}
                    disabled={!supportsQuote}
                    disabledReason="Coupons need a date and time selection — pick a time on the Schedule step to use one."
                  />
                </div>
              </div>
            </div>
            <PrimaryButton fullWidth className="mt-4" disabled={!canProceed} onClick={handleCheckout}>
              Proceed to Checkout <ArrowRight size={16} />
            </PrimaryButton>
          </aside>
        </div>
      </div>

      <BottomActionBar className="lg:hidden">
        <PrimaryButton fullWidth disabled={!canProceed} onClick={handleCheckout}>
          Proceed to Checkout <ArrowRight size={16} />
        </PrimaryButton>
      </BottomActionBar>

      <Footer />
    </PageContainer>
  );
}
