import { formatLocalNaiveTime } from "../../lib/date";
import type { TimeSlot } from "../../types";

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selected: string | null;
  onSelect: (slot: TimeSlot) => void;
}

export function TimeSlotGrid({ slots, selected, onSelect }: TimeSlotGridProps) {
  if (slots.length === 0) {
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-center">
        <p className="m-0 text-[13px] font-semibold text-red-500">No slots available on this date.</p>
        <p className="mb-0 mt-1 text-xs text-ink-400">Please choose another day.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
      {slots.map((slot) => {
        const isSelected = selected === slot.label;
        const endLabel = slot.endTime ? formatLocalNaiveTime(slot.endTime) : null;
        return (
          <button
            key={slot.label}
            type="button"
            onClick={() => onSelect(slot)}
            className={[
              "flex flex-col items-center gap-0.5 rounded-xl py-2.5 text-xs font-semibold transition-all cursor-pointer",
              isSelected
                ? "bg-brand-600 text-white shadow-[0_2px_10px_rgba(79,70,229,0.25)]"
                : "border-[1.5px] border-ink-200 bg-white text-ink-600",
            ].join(" ")}
          >
            <span>{slot.label}</span>
            {endLabel && (
              <span className={`text-[10px] font-medium ${isSelected ? "text-white/75" : "text-ink-400"}`}>
                – {endLabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
