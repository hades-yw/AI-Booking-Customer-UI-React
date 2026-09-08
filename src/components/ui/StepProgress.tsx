import { Check } from "lucide-react";

interface StepProgressProps {
  steps: string[];
  /** Index of the step currently active (0-based). Steps before it are complete. */
  activeIndex: number;
}

export function StepProgress({ steps, activeIndex }: StepProgressProps) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <div key={step} className="flex flex-1 items-center gap-1">
            <div
              className={[
                "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold",
                done ? "bg-emerald-500 text-white" : active ? "bg-brand-600 text-white" : "bg-ink-200 text-ink-400",
              ].join(" ")}
            >
              {done ? <Check size={10} /> : i + 1}
            </div>
            <span
              className={[
                "shrink-0 text-[10px] font-semibold",
                done ? "text-emerald-500" : active ? "text-brand-600" : "text-ink-400",
              ].join(" ")}
            >
              {step}
            </span>
            {i < steps.length - 1 && (
              <div className={["h-[1.5px] flex-1", done ? "bg-emerald-300" : "bg-ink-200"].join(" ")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
