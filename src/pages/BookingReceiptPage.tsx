import { AlertCircle, CheckCircle, Clock, Shield, Upload, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { ApiError } from "../api/client";
import { Footer } from "../components/layout/Footer";
import { PageContainer } from "../components/layout/PageContainer";
import { TopNav } from "../components/layout/TopNav";
import { ErrorState, LoadingState } from "../components/ui/AsyncState";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { Row } from "../components/ui/Row";
import { formatUtcDate, formatUtcTime } from "../lib/date";
import { formatCurrency } from "../lib/style";
import { useAsync } from "../lib/useAsync";

const STATUS_META: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  pending: { label: "Pending Payment", icon: Clock, className: "bg-amber-100 text-amber-600" },
  approved: { label: "Confirmed", icon: CheckCircle, className: "bg-emerald-100 text-emerald-500" },
  rejected: { label: "Cancelled", icon: XCircle, className: "bg-red-100 text-red-500" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "bg-red-100 text-red-500" },
  no_show: { label: "No Show", icon: AlertCircle, className: "bg-ink-100 text-ink-500" },
};

// Shown when a customer opens a past booking from their profile's Bookings
// tab. Distinct from CheckoutPage's inline success screen — that one only
// has data because it just ran through the booking flow (BookingFlowContext
// still holds the merchant/package/schedule/customer); here we're re-hydrating
// a historical booking from scratch, so it fetches the public
// booking-by-number endpoint plus the merchant instead of reading any flow
// state. See BookingReceipt in src/types/index.ts.
export function BookingReceiptPage() {
  const navigate = useNavigate();
  const { merchantId, bookingRef } = useParams<{ merchantId: string; bookingRef: string }>();

  const { data: receipt, loading, error } = useAsync(
    () => (merchantId && bookingRef ? api.getBookingReceipt(merchantId, bookingRef) : Promise.resolve(undefined)),
    [merchantId, bookingRef],
  );

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadReceipt = async () => {
    if (!receiptFile || !receipt || !merchantId) return;
    setUploadingReceipt(true);
    setReceiptError(null);
    try {
      await api.uploadPaymentReceipt(merchantId, receipt.id, receiptFile);
      setReceiptUploaded(true);
    } catch (err) {
      setReceiptError(err instanceof ApiError ? err.message : "Could not upload receipt. Please try again.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const statusMeta = receipt ? STATUS_META[receipt.status] : undefined;
  const StatusIcon = statusMeta?.icon ?? CheckCircle;
  const isPending = receipt?.status === "pending";
  const isCancelled = receipt?.status === "cancelled" || receipt?.status === "rejected";
  const receiptOnFile = receiptUploaded || Boolean(receipt?.paymentProofUploaded);

  return (
    <PageContainer>
      <TopNav title="Booking Details" onBack={() => navigate(-1)} />

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10">
        {loading && (
          <div className="flex flex-1 items-center justify-center">
            <LoadingState label="Loading your booking…" />
          </div>
        )}
        {!loading && (error || !receipt) && (
          <div className="flex flex-1 items-center justify-center">
            <ErrorState message="We couldn't find that booking." />
          </div>
        )}

        {!loading && receipt && (
          <>
          <div className="mx-auto mb-6 flex w-full max-w-md items-center justify-center gap-4 text-left">
            <div
              className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full ${statusMeta?.className ?? "bg-emerald-100 text-emerald-500"}`}
            >
              <StatusIcon size={42} />
            </div>
            <div>
              <p className="mb-1.5 text-2xl font-black text-ink-900 lg:text-3xl">
                {statusMeta?.label ?? "Booking Placed!"}
              </p>
              <p className="text-[13px] leading-relaxed text-ink-500 lg:text-sm">{receipt.merchant.name}</p>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">

            {isPending && (
              <div className="mb-5 w-full rounded-[20px] border border-ink-100 bg-white p-5 text-left shadow-[0_4px_16px_rgba(0,0,0,0.07)] lg:p-6">
                {receipt.merchant.qrCodeImage ? (
                  <>
                    <p className="mb-3 text-[13px] font-bold text-ink-900">Scan to Pay</p>
                    <img
                      src={receipt.merchant.qrCodeImage}
                      alt={`${receipt.merchant.name} payment QR code`}
                      className="mx-auto mb-4 h-48 w-48 rounded-xl border border-ink-100 object-contain"
                    />
                  </>
                ) : (
                  <p className="mb-4 text-xs text-ink-400">
                    This merchant hasn't set up a payment QR code yet — they'll be in touch about payment. You can
                    still upload your receipt below once you've paid.
                  </p>
                )}

                {receiptOnFile ? (
                  <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2.5 text-emerald-700">
                    <CheckCircle size={14} />
                    <span className="text-[13px] font-bold">Receipt uploaded — awaiting confirmation</span>
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
            )}

            <div className="w-full rounded-[20px] border border-ink-100 bg-white p-6 text-left shadow-[0_4px_16px_rgba(0,0,0,0.07)]">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">Booking Reference</p>
              <p className="mb-3.5 text-2xl font-black tracking-[3px] text-brand-600">{receipt.bookingRef}</p>
              <div className="flex flex-col gap-2.5 border-t border-ink-100 pt-3.5">
                <Row label="Status" value={statusMeta?.label ?? receipt.status} />
                {receipt.items.map((item, i) => (
                  <div key={i} className="flex flex-col gap-2.5">
                    {item.serviceName && <Row label="Service" value={item.serviceName} />}
                    {item.packageName && <Row label="Package" value={item.packageName} />}
                    {item.staffName && <Row label="Staff" value={item.staffName} />}
                    {item.optionNames.length > 0 && <Row label="Add-ons" value={item.optionNames.join(", ")} />}
                  </div>
                ))}
                <Row label="Date" value={formatUtcDate(receipt.startTime)} />
                <Row
                  label="Time"
                  value={`${formatUtcTime(receipt.startTime)} – ${formatUtcTime(receipt.endTime)}`}
                />
                {receipt.discountAmount > 0 && (
                  <Row label="Discount" value={`-${formatCurrency(receipt.discountAmount)}`} accent />
                )}
                <Row label="Amount" value={formatCurrency(receipt.totalAmount)} bold />
              </div>
            </div>

            {isCancelled && (
              <div className="mt-5 w-full rounded-[20px] border border-red-100 bg-red-50 p-5 text-left">
                <p className="mb-1.5 text-[13px] font-bold text-red-700">Cancelled by {receipt.merchant.name}</p>
                <p className="m-0 text-[13px] leading-relaxed text-red-600">
                  {receipt.cancellationReason || "No reason was provided."}
                </p>
              </div>
            )}

            <div className="mb-5 mt-5 flex items-center gap-1.5 text-ink-400">
              <Shield size={12} />
              <span className="text-[11px]">Protected by Rservo guarantee</span>
            </div>
            <Link
              to="/profile?tab=bookings"
              className="cursor-pointer border-0 bg-transparent text-sm font-bold text-brand-600"
            >
              Back to My Bookings
            </Link>
          </div>
          </>
        )}
      </div>

      <Footer />
    </PageContainer>
  );
}
