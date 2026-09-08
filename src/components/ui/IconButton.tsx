import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "solid" | "translucent" | "outline";
}

const VARIANT_CLASSES: Record<NonNullable<IconButtonProps["variant"]>, string> = {
  solid: "bg-white border border-ink-200",
  translucent: "bg-white/85 border-0 backdrop-blur",
  outline: "bg-white border-[1.5px] border-ink-200",
};

export function IconButton({ children, variant = "solid", className = "", ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className={[
        "flex h-9 w-9 items-center justify-center rounded-full cursor-pointer transition-colors",
        VARIANT_CLASSES[variant],
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
