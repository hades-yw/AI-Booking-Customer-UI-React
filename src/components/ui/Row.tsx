interface RowProps {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
}

export function Row({ label, value, bold = false, accent = false }: RowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-ink-400">{label}</span>
      <span
        className={[
          bold ? "text-[15px] font-bold" : "text-[13px] font-medium",
          accent ? "text-brand-600" : "text-ink-900",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
