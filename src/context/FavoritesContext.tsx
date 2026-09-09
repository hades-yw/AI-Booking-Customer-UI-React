import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../api";
import { useAuth } from "./AuthContext";
import type { FavoriteMerchant } from "../types";
import { useLocation, useNavigate } from "react-router-dom";

// Favorites are backed by the real /v1/customers/me/favorites API once a
// customer is logged in (see the backend's CustomerFavoriteTenant model) —
// there is no anonymous/local-only favoriting since the API requires auth.
// `likedIds` stays as a plain id->boolean map for MerchantCard/MerchantGrid,
// which only need a fast liked check per card; `favorites` carries the full
// records (with favoritedAt) for the profile dashboard's "Saved Merchants".

interface FavoritesContextValue {
  favorites: FavoriteMerchant[];
  likedIds: Record<string, boolean>;
  loading: boolean;
  toggleLike: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { authenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteMerchant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authenticated) {
      setFavorites([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .getFavorites()
      .then((favs) => {
        if (!cancelled) setFavorites(favs);
      })
      .catch(() => {
        if (!cancelled) setFavorites([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  const toggleLike = useCallback(
    (id: string) => {
      if (!authenticated) {
        navigate("/login", {
          state: { returnTo: `${location.pathname}${location.search}` },
        });
        return;
      }
      const isLiked = favorites.some((f) => f.merchant.id === id);
      if (isLiked) {
        setFavorites((prev) => prev.filter((f) => f.merchant.id !== id));
        api.removeFavorite(id).catch(() => {
          // Re-sync from the server on failure rather than trusting the optimistic removal.
          api.getFavorites().then(setFavorites).catch(() => undefined);
        });
      } else {
        api
          .addFavorite(id)
          .then((favorite) => setFavorites((prev) => [favorite, ...prev]))
          .catch(() => undefined);
      }
    },
    [authenticated, favorites, location.pathname, location.search, navigate],
  );

  const likedIds = useMemo(
    () => Object.fromEntries(favorites.map((f) => [f.merchant.id, true])),
    [favorites],
  );

  const value = useMemo(
    () => ({ favorites, likedIds, loading, toggleLike }),
    [favorites, likedIds, loading, toggleLike],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
