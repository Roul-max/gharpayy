import { useMemo } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { getPageKind } from '../utils/pageKind';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const location = useLocation();
  const { theme, ready, toggleTheme } = useTheme();

  const pageKind = useMemo(() => getPageKind(location.pathname), [location.pathname]);

  if (!ready) return null;

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle theme-toggle--${pageKind} inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:scale-[1.02] ${className}`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      type="button"
    >
      <span className="theme-toggle__icon flex h-7 w-7 items-center justify-center rounded-full">
        {theme === 'dark' ? <SunMedium className="h-4 w-4 text-amber-300" /> : <MoonStar className="h-4 w-4 text-cyan-400" />}
      </span>
      <span className="hidden sm:inline">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
    </button>
  );
}
