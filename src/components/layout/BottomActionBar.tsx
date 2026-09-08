import type { ReactNode } from "react";

interface BottomActionBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Fixed action bar pinned to the viewport bottom on mobile. On wider
 * screens it stays pinned but its content is centered/width-capped to
 * match the page column instead of spanning the full browser width.
 */
export function BottomActionBar({ children, className = "" }: BottomActionBarProps) {
  return (
    <div className={["fixed inset-x-0 bottom-0 z-20 border-t border-ink-100 bg-white px-4 pb-5 pt-3", className].join(" ")}>
      <div className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-3xl">{children}</div>
    </div>
  );
}
