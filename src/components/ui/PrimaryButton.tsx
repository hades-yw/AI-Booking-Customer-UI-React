import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
}

export function PrimaryButton({
  children,
  fullWidth = false,
  disabled,
  className = "",
  ...rest
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        "flex items-center justify-center gap-2 rounded-2xl border-0 py-3.5 text-sm font-bold transition-all",
        fullWidth ? "w-full" : "",
        disabled
          ? "cursor-not-allowed bg-ink-200 text-ink-400"
          : "cursor-pointer bg-brand-600 text-white shadow-[0_4px_14px_rgba(79,70,229,0.35)] hover:bg-brand-700",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
