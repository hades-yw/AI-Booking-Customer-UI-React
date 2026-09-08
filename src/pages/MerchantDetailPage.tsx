import { ArrowRight, Check, ChevronLeft, Clock, Mail, MapPin, Phone, Share2, Star } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { BottomActionBar } from "../components/layout/BottomActionBar";
import { Footer } from "../components/layout/Footer";
import { PageContainer } from "../components/layout/PageContainer";
import { Card } from "../components/ui/Card";
import { IconButton } from "../components/ui/IconButton";
import { ErrorState, LoadingState } from "../components/ui/AsyncState";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { useBookingFlow } from "../context/BookingFlowContext";
import { ServiceAccordion } from "../features/booking/ServiceAccordion";
import { gradientStyle } from "../lib/style";
import { useAsync } from "../lib/useAsync";
import type { BusinessHours, ServicePackage } from "../types";

const TABS = ["About", "Gallery", "Packages"] as const;
type Tab = (typeof TABS)[number];

function tabToParam(t: Tab) {
  return t.toLowerCase();
}

function paramToTab(v: string | null): Tab {
  const match = TABS.find((t) => tabToParam(t) === v);
  return match ?? "About";
}

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABEL: Record<(typeof DAY_ORDER)[number], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function to12h(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function todayKey(timezone?: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: timezone }).format(new Date());
  return parts.toLowerCase();
}

function BusinessHoursList({ hours, timezone }: { hours: BusinessHours; timezone?: string }) {
  const today = todayKey(timezone);
  return (
    <div className="flex flex-col gap-1.5">
      {DAY_ORDER.map((day) => {
        const entry = hours[day];
        const isToday = day === today;
        return (
          <div
            key={day}
            className={[
              "flex items-center justify-between rounded-lg px-2 py-1 text-[12px]",
              isToday ? "bg-brand-50 font-semibold text-brand-700" : "text-ink-600",
            ].join(" ")}
          >
            <span>{DAY_LABEL[day]}</span>
            <span>{entry ? `${to12h(entry.open)} – ${to12h(entry.close)}` : "Closed"}</span>
          </div>
        );
      })}
    </div>
  );
}

export function MerchantDetailPage() {
  const { merchantId } = useParams<{ merchantId: string }>();
  const navigate = useNavigate();
  const { merchant: bookingMerchant, pkg, startBooking } = useBookingFlow();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = useMemo(() => paramToTab(searchParams.get("tab")), [searchParams]);

  const setTab = (t: Tab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tabToParam(t));
        return next;
      },
      { replace: true },
    );
  };

  const { data: merchant, loading, error } = useAsync(
    () => (merchantId ? api.getMerchant(merchantId) : Promise.resolve(undefined)),
    [merchantId],
  );

  const handleBook = (pkg: ServicePackage) => {
    if (!merchant) return;
    startBooking(merchant, pkg);
    navigate(`/merchants/${merchant.id}/book`);
  };

  if (loading) return <PageContainer><LoadingState label="Loading merchant…" /></PageContainer>;
  if (error || !merchant) return <PageContainer><ErrorState message="Merchant not found." /></PageContainer>;

  return (
    <PageContainer withBottomBarSpacing={tab !== "Packages"}>
      <div
        style={merchant.bannerUrl ? { backgroundImage: `url(${merchant.bannerUrl})` } : gradientStyle(merchant.gradient)}
        className="relative h-56 bg-cover bg-center md:h-72 lg:h-80"
      >
        <div className="mx-auto h-full w-full max-w-[1600px] lg:px-12">
          <IconButton
            variant="translucent"
            className="absolute left-4 top-4 lg:left-12"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ChevronLeft size={20} className="text-ink-700" />
          </IconButton>
          <IconButton variant="translucent" className="absolute right-4 top-4 lg:right-12" aria-label="Share">
            <Share2 size={15} className="text-ink-700" />
          </IconButton>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1600px] flex-1 lg:px-12">
        <div className="relative z-10 mx-4 -mt-8 rounded-[20px] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.1)] md:mx-8 lg:mx-0 lg:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="m-0 text-[17px] font-extrabold text-ink-900 lg:text-2xl">{merchant.name}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-brand-500 lg:text-sm">{merchant.category}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Star size={13} className="text-amber-400" fill="#fbbf24" />
                <span className="text-sm font-extrabold text-ink-900">{merchant.rating}</span>
              </div>
              <span className="text-[11px] text-ink-400">{merchant.reviews} reviews</span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-ink-500">
            <MapPin size={12} />
            <span className="text-xs">
              {merchant.location} · {merchant.distance}
            </span>
          </div>
        </div>

        <div className="lg:flex lg:items-start lg:gap-8 lg:px-0 lg:pt-6">
          <div className="lg:min-w-0 lg:flex-1">
            <div className="mx-4 mt-5 flex border-b-[1.5px] border-ink-200 md:mx-8 lg:mx-0">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={[
                    "-mb-[1.5px] flex-1 cursor-pointer border-0 border-b-[2.5px] bg-transparent pb-2.5 pt-1 text-[13px] font-semibold transition-colors lg:flex-none lg:px-6 lg:text-sm",
                    tab === t ? "border-brand-600 text-brand-600" : "border-transparent text-ink-400",
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="px-4 pt-4 md:px-8 lg:px-0">
              {tab === "About" && (
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="mb-4 text-[13px] leading-relaxed text-ink-600 lg:text-sm">{merchant.description}</p>
                    <div
                      className="grid gap-2"
                      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
                    >
                      {merchant.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600">
                            <Check size={11} className="text-white" />
                          </div>
                          <span className="text-[11px] font-semibold text-brand-700">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(merchant.address || merchant.phone || merchant.email) && (
                    <Card className="p-4">
                      <p className="m-0 mb-3 text-xs font-bold uppercase tracking-wide text-ink-400">Contact</p>
                      <div className="flex flex-col gap-2.5">
                        {merchant.address && (
                          <div className="flex items-start gap-2.5">
                            <MapPin size={15} className="mt-0.5 shrink-0 text-brand-600" />
                            <span className="text-[13px] text-ink-700">{merchant.address}</span>
                          </div>
                        )}
                        {merchant.phone && (
                          <a
                            href={`tel:${merchant.phone.replace(/\s+/g, "")}`}
                            className="flex items-center gap-2.5 text-[13px] text-ink-700 hover:text-brand-600"
                          >
                            <Phone size={15} className="shrink-0 text-brand-600" />
                            {merchant.phone}
                          </a>
                        )}
                        {merchant.email && (
                          <a
                            href={`mailto:${merchant.email}`}
                            className="flex items-center gap-2.5 text-[13px] text-ink-700 hover:text-brand-600"
                          >
                            <Mail size={15} className="shrink-0 text-brand-600" />
                            {merchant.email}
                          </a>
                        )}
                      </div>
                    </Card>
                  )}

                  {merchant.businessHours && (
                    <Card className="p-4">
                      <p className="m-0 mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-400">
                        <Clock size={13} /> Business Hours
                      </p>
                      <BusinessHoursList hours={merchant.businessHours} timezone={merchant.timezone} />
                    </Card>
                  )}

                  {merchant.faqs && (
                    <Card className="p-4">
                      <p className="m-0 mb-3 text-xs font-bold uppercase tracking-wide text-ink-400">FAQs</p>
                      <div
                        className="text-[13px] leading-relaxed text-ink-600 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-ink-900"
                        dangerouslySetInnerHTML={{ __html: merchant.faqs }}
                      />
                    </Card>
                  )}

                  {merchant.termsAndConditions && (
                    <Card className="p-4">
                      <p className="m-0 mb-3 text-xs font-bold uppercase tracking-wide text-ink-400">
                        Terms &amp; Conditions
                      </p>
                      <div
                        className="text-[13px] leading-relaxed text-ink-600 [&_p]:mb-2 [&_p:last-child]:mb-0"
                        dangerouslySetInnerHTML={{ __html: merchant.termsAndConditions }}
                      />
                    </Card>
                  )}
                </div>
              )}

              {tab === "Gallery" && (
                <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
                  {merchant.gallery.map((g, i) => (
                    <div
                      key={i}
                      style={g.imageUrl ? { backgroundImage: `url(${g.imageUrl})` } : gradientStyle(g.gradient)}
                      className="flex h-36 items-end overflow-hidden rounded-2xl bg-cover bg-center p-2 lg:h-44"
                    >
                      <span className="rounded-full bg-black/30 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                        {g.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {tab === "Packages" && (
                <ServiceAccordion
                  services={merchant.services}
                  onBook={handleBook}
                  initialPackage={bookingMerchant?.id === merchant.id ? pkg : null}
                />
              )}
            </div>
          </div>

          {tab !== "Packages" && (
            <aside className="hidden shrink-0 lg:sticky lg:top-6 lg:block lg:w-80">
              <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                <p className="m-0 text-sm font-bold text-ink-900">Ready to book?</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">
                  Browse {merchant.name}'s packages and pick a time that works for you.
                </p>
                <PrimaryButton fullWidth className="mt-4" onClick={() => setTab("Packages")}>
                  View Packages <ArrowRight size={16} />
                </PrimaryButton>
              </div>
            </aside>
          )}
        </div>
      </div>

      {tab !== "Packages" && (
        <BottomActionBar className="lg:hidden">
          <PrimaryButton fullWidth onClick={() => setTab("Packages")}>
            View Packages <ArrowRight size={16} />
          </PrimaryButton>
        </BottomActionBar>
      )}

      <Footer />
    </PageContainer>
  );
}
