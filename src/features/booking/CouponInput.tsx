import { Tag, X } from "lucide-react";
import { useState } from "react";
import { ApiError } from "../../api/client";
import type { Quote } from "../../types";

interface CouponInputProps {
  appliedCode: string | null;
  onApply: (code: string) => Promise<Quote>;
  onClear: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

// Coupon input for the booking summary card. There is no public
// coupon-lookup endpoint on the backend — "applying" a coupon means calling
// the public quote endpoint with the code and letting the server validate it
// (invalid/expired/usage-limit/minimum-not-met all come back as a 400 with a
// human-readable `detail`, which we surface directly).
export function CouponInput({ appliedCode, onApply, onClear, disabled, disabledReason }: CouponInputProps) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (disabled) {
    return <p className="text-xs text-ink-400">{disabledReason ?? "Coupons aren't available for this booking."}</p>;
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-emerald-700">
          <Tag size={13} />
          <span className="text-[13px] font-bold">{appliedCode}</span>
          <span className="text-xs">applied</span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-emerald-600 hover:bg-emerald-100"
          aria-label="Remove coupon"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      await onApply(trimmed);
      setCode("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not apply coupon.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
            <Tag size={14} />
          </div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleApply();
              }
            }}
            placeholder="Coupon code"
            className="w-full rounded-xl border-[1.5px] border-ink-200 bg-ink-50 py-2.5 pl-9 pr-3 text-[13px] text-ink-700 outline-none focus:border-brand-500"
          />
        </div>
        <button
          type="button"
          onClick={() => void handleApply()}
          disabled={submitting || !code.trim()}
          className={[
            "shrink-0 rounded-xl px-3.5 py-2.5 text-[13px] font-bold transition-colors",
            submitting || !code.trim()
              ? "cursor-not-allowed bg-ink-100 text-ink-400"
              : "cursor-pointer bg-brand-50 text-brand-600 hover:bg-brand-100",
          ].join(" ")}
        >
          {submitting ? "Applying…" : "Apply"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
