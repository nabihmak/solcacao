/**
 * Navbar - basic sticky navigation shell (Phase 1).
 * Student 2 owns the final navigation bar (search trigger, cart count,
 * animated mobile drawer). This version provides the shared links,
 * language toggle and a simple mobile menu so every page can be reached.
 */
import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import AccountButton from '../auth/AccountButton';

const NAV_LINKS = [
  { path: '', key: 'nav.home' },
  { path: '/catalog', key: 'nav.catalog' },
  { path: '/b2b', key: 'nav.b2b' },
  { path: '/contact', key: 'nav.contact' },
];

export default function Navbar() {
  const { lang, t, localePath } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Switch /en/... <-> /es/... while staying on the same page
  function toggleLanguage() {
    const nextLang = lang === 'en' ? 'es' : 'en';
    const rest = location.pathname.replace(/^\/(en|es)/, '');
    navigate(`/${nextLang}${rest}${location.search}`);
  }

  const linkClass = ({ isActive }) =>
    `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'text-gold-400' : 'text-cocoa-100 hover:text-gold-300'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-cocoa-900/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to={localePath()} className="font-serif text-xl font-semibold tracking-wide text-cream">
          Sol<span className="text-gold-500">Cacao</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.key}>
              <NavLink to={localePath(link.path)} end={link.path === ''} className={linkClass}>
                {t(link.key)}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {/* Student 1: sign-in / account entry point */}
          <AccountButton onNavigate={() => setMenuOpen(false)} />

          <button
            type="button"
            onClick={toggleLanguage}
            title={t('nav.switchLanguage')}
            className="rounded-full border border-gold-500/60 px-3 py-1 text-xs font-semibold uppercase text-gold-400 hover:bg-gold-500 hover:text-cocoa-950"
          >
            {lang === 'en' ? 'ES' : 'EN'}
          </button>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            className="rounded-md p-2 text-cream md:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile links */}
      {menuOpen && (
        <ul className="space-y-1 border-t border-cocoa-700 px-4 pb-4 pt-2 md:hidden">
          {NAV_LINKS.map((link) => (
            <li key={link.key}>
              <NavLink
                to={localePath(link.path)}
                end={link.path === ''}
                className={linkClass}
                onClick={() => setMenuOpen(false)}
              >
                {t(link.key)}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
