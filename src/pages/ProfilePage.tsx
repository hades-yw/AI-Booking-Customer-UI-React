import {
  CalendarClock,
  Heart,
  KeyRound,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Footer } from "../components/layout/Footer";
import { PageContainer } from "../components/layout/PageContainer";
import { TopNav } from "../components/layout/TopNav";
import { LoadingState } from "../components/ui/AsyncState";
import { Card } from "../components/ui/Card";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { Row } from "../components/ui/Row";
import { TextField } from "../components/ui/TextField";
import { gradientStyle, formatCurrency } from "../lib/style";
import { api, ApiError } from "../api";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useAsync } from "../lib/useAsync";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatBookingDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Matches the backend's BookingStatus enum (app/models/enums.py): pending,
// approved, rejected, cancelled, no_show.
const STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-600",
  cancelled: "bg-red-100 text-red-600",
  no_show: "bg-ink-100 text-ink-600",
};

function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLES[status.toLowerCase()] ?? "bg-ink-100 text-ink-600";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${style}`}>{status}</span>
  );
}

const TABS = ["Overview", "Saved Merchants", "Bookings", "Security"] as const;
type Tab = (typeof TABS)[number];

function tabToParam(t: Tab) {
  return t.toLowerCase().replace(/\s+/g, "-");
}

function paramToTab(v: string | null): Tab {
  const match = TABS.find((t) => tabToParam(t) === v);
  return match ?? "Overview";
}

export function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = paramToTab(searchParams.get("tab"));
  const setTab = (t: Tab) => setSearchParams(t === "Overview" ? {} : { tab: tabToParam(t) });

  const { user, authenticated, loading, logout, manageAccount, updateProfile } = useAuth();
  const { favorites, loading: favoritesLoading, toggleLike } = useFavorites();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: bookings, loading: bookingsLoading } = useAsync(
    () => (authenticated ? api.getMyBookings() : Promise.resolve([])),
    [authenticated],
  );

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  if (!loading && !user) {
    return <Navigate to="/login" replace state={{ returnTo: `${location.pathname}${location.search}` }} />;
  }
  if (!user) return null;

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => void logout();

  const upcomingCount = (bookings ?? []).filter((b) => {
    const status = b.status.toLowerCase();
    return (status === "pending" || status === "approved") && new Date(b.startTime).getTime() > Date.now();
  }).length;

  return (
    <PageContainer>
      <TopNav title="My Profile" onBack={() => navigate(-1)} />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6 md:max-w-3xl md:py-10">
        {/* Header summary */}
        <Card className="flex items-center gap-4 p-4 md:p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand-600 to-brand-500 text-lg font-extrabold text-white">
            {initials(user.name || user.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold text-ink-900">{user.name || "Your account"}</p>
            <p className="truncate text-[13px] text-ink-400">{user.email}</p>
          </div>
        </Card>

        {/* Tab bar */}
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex whitespace-nowrap border-b-[1.5px] border-ink-200">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={[
                  "-mb-[1.5px] cursor-pointer border-0 border-b-[2.5px] bg-transparent px-3 pb-2.5 pt-1 text-[13px] font-semibold transition-colors first:pl-0 md:px-4 md:text-sm",
                  tab === t ? "border-brand-600 text-brand-600" : "border-transparent text-ink-400",
                ].join(" ")}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {tab === "Overview" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-col items-center justify-center gap-1 p-4 text-center">
                <CalendarClock size={18} className="text-brand-600" />
                <p className="text-lg font-extrabold text-ink-900">{bookingsLoading ? "—" : upcomingCount}</p>
                <p className="text-[11px] font-semibold text-ink-400">Upcoming bookings</p>
              </Card>
              <Card className="flex flex-col items-center justify-center gap-1 p-4 text-center">
                <Heart size={18} className="text-red-500" />
                <p className="text-lg font-extrabold text-ink-900">{favoritesLoading ? "—" : favorites.length}</p>
                <p className="text-[11px] font-semibold text-ink-400">Saved merchants</p>
              </Card>
            </div>

            {/* Account details */}
            <Card className="p-4 md:p-6">
              <p className="mb-3 text-[13px] font-bold text-ink-900">Account Details</p>
              <div className="mb-3 flex flex-col gap-2.5">
                <Row label="Email" value={user.email} />
              </div>
              <TextField icon={<User size={14} />} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />

              {error && <p className="mt-3 text-sm font-semibold text-red-500">{error}</p>}
              {saved && !error && <p className="mt-3 text-sm font-semibold text-emerald-600">Profile updated.</p>}

              <PrimaryButton fullWidth className="mt-4" onClick={handleSave} disabled={saving || name.trim().length === 0}>
                {saving ? "Saving…" : "Save changes"}
              </PrimaryButton>
            </Card>
          </>
        )}

        {tab === "Saved Merchants" && (
          <Card className="p-4 md:p-6">
            {favoritesLoading && <LoadingState label="Loading your saved merchants…" />}
            {!favoritesLoading && favorites.length === 0 && (
              <p className="py-4 text-center text-[13px] text-ink-400">
                You haven't saved any merchants yet. Tap the heart icon on a merchant to save it here.
              </p>
            )}
            {!favoritesLoading && favorites.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {favorites.map(({ merchant }) => (
                  <div
                    key={merchant.id}
                    className="flex items-center gap-3 rounded-xl border border-ink-100 p-2.5"
                  >
                    <Link to={`/merchants/${merchant.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        style={
                          merchant.bannerUrl
                            ? { backgroundImage: `url(${merchant.bannerUrl})` }
                            : gradientStyle(merchant.gradient)
                        }
                        className="h-11 w-11 shrink-0 rounded-lg bg-cover bg-center"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-ink-900">{merchant.name}</p>
                        <p className="truncate text-[11px] text-ink-400">{merchant.category}</p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleLike(merchant.id)}
                      aria-label="Remove from favourites"
                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-400 hover:text-red-500"
                    >
                      <Heart size={16} fill="#ef4444" className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {tab === "Bookings" && (
          <Card className="p-4 md:p-6">
            {bookingsLoading && <LoadingState label="Loading your bookings…" />}
            {!bookingsLoading && (bookings ?? []).length === 0 && (
              <p className="py-4 text-center text-[13px] text-ink-400">You have no bookings yet.</p>
            )}
            {!bookingsLoading && (bookings ?? []).length > 0 && (
              <div className="flex flex-col gap-2.5">
                {(bookings ?? []).map((booking) => {
                  const content = (
                    <>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-ink-900">
                          {booking.merchantName ?? booking.bookingRef}
                        </p>
                        <p className="truncate text-[11px] text-ink-500">{booking.bookingRef}</p>
                        <p className="text-[11px] text-ink-400">{formatBookingDate(booking.startTime)}</p>
                        {booking.statusRemarks && (
                          <p className="mt-0.5 truncate text-[11px] text-ink-400" title={booking.statusRemarks}>
                            {booking.statusRemarks}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusPill status={booking.status} />
                        <span className="text-[12px] font-bold text-ink-900">
                          {formatCurrency(booking.totalAmount)}
                        </span>
                      </div>
                    </>
                  );
                  return booking.tenantSlug ? (
                    <Link
                      key={booking.id}
                      to={`/merchants/${booking.tenantSlug}/booking/${booking.bookingRef}`}
                      className="flex items-center justify-between rounded-xl border border-ink-100 p-2.5 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={booking.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-2.5">
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {tab === "Security" && (
          <>
            <Card className="p-4 md:p-6">
              <div className="mb-3 flex items-center gap-2">
                <Shield size={16} className="text-ink-400" />
                <p className="text-[13px] font-bold text-ink-900">Password</p>
              </div>

              <button
                type="button"
                onClick={() => void manageAccount()}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-0 bg-transparent py-2 text-left text-[13px] font-semibold text-ink-700"
              >
                <KeyRound size={16} className="text-ink-400" />
                Manage password and sign-in settings
              </button>
            </Card>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-[1.5px] border-ink-200 bg-white py-3.5 text-sm font-bold text-red-500"
            >
              <LogOut size={16} />
              Log out
            </button>
          </>
        )}
      </div>

      <Footer />
    </PageContainer>
  );
}
