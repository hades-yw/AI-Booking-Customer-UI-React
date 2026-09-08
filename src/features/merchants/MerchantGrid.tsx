import type { Merchant } from "../../types";
import { MerchantCard } from "./MerchantCard";

interface MerchantGridProps {
  merchants: Merchant[];
  likedIds: Record<string, boolean>;
  onToggleLike: (id: string) => void;
}

export function MerchantGrid({ merchants, likedIds, onToggleLike }: MerchantGridProps) {
  if (merchants.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-ink-400">
        No merchants match your search. Try a different category or keyword.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {merchants.map((m) => (
        <MerchantCard key={m.id} merchant={m} liked={!!likedIds[m.id]} onToggleLike={onToggleLike} />
      ))}
    </div>
  );
}
