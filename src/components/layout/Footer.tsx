const LINKS = ["About", "Contact", "Terms", "Privacy"];

/** Static footer shown at the bottom of every page's normal content flow. */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-8 border-t border-ink-100 bg-white px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center gap-3 text-center">
        <span className="text-[13px] font-extrabold text-ink-900">BookLocal</span>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
          {LINKS.map((label) => (
            <a key={label} href="#" className="text-xs text-ink-500 hover:text-ink-700">
              {label}
            </a>
          ))}
        </nav>
        <p className="text-[11px] text-ink-400">&copy; {year} BookLocal. All rights reserved.</p>
      </div>
    </footer>
  );
}
