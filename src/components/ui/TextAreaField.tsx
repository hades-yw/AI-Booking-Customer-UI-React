import type { ReactNode, TextareaHTMLAttributes } from "react";

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  icon: ReactNode;
}

export function TextAreaField({ icon, className = "", ...rest }: TextAreaFieldProps) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-3 text-ink-400">{icon}</div>
      <textarea
        className={[
          "w-full resize-none rounded-xl border-[1.5px] border-ink-200 bg-ink-50 py-[11px] pl-9 pr-3.5",
          "font-sans text-[13px] text-ink-700 outline-none focus:border-brand-500",
          className,
        ].join(" ")}
        {...rest}
      />
    </div>
  );
}
