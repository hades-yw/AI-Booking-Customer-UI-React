import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { IconButton } from "../ui/IconButton";

interface TopNavProps {
  title: string;
  onBack?: () => void;
  trailing?: ReactNode;
}

/** Sticky page header used by every route after the landing page. */
export function TopNav({ title, onBack, trailing }: TopNavProps) {
  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink-100 bg-white px-4 py-3.5 md:px-8">
      {onBack && (
        <IconButton variant="outline" onClick={onBack} aria-label="Go back">
          <ChevronLeft size={19} className="text-ink-700" />
        </IconButton>
      )}
      <span className="text-[15px] font-bold text-ink-900">{title}</span>
      {trailing && <div className="ml-auto">{trailing}</div>}
    </div>
  );
}
