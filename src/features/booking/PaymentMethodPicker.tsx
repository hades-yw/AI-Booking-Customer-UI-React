import type { LucideIcon } from "lucide-react";
import { CreditCard, Smartphone } from "lucide-react";
import type { PaymentMethod, PaymentMethodId } from "../../types";

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "card", label: "Credit / Debit Card" },
  { id: "wallet", label: "E-Wallet (Touch 'n Go / GrabPay)" },
];

const ICONS: Record<PaymentMethodId, LucideIcon> = {
  card: CreditCard,
  wallet: Smartphone,
};

interface PaymentMethodPickerProps {
  selected: PaymentMethodId;
  onSelect: (id: PaymentMethodId) => void;
}

export function PaymentMethodPicker({ selected, onSelect }: PaymentMethodPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {PAYMENT_METHODS.map(({ id, label }) => {
        const Icon = ICONS[id];
        const active = selected === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={[
              "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-all cursor-pointer",
              active ? "border-[1.5px] border-brand-500 bg-brand-50" : "border-[1.5px] border-ink-200 bg-white",
            ].join(" ")}
          >
            <div
              className={[
                "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full",
                active ? "bg-brand-200" : "bg-ink-100",
              ].join(" ")}
            >
              <Icon size={16} className={active ? "text-brand-600" : "text-ink-500"} />
            </div>
            <span className={["flex-1 text-[13px] font-semibold", active ? "text-brand-700" : "text-ink-600"].join(" ")}>
              {label}
            </span>
            <div
              className={[
                "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2",
                active ? "border-brand-600" : "border-ink-300",
              ].join(" ")}
            >
              {active && <div className="h-2 w-2 rounded-full bg-brand-600" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
