import { LogIn, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_LINKS = [{ label: "Explore", to: "/" }];

/** Global site header shown at the top of every page: brand, primary nav, and account entry. */
export function SiteHeader() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-ink-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-4 px-4 py-3 md:px-8 lg:px-12">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-brand-600 to-brand-500 text-sm font-black text-white">
            B
          </span>
          <span className="text-[15px] font-extrabold text-ink-900">BookLocal</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={[
                  "rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors",
                  active ? "text-brand-600" : "text-ink-500 hover:text-ink-900",
                ].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {user ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-full border border-ink-200 py-1 pl-1 pr-3 hover:bg-ink-50"
              aria-label="My profile"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-[12px] font-extrabold text-brand-700">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="hidden text-[13px] font-semibold text-ink-700 sm:inline">{user.name}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-full bg-brand-600 px-3.5 py-1.5 text-[13px] font-bold text-white hover:bg-brand-700"
            >
              <User size={14} className="sm:hidden" />
              <LogIn size={14} className="hidden sm:block" />
              <span>Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
