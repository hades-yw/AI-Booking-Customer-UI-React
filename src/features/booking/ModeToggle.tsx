export type ScheduleMode = "date" | "staff";

interface ModeToggleProps {
  mode: ScheduleMode;
  onChange: (mode: ScheduleMode) => void;
}

const OPTIONS: { id: ScheduleMode; label: string }[] = [
  { id: "date", label: "By Date" },
  { id: "staff", label: "By Staff" },
];

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex gap-1 rounded-2xl border-[1.5px] border-ink-200 bg-white p-1">
      {OPTIONS.map(({ id, label }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={[
              "rounded-xl px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              active ? "bg-brand-600 text-white shadow-[0_2px_10px_rgba(79,70,229,0.25)]" : "text-ink-500",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
