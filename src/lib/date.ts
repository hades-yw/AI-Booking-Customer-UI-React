const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(iso: string): string {
  const d = parseISODate(iso);
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

export function dayLabel(iso: string, index: number): string {
  const d = parseISODate(iso);
  return index === 0 ? "Today" : DAY_NAMES[d.getDay()];
}

export function dayOfMonth(iso: string): number {
  return parseISODate(iso).getDate();
}

export function monthLabel(iso: string): string {
  return MONTH_NAMES[parseISODate(iso).getMonth()];
}

export function monthYearLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

/**
 * Formats the clock-time portion of a tenant-local-naive ISO string
 * ("YYYY-MM-DDTHH:MM:SS", no UTC offset) as "9:00 AM". Parses the string
 * directly rather than via `new Date(iso)`, since a naive local string fed
 * through JS's Date would be silently reinterpreted in the browser's own
 * timezone and shift the displayed hour — see TimeSlot/SelectedSchedule in
 * src/types/index.ts for why these strings are never parsed that way.
 */
export function formatLocalNaiveTime(localNaiveIso: string): string {
  const timePart = localNaiveIso.split("T")[1] ?? "";
  const [hourStr, minuteStr] = timePart.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return localNaiveIso;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minuteStr.padStart(2, "0")} ${period}`;
}

/**
 * Formats a real UTC ISO datetime (as returned by booking-detail endpoints,
 * unlike the tenant-local-naive strings above) as "Sun, 9 Mar" in the
 * viewer's own local timezone — for showing a past booking's date on its
 * receipt page.
 */
export function formatUtcDate(utcIso: string): string {
  const d = new Date(utcIso);
  if (Number.isNaN(d.getTime())) return utcIso;
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

/** Formats a real UTC ISO datetime's clock time as "9:00 AM" in the viewer's own local timezone. */
export function formatUtcTime(utcIso: string): string {
  const d = new Date(utcIso);
  if (Number.isNaN(d.getTime())) return utcIso;
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Builds a 6-week (42-cell) grid for the given month, padded with the
 * trailing days of the previous month and leading days of the next so the
 * grid always aligns Sunday-first regardless of which day the month starts.
 */
export function getMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}
