import { CalendarDays } from "lucide-react";
import { dayLabel, dayOfMonth, monthLabel } from "../../lib/date";
import type { DayAvailability } from "../../types";

interface DateStripProps {
  availability: DayAvailability[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onOpenCalendar?: () => void;
}

export function DateStrip({ availability, selectedIndex, onSelect, onOpenCalendar }: DateStripProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="flex w-max gap-2 pb-1 md:w-full md:flex-wrap">
        {availability.map((av, i) => {
          const isSelected = selectedIndex === i;
          const hasSlots = av.slots.length > 0;
          return (
            <button
              key={av.date}
              type="button"
              onClick={() => onSelect(i)}
              className={[
                "flex min-w-[56px] flex-col items-center rounded-2xl px-2.5 pb-2 pt-2.5 transition-all cursor-pointer",
                isSelected
                  ? "bg-brand-600 shadow-[0_4px_14px_rgba(79,70,229,0.3)]"
                  : "border-[1.5px] border-ink-200 bg-white",
              ].join(" ")}
            >
              <span className={["text-[10px] font-semibold", isSelected ? "text-brand-200" : "text-ink-400"].join(" ")}>
                {dayLabel(av.date, i)}
              </span>
              <span className={["my-0.5 text-lg font-extrabold", isSelected ? "text-white" : "text-ink-900"].join(" ")}>
                {dayOfMonth(av.date)}
              </span>
              <span className={["text-[10px]", isSelected ? "text-brand-200" : "text-ink-400"].join(" ")}>
                {monthLabel(av.date)}
              </span>
              <div
                className={[
                  "mt-1 h-1.5 w-1.5 rounded-full",
                  !hasSlots ? "bg-red-400" : isSelected ? "bg-white/50" : "bg-emerald-400",
                ].join(" ")}
              />
            </button>
          );
        })}
        {onOpenCalendar && (
          <button
            type="button"
            onClick={onOpenCalendar}
            aria-label="Choose a date from calendar"
            className="flex min-w-[56px] flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] border-dashed border-ink-200 bg-white px-2.5 py-2 text-ink-500 transition-all cursor-pointer hover:border-brand-400 hover:text-brand-600"
          >
            <CalendarDays size={18} />
            <span className="text-[10px] font-semibold">More</span>
          </button>
        )}
      </div>
    </div>
  );
}
