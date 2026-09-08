import { MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../api";
import { Footer } from "../components/layout/Footer";
import { PageContainer } from "../components/layout/PageContainer";
import { LoadingState, ErrorState } from "../components/ui/AsyncState";
import { CategoryFilter } from "../features/merchants/CategoryFilter";
import { MerchantGrid } from "../features/merchants/MerchantGrid";
import { useFavorites } from "../context/FavoritesContext";
import { useAsync } from "../lib/useAsync";

export function LandingPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const { likedIds, toggleLike } = useFavorites();

  const { data: categories } = useAsync(() => api.getCategories(), []);
  const {
    data: merchants,
    loading,
    error,
  } = useAsync(() => api.getMerchants({ category: activeCategory, search }), [activeCategory, search]);

  const resultsLabel = useMemo(() => {
    if (!merchants) return "";
    return `${merchants.length} merchant${merchants.length === 1 ? "" : "s"} near you`;
  }, [merchants]);

  return (
    <PageContainer>
      <header className="w-full bg-linear-to-br from-brand-600 to-brand-500 px-4 pb-6 pt-8 md:px-8 md:pb-8 md:pt-12 lg:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="mb-4 flex items-center gap-1">
            <MapPin size={13} className="text-white" />
            <span className="text-sm font-bold text-white">Kuala Lumpur, MY</span>
          </div>
          <p className="mb-3.5 text-[22px] font-extrabold leading-snug text-white md:text-3xl">
            What are you
            <br />
            booking today?
          </p>
          <div className="relative md:max-w-xl">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services or merchants…"
              className="w-full rounded-2xl border-0 bg-white py-3 pl-9 pr-4 text-[13px] text-ink-700 shadow-[0_2px_8px_rgba(0,0,0,0.1)] outline-none"
            />
          </div>
        </div>
      </header>

      <CategoryFilter categories={categories ?? []} active={activeCategory} onChange={setActiveCategory} />

      <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 pt-2 md:px-8 lg:px-12">
        {!loading && merchants && (
          <p className="mb-3 text-[11px] font-semibold text-ink-400">{resultsLabel}</p>
        )}
        {loading && <LoadingState label="Finding merchants near you…" />}
        {error && <ErrorState message="Couldn't load merchants." />}
        {!loading && !error && merchants && (
          <MerchantGrid merchants={merchants} likedIds={likedIds} onToggleLike={toggleLike} />
        )}
      </div>

      <Footer />
    </PageContainer>
  );
}
