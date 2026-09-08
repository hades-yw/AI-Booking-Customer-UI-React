import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = "", ...rest }: CardProps) {
  return (
    <div
      className={[
        "rounded-[18px] border border-ink-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
