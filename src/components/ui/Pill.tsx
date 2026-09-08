import type { ButtonHTMLAttributes } from "react";

interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Pill({ active = false, className = "", children, ...rest }: PillProps) {
  return (
    <button
      type="button"
      className={[
        "whitespace-nowrap rounded-full px-4 py-[7px] text-[13px] font-semibold cursor-pointer transition-all",
        active
          ? "bg-brand-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]"
          : "border-[1.5px] border-ink-200 bg-white text-ink-500",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
