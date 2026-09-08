import type { InputHTMLAttributes, ReactNode } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode;
}

export function TextField({ icon, className = "", ...rest }: TextFieldProps) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">{icon}</div>
      <input
        className={[
          "w-full rounded-xl border-[1.5px] border-ink-200 bg-ink-50 py-[11px] pl-9 pr-3.5",
          "text-[13px] text-ink-700 outline-none focus:border-brand-500",
          className,
        ].join(" ")}
        {...rest}
      />
    </div>
  );
}
