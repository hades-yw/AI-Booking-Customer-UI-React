import { CheckCircle, Shield, Upload, Zap } from "lucide-react";
import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { ApiError } from "../api/client";
import { BottomActionBar } from "../components/layout/BottomActionBar";
import { Footer } from "../components/layout/Footer";
import { PageContainer } from "../components/layout/PageContainer";
import { TopNav } from "../components/layout/TopNav";
import { ErrorState } from "../components/ui/AsyncState";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { Row } from "../components/ui/Row";
import { StepProgress } from "../components/ui/StepProgress";
import { useBookingFlow } from "../context/BookingFlowContext";
import { PaymentMethodPicker } from "../features/booking/PaymentMethodPicker";
import { formatDate } from "../lib/date";
import { formatCurrency } from "../lib/style";
import type { BookingConfirmation, Quote } from "../types";

const STEPS = ["Package", "Schedule", "Details", "Checkout"];
const SERVICE_FEE = 2;

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

export function CheckoutPage() {
  const navigate = useNavigate();
  const { merchant, pkg, schedule, customer, paymentMethod, setPaymentMethod, couponCode, quote, clearSavedDraft, reset } =
    useBookingFlow();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!merchant || !pkg || !schedule || !customer) return <Navigate to="/" replace />;

  // ConfirmationPage fetches a real server quote (via getQuote) as soon as a
  // startTime is available, since service/package/option prices can be
  // "per_hour" on the backend (scaled by duration) — pkg.total is only a
  // flat additive estimate that can undercount those. Trust the quote's
  // total_amount here rather than recomputing from pkg.total + SERVICE_FEE.
  const discountAmount = quote?.discountAmount ?? 0;
  const total = quote ? quote.totalAmount : pkg.total + SERVICE_FEE;
  // Both "By Date" and "By Staff" modes populate schedule.startTime (see
  // BookingPage.tsx's handleProceed) — this is just a defensive guard in
  // case a schedule was somehow set without one.
  const canSubmit = Boolean(schedule.startTime);

  const handleConfirmAndPay = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await api.createBooking({
          tenantSlug: merchant.id,
          tenantTimezone: merchant.timezone ?? "Asia/Kuala_Lumpur",
          merchant,
          pkg,
          schedule,
          customer,
          paymentMethod,
          serviceId: Number(pkg.id),
          packageId: pkg.selectedPackages[0] ? Number(pkg.selectedPackages[0].id) : undefined,
          optionIds: pkg.selectedOptions.map((o) => Number(o.id)),
          couponCode: couponCode ?? undefined,
      });
      setConfirmation(result);
      clearSavedDraft();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not place your booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToHome = () => {
    reset();
    navigate("/");
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile || !confirmation) return;
    setUploadingReceipt(true);
    setReceiptError(null);
    try {
      await api.uploadPaymentReceipt(merchant.id, confirmation.id, receiptFile);
      setReceiptUploaded(true);
    } catch (err) {
      setReceiptError(err instanceof ApiError ? err.message : "Could not upload receipt. Please try again.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  if (confirmation) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle size={42} className="text-emerald-500" />
          </div>
          <p className="mb-1.5 text-2xl font-black text-ink-900">Booking Placed!</p>
          <p className="mb-6 text-[13px] leading-relaxed text-ink-500">
            Scan the QR code below to pay, then upload your receipt.
            <br />
            {merchant.name} will confirm your booking once payment is verified.
          </p>
          <div className="mb-5 w-full max-w-[340px] rounded-[20px] border border-ink-100 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.07)]">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">Booking Reference</p>
            <p className="mb-3.5 text-2xl font-black tracking-[3px] text-brand-600">{confirmation.bookingRef}</p>
            <div className="flex flex-col gap-2.5 border-t border-ink-100 pt-3.5">
              <Row label="Merchant" value={confirmation.merchant.name} />
              <Row label="Service" value={confirmation.pkg.name} />
              <Row label="Date" value={formatDate(confirmation.schedule.date)} />
              <Row label="Time" value={confirmation.schedule.slot} />
              {confirmation.schedule.staffName && <Row label="Staff" value={confirmation.schedule.staffName} />}
              {confirmation.discountAmount > 0 && (
                <Row label="Discount" value={`-${formatCurrency(confirmation.discountAmount)}`} accent />
              )}
              <Row label="Amount Due" value={formatCurrency(confirmation.total)} bold />
            </div>
          </div>

          {merchant.qrCodeImage ? (
            <div className="mb-5 w-full max-w-[340px] rounded-[20px] border border-ink-100 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.07)]">
              <p className="mb-3 text-[13px] font-bold text-ink-900">Scan to Pay</p>
              <img
                src={merchant.qrCodeImage}
                alt={`${merchant.name} payment QR code`}
                className="mx-auto mb-4 h-48 w-48 rounded-xl border border-ink-100 object-contain"
              />

              {receiptUploaded ? (
                <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2.5 text-emerald-700">
                  <CheckCircle size={14} />
                  <span className="text-[13px] font-bold">Receipt uploaded</span>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-2.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-ink-200 bg-ink-50 py-3 text-[13px] font-semibold text-ink-600"
                  >
                    <Upload size={14} />
                    {receiptFile ? receiptFile.name : "Choose payment receipt"}
                  </button>
                  {receiptError && <p className="mb-2 text-xs font-medium text-red-500">{receiptError}</p>}
                  <PrimaryButton fullWidth disabled={!receiptFile || uploadingReceipt} onClick={handleUploadReceipt}>
                    {uploadingReceipt ? "Uploading…" : "Upload Receipt"}
                  </PrimaryButton>
                </>
              )}
            </div>
          ) : (
            <p className="mb-5 text-xs text-ink-400">
              This merchant hasn't set up a payment QR code yet — they'll be in touch about payment.
            </p>
          )}

          <div className="mb-5 flex items-center gap-1.5 text-ink-400">
            <Shield size={12} />
            <span className="text-[11px]">Protected by BookLocal guarantee</span>
          </div>
          <button
            type="button"
            onClick={handleBackToHome}
            className="cursor-pointer border-0 bg-transparent text-sm font-bold text-brand-600"
          >
            Back to Home
          </button>
        </div>
        <Footer />
      </PageContainer>
    );
  }

  return (
    <PageContainer withBottomBarSpacing>
      <TopNav title="Checkout" onBack={() => navigate(-1)} />

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 md:px-8 lg:px-8 lg:pt-6">
        <StepProgress steps={STEPS} activeIndex={3} />

        <div className="mt-3.5 lg:flex lg:items-start lg:gap-8">
          <div className="flex min-w-0 flex-1 flex-col gap-3.5">
            <div className="rounded-[18px] border border-ink-100 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <p className="mb-2.5 text-[13px] font-bold text-ink-900">Booking For</p>
              <div className="flex flex-col gap-2">
                <Row label="Name" value={customer.name} />
                <Row label="Phone" value={customer.phone} />
                {customer.notes && <Row label="Notes" value={customer.notes} />}
              </div>
            </div>

            <div className="rounded-[18px] border border-ink-100 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <p className="mb-3 text-[13px] font-bold text-ink-900">Payment Method</p>
              <PaymentMethodPicker selected={paymentMethod} onSelect={setPaymentMethod} />
              <p className="mt-2.5 text-xs leading-relaxed text-ink-400">
                You'll pay by scanning {merchant.name}'s QR code and uploading your receipt after placing the
                booking.
              </p>
            </div>

            <div className="overflow-hidden rounded-[18px] border border-ink-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] lg:hidden">
              <p className="m-0 border-b border-ink-100 px-4 py-3 text-[13px] font-bold text-ink-900">Order Summary</p>
              <div className="flex flex-col gap-2.5 px-4 py-3.5">
                {quote && quote.lines.length > 0 ? (
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
                ) : (
                  <>
                    <Row label={pkg.name} value={formatCurrency(pkg.price, { estimate: true })} />
                    {pkg.selectedPackages.map((selPkg) => (
                      <Row key={selPkg.id} label={`+ ${selPkg.name}`} value={formatCurrency(selPkg.price)} />
                    ))}
                    {pkg.selectedOptions.map((opt) => (
                      <Row key={opt.id} label={`+ ${opt.name}`} value={formatCurrency(opt.price)} />
                    ))}
                  </>
                )}
                {couponCode && discountAmount > 0 && (
                  <Row label={`Coupon (${couponCode})`} value={`-${formatCurrency(discountAmount)}`} accent />
                )}
                <Row label="Service fee" value={formatCurrency(quote?.processingFee ?? SERVICE_FEE)} />
                <div className="border-t border-ink-100 pt-2.5">
                  <Row label="Total" value={formatCurrency(total, { estimate: !quote })} bold />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 px-3.5 py-3">
              <Shield size={18} className="shrink-0 text-emerald-500" />
              <p className="m-0 text-xs leading-relaxed text-emerald-700">
                Free cancellation up to 24 hours before your appointment.
              </p>
            </div>

            {!canSubmit && (
              <p className="rounded-2xl bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-700">
                This time slot can't be booked online yet — go back and pick a date and time on the Schedule step.
              </p>
            )}

            {submitError && <ErrorState message={submitError} onRetry={handleConfirmAndPay} />}
          </div>

          <aside className="hidden shrink-0 lg:sticky lg:top-6 lg:block lg:w-80">
            <div className="overflow-hidden rounded-[18px] border border-ink-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <p className="m-0 border-b border-ink-100 px-4 py-3 text-[13px] font-bold text-ink-900">Order Summary</p>
              <div className="flex flex-col gap-2.5 px-4 py-3.5">
                {quote && quote.lines.length > 0 ? (
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
                ) : (
                  <>
                    <Row label={pkg.name} value={formatCurrency(pkg.price, { estimate: true })} />
                    {pkg.selectedPackages.map((selPkg) => (
                      <Row key={selPkg.id} label={`+ ${selPkg.name}`} value={formatCurrency(selPkg.price)} />
                    ))}
                    {pkg.selectedOptions.map((opt) => (
                      <Row key={opt.id} label={`+ ${opt.name}`} value={formatCurrency(opt.price)} />
                    ))}
                  </>
                )}
                {couponCode && discountAmount > 0 && (
                  <Row label={`Coupon (${couponCode})`} value={`-${formatCurrency(discountAmount)}`} accent />
                )}
                <Row label="Service fee" value={formatCurrency(quote?.processingFee ?? SERVICE_FEE)} />
                <div className="border-t border-ink-100 pt-2.5">
                  <Row label="Total" value={formatCurrency(total, { estimate: !quote })} bold />
                </div>
              </div>
            </div>
            <PrimaryButton fullWidth className="mt-4" onClick={handleConfirmAndPay} disabled={submitting || !canSubmit}>
              {submitting ? "Placing booking…" : `Confirm Booking ${formatCurrency(total, { estimate: !quote })}`}{" "}
              <Zap size={15} />
            </PrimaryButton>
          </aside>
        </div>
      </div>

      <BottomActionBar className="lg:hidden">
        <PrimaryButton fullWidth onClick={handleConfirmAndPay} disabled={submitting || !canSubmit}>
          {submitting ? "Placing booking…" : `Confirm Booking ${formatCurrency(total, { estimate: !quote })}`}{" "}
          <Zap size={15} />
        </PrimaryButton>
      </BottomActionBar>

      <Footer />
    </PageContainer>
  );
}
