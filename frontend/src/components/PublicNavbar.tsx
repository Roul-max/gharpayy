import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Shield, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

type NavItem = {
  to: string;
  label: string;
};

type PublicNavbarProps = {
  activePath?: string;
  ctaLabel?: string;
  ctaTo?: string;
  ctaOnClick?: () => void;
  showCta?: boolean;
  showAuth?: boolean;
  items?: NavItem[];
};

const DEFAULT_ITEMS: NavItem[] = [
  { to: '/explore', label: 'Explore' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' }
];

export default function PublicNavbar({
  activePath,
  ctaLabel = 'Capture Lead',
  ctaTo = '/capture',
  ctaOnClick,
  showCta = true,
  showAuth = true,
  items = DEFAULT_ITEMS
}: PublicNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6 lg:px-8">
      <div className="app-navbar mx-auto max-w-7xl rounded-2xl border border-white/20 bg-slate-900/65 shadow-[0_12px_50px_rgba(3,7,18,0.45)] backdrop-blur-2xl">
        <div className="flex h-16 items-center justify-between px-4 sm:px-5">
          <Link to="/" className="inline-flex items-center gap-2 text-white">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.8)]" />
            <span className="text-base font-bold tracking-tight">Gharpayy</span>
          </Link>

          <nav className="hidden items-center rounded-full border border-white/10 bg-white/5 p-1 text-sm lg:flex">
            {items.map((item) => {
              const isActive = activePath === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-full px-4 py-2 transition ${
                    isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggle />
            {showCta && (ctaOnClick ? (
              <button
                type="button"
                onClick={ctaOnClick}
                className="inline-flex items-center rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:from-cyan-300 hover:to-cyan-200"
              >
                {ctaLabel}
              </button>
            ) : (
              <Link
                to={ctaTo}
                className="inline-flex items-center rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:from-cyan-300 hover:to-cyan-200"
              >
                {ctaLabel}
              </Link>
            ))}
            {showAuth && (
              <Link
                to="/auth"
                className="group inline-flex items-center gap-2 rounded-full border border-cyan-200/40 bg-gradient-to-r from-cyan-300/25 to-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.16),0_8px_24px_rgba(34,211,238,0.2)] transition hover:scale-[1.02]"
              >
                <Shield className="h-4 w-4 transition group-hover:rotate-6" />
                CRM Login
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle className="h-10 px-2.5" />
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex rounded-xl border border-white/20 bg-white/5 p-2 text-slate-200"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="mx-auto mt-3 max-w-7xl rounded-2xl border border-white/15 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-1 text-sm">
            {items.map((item) => (
              <Link
                key={item.to}
                onClick={() => setMenuOpen(false)}
                to={item.to}
                className={`rounded-xl px-3 py-2 ${
                  activePath === item.to ? 'bg-white/10 text-white' : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {showCta && (ctaOnClick ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  ctaOnClick();
                }}
                className="rounded-xl px-3 py-2 text-left text-cyan-200 hover:bg-cyan-400/10"
              >
                {ctaLabel}
              </button>
            ) : (
              <Link onClick={() => setMenuOpen(false)} to={ctaTo} className="rounded-xl px-3 py-2 text-cyan-200 hover:bg-cyan-400/10">
                {ctaLabel}
              </Link>
            ))}
            {showAuth && (
              <Link onClick={() => setMenuOpen(false)} to="/auth" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-cyan-200 hover:bg-cyan-400/10">
                <Shield className="h-4 w-4" /> CRM Login
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
