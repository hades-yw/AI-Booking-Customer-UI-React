import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { getMonthGrid, isSameDay, monthYearLabel, startOfDay, toISODate } from "../../lib/date";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

interface CalendarPanelProps {
  selectedDate: string | null;
  canClose: boolean;
  onSelect: (isoDate: string) => void;
  onClose: () => void;
}

/** Full month-grid calendar, shown inline below the date strip to pick any future date. */
export function CalendarPanel({ selectedDate, canClose, onSelect, onClose }: CalendarPanelProps) {
  const today = startOfDay(new Date());
  const initial = selectedDate ? new Date(`${selectedDate}T00:00:00`) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const grid = getMonthGrid(viewYear, viewMonth);

  const goToPrevMonth = () => {
    const prev = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(prev.getFullYear());
    setViewMonth(prev.getMonth());
  };

  const goToNextMonth = () => {
    const next = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const isPrevDisabled = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div className="w-full rounded-2xl border-[1.5px] border-ink-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[15px] font-bold text-ink-900">Select a Date</span>
        {canClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to date strip"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-ink-100 text-ink-500"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goToPrevMonth}
          disabled={isPrevDisabled}
          aria-label="Previous month"
          className={[
            "flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-ink-200 bg-white transition-colors",
            isPrevDisabled ? "cursor-not-allowed opacity-30" : "cursor-pointer",
          ].join(" ")}
        >
          <ChevronLeft size={16} className="text-ink-700" />
        </button>
        <span className="text-[13px] font-bold text-ink-900">{monthYearLabel(viewYear, viewMonth)}</span>
        <button
          type="button"
          onClick={goToNextMonth}
          aria-label="Next month"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-ink-200 bg-white"
        >
          <ChevronRight size={16} className="text-ink-700" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="flex h-8 items-center justify-center text-[11px] font-semibold text-ink-400">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {grid.map((date, i) => {
          const inMonth = date.getMonth() === viewMonth;
          const isPast = date < today;
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate === toISODate(date);
          const disabled = !inMonth || isPast;

          return (
            <div key={i} className="flex items-center justify-center">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(toISODate(date))}
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold transition-all",
                  disabled
                    ? "cursor-not-allowed border-0 bg-transparent text-ink-200"
                    : isSelected
                      ? "cursor-pointer border-0 bg-brand-600 text-white shadow-[0_4px_14px_rgba(79,70,229,0.3)]"
                      : isToday
                        ? "cursor-pointer border-[1.5px] border-brand-400 bg-white text-brand-600"
                        : "cursor-pointer border-0 bg-white text-ink-900 hover:bg-ink-100",
                ].join(" ")}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
