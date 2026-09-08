import { Users } from "lucide-react";
import type { Staff } from "../../types";

interface StaffPickerProps {
  staff: Staff[];
  selectedStaffId: string | null; // null = "Any staff"
  onSelect: (staffId: string | null) => void;
}

export function StaffPicker({ staff, selectedStaffId, onSelect }: StaffPickerProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="flex w-max gap-2 pb-1 md:w-full md:flex-wrap">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={[
            "flex min-w-[84px] flex-col items-center gap-1 rounded-2xl px-3 py-2.5 transition-all cursor-pointer",
            selectedStaffId === null
              ? "bg-brand-600 shadow-[0_4px_14px_rgba(79,70,229,0.3)]"
              : "border-[1.5px] border-ink-200 bg-white",
          ].join(" ")}
        >
          <Users size={16} className={selectedStaffId === null ? "text-white" : "text-ink-400"} />
          <span
            className={[
              "text-[11px] font-semibold",
              selectedStaffId === null ? "text-white" : "text-ink-700",
            ].join(" ")}
          >
            Any staff
          </span>
        </button>

        {staff.map((s) => {
          const isSelected = selectedStaffId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={[
                "flex min-w-[84px] flex-col items-center gap-0.5 rounded-2xl px-3 py-2.5 text-center transition-all cursor-pointer",
                isSelected ? "bg-brand-600 shadow-[0_4px_14px_rgba(79,70,229,0.3)]" : "border-[1.5px] border-ink-200 bg-white",
              ].join(" ")}
            >
              <span className={["text-[12px] font-bold", isSelected ? "text-white" : "text-ink-900"].join(" ")}>
                {s.name}
              </span>
              <span className={["text-[10px]", isSelected ? "text-brand-200" : "text-ink-400"].join(" ")}>
                {s.role}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
