import { Heart, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { gradientStyle, formatCurrency } from "../../lib/style";
import type { Merchant } from "../../types";

interface MerchantCardProps {
  merchant: Merchant;
  liked: boolean;
  onToggleLike: (id: string) => void;
}

export function MerchantCard({ merchant, liked, onToggleLike }: MerchantCardProps) {
  return (
    <Link
      to={`/merchants/${merchant.id}`}
      className="block overflow-hidden rounded-[20px] border border-ink-100 bg-white text-left shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
    >
      <div
        style={merchant.bannerUrl ? { backgroundImage: `url(${merchant.bannerUrl})` } : gradientStyle(merchant.gradient)}
        className="relative flex h-40 items-end bg-cover bg-center p-3 md:h-48"
      >
        <span
          style={{ backgroundColor: merchant.tagColor, color: merchant.tagText }}
          className="rounded-full px-2.5 py-[3px] text-[11px] font-bold"
        >
          {merchant.tag}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onToggleLike(merchant.id);
          }}
          aria-label={liked ? "Remove from favourites" : "Add to favourites"}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 cursor-pointer"
        >
          <Heart size={14} className={liked ? "text-red-500" : "text-ink-500"} fill={liked ? "#ef4444" : "none"} />
        </button>
      </div>
      <div className="px-4 pb-3.5 pt-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[15px] font-bold text-ink-900">{merchant.name}</p>
            <p className="m-0 mt-0.5 text-[11px] font-semibold text-brand-500">{merchant.category}</p>
          </div>
          {merchant.priceFrom > 0 && (
            <p className="text-[13px] font-bold text-ink-900">From {formatCurrency(merchant.priceFrom)}</p>
          )}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-amber-400" fill="#fbbf24" />
            <span className="text-xs font-bold text-ink-900">{merchant.rating}</span>
            <span className="text-xs text-ink-400">({merchant.reviews})</span>
          </div>
          <div className="flex items-center gap-1 text-ink-400">
            <MapPin size={11} />
            <span className="text-[11px]">
              {merchant.location} · {merchant.distance}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
