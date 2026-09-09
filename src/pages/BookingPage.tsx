import { ArrowRight, Calendar, ChevronDown, ChevronUp, Clock, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { BottomActionBar } from "../components/layout/BottomActionBar";
import { Footer } from "../components/layout/Footer";
import { PageContainer } from "../components/layout/PageContainer";
import { TopNav } from "../components/layout/TopNav";
import { ErrorState, LoadingState } from "../components/ui/AsyncState";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { useBookingFlow } from "../context/BookingFlowContext";
import { CalendarPanel } from "../features/booking/CalendarPanel";
import { DateStrip } from "../features/booking/DateStrip";
import { ModeToggle, type ScheduleMode } from "../features/booking/ModeToggle";
import { StaffPicker } from "../features/booking/StaffPicker";
import { TimeSlotGrid } from "../features/booking/TimeSlotGrid";
import { formatDate, toISODate } from "../lib/date";
import { formatCurrency, gradientStyle } from "../lib/style";
import { useAsync } from "../lib/useAsync";
import type { DayAvailability, Quote, StaffDayAvailability, TimeSlot } from "../types";

const STAFF_MODE_DAY_COUNT = 7;

function BreakdownRow({ label, sublabel, value }: { label: string; sublabel?: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[12px]">
      <div className="min-w-0">
        <p className="m-0 text-white/70">{label}</p>
        {sublabel && <p className="m-0 text-[10px] text-white/50">{sublabel}</p>}
      </div>
      <span className="shrink-0 font-semibold text-white">{value}</span>
    </div>
  );
}

function hoursLabel(minutes: number): string {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}hr` : `${hours.toFixed(2)}hr`;
}

function PackageSummaryCard({
  merchant,
  pkg,
  quote,
  quoteLoading,
  onEdit,
  className = "",
}: {
  merchant: NonNullable<ReturnType<typeof useBookingFlow>["merchant"]>;
  pkg: NonNullable<ReturnType<typeof useBookingFlow>["pkg"]>;
  quote?: Quote | null;
  quoteLoading?: boolean;
  onEdit: () => void;
  className?: string;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const displayTotal = quote ? quote.totalAmount - quote.processingFee : pkg.total;
  return (
    <div style={gradientStyle(merchant.gradient)} className={`rounded-[20px] p-4 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="mb-1 text-[11px] font-semibold tracking-wide text-white/65">{merchant.name}</p>
        <button
          type="button"
          onClick={onEdit}
          className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full border-0 bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/25"
        >
          <Pencil size={11} /> Edit
        </button>
      </div>
      <p className="mb-2 text-[17px] font-extrabold text-white">{pkg.name}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-white/75">
          <Clock size={13} />
          <span className="text-[13px]">{pkg.duration} min</span>
        </div>
        <div className="text-right">
          <span className="text-xl font-black text-white">
            {quoteLoading ? "Calculating…" : formatCurrency(displayTotal, { estimate: !quote })}
          </span>
          <p className="m-0 text-[10px] text-white/60">{quote ? "Total" : "Estimated total"}</p>
        </div>
      </div>

      {!quoteLoading && (
        <button
          type="button"
          onClick={() => setShowBreakdown((v) => !v)}
          className="mt-2 flex w-full cursor-pointer items-center justify-end gap-1 border-0 bg-transparent p-0 text-[11px] font-semibold text-white/70 hover:text-white"
        >
          {showBreakdown ? "Hide details" : "How is this calculated?"}
          {showBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      )}

      {showBreakdown && !quoteLoading && (
        <div className="mt-2 flex flex-col gap-1.5 border-t border-white/15 pt-2.5">
          {quote && quote.lines.length > 0 ? (
            <>
              {quote.billableDurationMinutes !== 60 && quote.lines.some((l) => l.pricingBasis === "per_hour") && (
                <p className="m-0 text-[11px] text-white/60">
                  Rates marked /hr are billed for the full {hoursLabel(quote.billableDurationMinutes)} booked, not per
                  visit.
                </p>
              )}
              {quote.lines.map((line, i) => {
                const isPerHour = line.pricingBasis === "per_hour";
                const rate = isPerHour ? line.amount / (quote.billableDurationMinutes / 60) : null;
                return (
                  <BreakdownRow
                    key={`${line.type}-${i}`}
                    label={line.type === "service" ? line.name : `+ ${line.name}`}
                    sublabel={
                      rate !== null
                        ? `${formatCurrency(rate)}/hr × ${hoursLabel(quote.billableDurationMinutes)}`
                        : undefined
                    }
                    value={formatCurrency(line.amount)}
                  />
                );
              })}
              {quote.peakAdjustment !== 0 && (
                <BreakdownRow
                  label="Peak pricing adjustment"
                  value={`${quote.peakAdjustment > 0 ? "+" : ""}${formatCurrency(quote.peakAdjustment)}`}
                />
              )}
              {quote.discountAmount > 0 && (
                <BreakdownRow label="Discount" value={`-${formatCurrency(quote.discountAmount)}`} />
              )}
            </>
          ) : (
            <>
              <BreakdownRow label={pkg.name} value={formatCurrency(pkg.price)} />
              {pkg.selectedPackages.map((selPkg) => (
                <BreakdownRow key={selPkg.id} label={`+ ${selPkg.name}`} value={formatCurrency(selPkg.price)} />
              ))}
              {pkg.selectedOptions.map((opt) => (
                <BreakdownRow key={opt.id} label={`+ ${opt.name}`} value={formatCurrency(opt.price)} />
              ))}
              <p className="m-0 text-[11px] text-white/60">
                Estimated from selected options — pick a date &amp; time for the confirmed server price.
              </p>
            </>
          )}
          <div className="mt-1 flex items-center justify-between border-t border-white/15 pt-1.5 text-[13px]">
            <span className="font-bold text-white">Total</span>
            <span className="font-black text-white">{formatCurrency(displayTotal, { estimate: !quote })}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function nextDates(count: number): string[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return toISODate(d);
  });
}

export function BookingPage() {
  const navigate = useNavigate();
  const { merchant, pkg, setSchedule } = useBookingFlow();

  // "By Date" mode state (existing flow, unchanged)
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [customDay, setCustomDay] = useState<DayAvailability | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Mode + "By Staff" mode state
  const [mode, setMode] = useState<ScheduleMode>("date");
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedDayStaff, setSelectedDayStaff] = useState(0);
  const [selectedSlotStaff, setSelectedSlotStaff] = useState<TimeSlot | null>(null);
  const [customStaffDay, setCustomStaffDay] = useState<{ date: string; staff: StaffDayAvailability[] } | null>(
    null,
  );
  const [isStaffCalendarOpen, setIsStaffCalendarOpen] = useState(false);

  const staffModeDates = useMemo(() => nextDates(STAFF_MODE_DAY_COUNT), []);
  const staffModeDate = customStaffDay ? customStaffDay.date : staffModeDates[selectedDayStaff];

  const { data: availability, loading, error } = useAsync(
    () => (merchant && pkg ? api.getAvailability(merchant.id, pkg.id) : Promise.resolve([])),
    [merchant?.id, pkg?.id],
  );

  const { data: staffList } = useAsync(
    () => (merchant ? api.getStaff(merchant.id) : Promise.resolve([])),
    [merchant?.id],
  );
  const showStaffToggle = (staffList?.length ?? 0) > 0;

  // Fetches all 7 strip dates up front (like "By Date" mode's getAvailability
  // loop) so every date's dot reflects real per-day staff availability,
  // rather than only the currently-selected date.
  const {
    data: staffAvailabilityByDate,
    loading: staffLoading,
    error: staffError,
  } = useAsync(
    () =>
      mode === "staff" && merchant && pkg
        ? Promise.all(staffModeDates.map((date) => api.getAvailabilityByStaff(merchant.id, pkg.id, date)))
        : Promise.resolve([]),
    [mode, merchant?.id, pkg?.id, staffModeDates],
  );
  const staffAvailability = customStaffDay ? customStaffDay.staff : staffAvailabilityByDate?.[selectedDayStaff];

  const day = customDay ?? availability?.[selectedDay];

  // Slots for the currently-selected staff (or the union across all staff
  // when "Any staff" is picked), keyed by label so a chosen slot's raw
  // start/end time can be recovered for SelectedSchedule.
  const staffModeSlotsByLabel = new Map<string, TimeSlot>();
  if (staffAvailability) {
    const relevant = selectedStaffId
      ? staffAvailability.filter((s) => s.staffId === selectedStaffId)
      : staffAvailability;
    for (const day of relevant) {
      for (const slot of day.slots) {
        if (!staffModeSlotsByLabel.has(slot.label)) staffModeSlotsByLabel.set(slot.label, slot);
      }
    }
  }
  const staffModeSlots = Array.from(staffModeSlotsByLabel.values());
  const staffModeDayAvailability: DayAvailability[] = staffModeDates.map((date, i) => {
    const dayStaffAvailability = staffAvailabilityByDate?.[i];
    const relevant = selectedStaffId
      ? dayStaffAvailability?.filter((s) => s.staffId === selectedStaffId)
      : dayStaffAvailability;
    const slotsByLabel = new Map<string, TimeSlot>();
    for (const day of relevant ?? []) {
      for (const slot of day.slots) {
        if (!slotsByLabel.has(slot.label)) slotsByLabel.set(slot.label, slot);
      }
    }
    return { date, slots: Array.from(slotsByLabel.values()) };
  });
  const selectedStaffName = selectedStaffId ? staffList?.find((s) => s.id === selectedStaffId)?.name : undefined;

  // As soon as a slot is picked in either mode, fetch a real server quote so
  // the sidebar total reflects pricing_basis/peak-pricing adjustments rather
  // than the flat pkg.total estimate — same quote endpoint ConfirmationPage
  // uses, just fired one step earlier for a nicer preview (no coupon here;
  // that's only entered on Confirmation).
  const activeSlot = mode === "date" ? selectedSlot : selectedSlotStaff;
  const { data: quote, loading: quoteFetchLoading } = useAsync(
    () =>
      activeSlot && merchant && pkg
        ? api.getQuote(merchant.id, {
            startTimeLocalNaive: activeSlot.startTime,
            tenantTimezone: merchant.timezone ?? "Asia/Kuala_Lumpur",
            durationMinutes: pkg.duration,
            serviceId: Number(pkg.id),
            packageId: pkg.selectedPackages[0] ? Number(pkg.selectedPackages[0].id) : undefined,
            optionIds: pkg.selectedOptions.map((o) => Number(o.id)),
          })
        : Promise.resolve(null),
    [activeSlot?.startTime, merchant?.id, pkg?.id],
  );
  const quoteLoading = Boolean(activeSlot) && quoteFetchLoading;

  // Keep every hook above the route guard so renders always call hooks in the
  // same order, including the first render after restoring a booking draft.
  if (!merchant || !pkg) return <Navigate to="/" replace />;

  const handleSelectQuickDay = (i: number) => {
    setSelectedDay(i);
    setCustomDay(null);
    setSelectedSlot(null);
    setIsCalendarOpen(false);
  };

  const handlePickCalendarDate = async (isoDate: string) => {
    setSelectedSlot(null);
    const quickMatchIndex = availability?.findIndex((av) => av.date === isoDate) ?? -1;
    if (quickMatchIndex >= 0) {
      setSelectedDay(quickMatchIndex);
      setCustomDay(null);
      return;
    }
    const dayAvailability = await api.getAvailabilityForDate(merchant.id, pkg.id, isoDate);
    setCustomDay(dayAvailability);
  };

  const handleSelectMode = (next: ScheduleMode) => {
    setMode(next);
    setSelectedSlotStaff(null);
  };

  const handleSelectStaff = (staffId: string | null) => {
    setSelectedStaffId(staffId);
    setSelectedSlotStaff(null);
  };

  const handleSelectStaffModeDay = (i: number) => {
    setSelectedDayStaff(i);
    setCustomStaffDay(null);
    setSelectedSlotStaff(null);
    setIsStaffCalendarOpen(false);
  };

  const handlePickStaffCalendarDate = async (isoDate: string) => {
    setSelectedSlotStaff(null);
    const quickMatchIndex = staffModeDates.indexOf(isoDate);
    if (quickMatchIndex >= 0) {
      setSelectedDayStaff(quickMatchIndex);
      setCustomStaffDay(null);
      return;
    }
    const staff = await api.getAvailabilityByStaff(merchant.id, pkg.id, isoDate);
    setCustomStaffDay({ date: isoDate, staff });
  };

  const currentSelection =
    mode === "date"
      ? day && selectedSlot
        ? { date: day.date, slot: selectedSlot.label, staffName: undefined as string | undefined }
        : null
      : selectedSlotStaff
        ? { date: staffModeDate, slot: selectedSlotStaff.label, staffName: selectedStaffName }
        : null;

  const handleProceed = () => {
    if (mode === "date") {
      if (!day || !selectedSlot) return;
      setSchedule({
        date: day.date,
        slot: selectedSlot.label,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });
    } else {
      if (!selectedSlotStaff) return;
      setSchedule({
        date: staffModeDate,
        slot: selectedSlotStaff.label,
        staffId: selectedStaffId ?? undefined,
        staffName: selectedStaffName,
        startTime: selectedSlotStaff.startTime,
        endTime: selectedSlotStaff.endTime,
      });
    }
    navigate(`/merchants/${merchant.id}/confirm`);
  };

  return (
    <PageContainer withBottomBarSpacing>
      <TopNav title="Select Date & Time" onBack={() => navigate(-1)} />

      <div className="mx-auto w-full max-w-5xl flex-1 lg:flex lg:items-start lg:gap-8 lg:px-8 lg:pt-6">
        <div className="flex min-w-0 flex-1 flex-col gap-5 px-4 pt-4 md:px-8 lg:px-0 lg:pt-0">
          <PackageSummaryCard
            merchant={merchant}
            pkg={pkg}
            quote={quote}
            quoteLoading={quoteLoading}
            onEdit={() => navigate(`/merchants/${merchant.id}?tab=packages`)}
            className="lg:hidden"
          />

          {showStaffToggle && <ModeToggle mode={mode} onChange={handleSelectMode} />}

          {mode === "date" ? (
            <>
              {loading && <LoadingState label="Loading availability…" />}
              {error && <ErrorState message="Couldn't load availability." />}

              {availability && day && (
                <>
                  <div>
                    <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-ink-900">
                      <Calendar size={14} className="text-brand-500" /> Choose a Date
                    </p>
                    <DateStrip
                      availability={availability}
                      selectedIndex={customDay ? -1 : selectedDay}
                      onSelect={handleSelectQuickDay}
                      onOpenCalendar={() => setIsCalendarOpen(true)}
                    />
                    {isCalendarOpen && (
                      <div className="mt-3">
                        <CalendarPanel
                          selectedDate={day?.date ?? null}
                          canClose={!customDay}
                          onSelect={handlePickCalendarDate}
                          onClose={() => setIsCalendarOpen(false)}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-ink-900">
                      <Clock size={14} className="text-brand-500" /> Available Times — {formatDate(day.date)}
                    </p>
                    <TimeSlotGrid slots={day.slots} selected={selectedSlot?.label ?? null} onSelect={setSelectedSlot} />
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div>
                <p className="mb-3 text-[13px] font-bold text-ink-900">Choose a Staff Member</p>
                <StaffPicker staff={staffList ?? []} selectedStaffId={selectedStaffId} onSelect={handleSelectStaff} />
              </div>

              <div>
                <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-ink-900">
                  <Calendar size={14} className="text-brand-500" /> Choose a Date
                </p>
                <DateStrip
                  availability={staffModeDayAvailability}
                  selectedIndex={customStaffDay ? -1 : selectedDayStaff}
                  onSelect={handleSelectStaffModeDay}
                  onOpenCalendar={() => setIsStaffCalendarOpen(true)}
                />
                {isStaffCalendarOpen && (
                  <div className="mt-3">
                    <CalendarPanel
                      selectedDate={staffModeDate ?? null}
                      canClose={!customStaffDay}
                      onSelect={handlePickStaffCalendarDate}
                      onClose={() => setIsStaffCalendarOpen(false)}
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-ink-900">
                  <Clock size={14} className="text-brand-500" /> Available Times — {formatDate(staffModeDate)}
                </p>
                {staffLoading && <LoadingState label="Loading availability…" />}
                {staffError && <ErrorState message="Couldn't load availability." />}
                {!staffLoading && !staffError && (
                  <TimeSlotGrid
                    slots={staffModeSlots}
                    selected={selectedSlotStaff?.label ?? null}
                    onSelect={setSelectedSlotStaff}
                  />
                )}
              </div>
            </>
          )}
        </div>

        <aside className="hidden shrink-0 lg:sticky lg:top-6 lg:block lg:w-80">
          <PackageSummaryCard
            merchant={merchant}
            pkg={pkg}
            quote={quote}
            quoteLoading={quoteLoading}
            onEdit={() => navigate(`/merchants/${merchant.id}?tab=packages`)}
          />

          <div className="mt-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
            {currentSelection ? (
              <div className="mb-4 flex justify-between">
                <span className="text-xs text-ink-400">Selected</span>
                <span className="text-xs font-semibold text-brand-600">
                  {formatDate(currentSelection.date)} · {currentSelection.slot}
                  {currentSelection.staffName ? ` · ${currentSelection.staffName}` : ""}
                </span>
              </div>
            ) : (
              <p className="m-0 mb-4 text-xs text-ink-400">Pick a date and time to continue.</p>
            )}
            <PrimaryButton fullWidth disabled={!currentSelection} onClick={handleProceed}>
              Proceed to Confirmation <ArrowRight size={16} />
            </PrimaryButton>
          </div>
        </aside>
      </div>

      <BottomActionBar className="lg:hidden">
        {currentSelection && (
          <div className="mb-2.5 flex justify-between px-1">
            <span className="text-xs text-ink-400">Selected</span>
            <span className="text-xs font-semibold text-brand-600">
              {formatDate(currentSelection.date)} · {currentSelection.slot}
              {currentSelection.staffName ? ` · ${currentSelection.staffName}` : ""}
            </span>
          </div>
        )}
        <PrimaryButton fullWidth disabled={!currentSelection} onClick={handleProceed}>
          Proceed to Confirmation <ArrowRight size={16} />
        </PrimaryButton>
      </BottomActionBar>

      <Footer />
    </PageContainer>
  );
}
