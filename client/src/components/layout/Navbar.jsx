import { useCallback, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import MobileMenu from './MobileMenu';
import CartIndicator from '../cart/CartIndicator';

const NAV_LINKS = [
  { path: '', key: 'nav.home' },
  { path: '/catalog', key: 'nav.catalog' },
  { path: '/b2b', key: 'nav.b2b' },
  { path: '/contact', key: 'nav.contact' },
];

export default function Navbar({ cartCount = 0 }) {
  const { lang, t, localePath } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const searchButtonRef = useRef(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  function toggleLanguage() {
    const nextLang = lang === 'en' ? 'es' : 'en';
    const rest = location.pathname.replace(/^\/(en|es)/, '');

    closeMenu();
    setSearchOpen(false);

    navigate(
      `/${nextLang}${rest}${location.search}${location.hash}`
    );
  }

  function handleSearch(event) {
    event.preventDefault();

    const query = searchTerm.trim();

    if (!query) return;

    navigate(
      `${localePath('/catalog')}?q=${encodeURIComponent(query)}`
    );

    setSearchOpen(false);
    closeMenu();
  }

  const linkClass = ({ isActive }) =>
    `block rounded-md px-3 py-2 text-sm font-medium
    transition-colors focus-visible:outline
    focus-visible:outline-2 focus-visible:outline-gold-400
    ${isActive
      ? 'text-gold-400'
      : 'text-cocoa-100 hover:text-gold-300'}`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-cocoa-900/95 backdrop-blur">
        <nav
          aria-label={
            lang === 'es'
              ? 'Navegación principal'
              : 'Main navigation'
          }
          className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4"
        >
          {/* SolCacao Logo */}
          <Link
            to={localePath()}
            onClick={() => {
              closeMenu();
              setSearchOpen(false);
            }}
            className="font-serif text-xl font-semibold tracking-wide text-cream"
          >
            Sol<span className="text-gold-500">Cacao</span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.key}>
                <NavLink
                  to={localePath(link.path)}
                  end={link.path === ''}
                  className={linkClass}
                  onClick={() => setSearchOpen(false)}
                >
                  {t(link.key)}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Right-side controls */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Search Button */}
            <button
              ref={searchButtonRef}
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label={
                searchOpen
                  ? t('nav.closeSearch')
                  : t('nav.openSearch')
              }
              aria-expanded={searchOpen}
              aria-controls="site-search"
              className="rounded-md p-2 text-cream
                hover:text-gold-400
                focus-visible:outline
                focus-visible:outline-2
                focus-visible:outline-gold-400"
            >
              <Search size={22} />
            </button>

            {/* Shopping Cart Indicator */}
            <CartIndicator  count={cartCount} />

            {/* English / Spanish Switch */}
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={t('nav.switchLanguage')}
              className="rounded-full border border-gold-500/60
                px-3 py-1 text-xs font-semibold uppercase
                text-gold-400 hover:bg-gold-500
                hover:text-cocoa-950
                focus-visible:outline
                focus-visible:outline-2"
            >
              {lang === 'en' ? 'ES' : 'EN'}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setMenuOpen(true);
              }}
              aria-label={t('nav.openMenu')}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              className="rounded-md p-2 text-cream
                focus-visible:outline
                focus-visible:outline-2
                focus-visible:outline-gold-400
                md:hidden"
            >
              <Menu size={24} />
            </button>
          </div>
        </nav>

        {/* Search Bar */}
        {searchOpen && (
          <form
            id="site-search"
            role="search"
            onSubmit={handleSearch}
            className="border-t border-cocoa-700 bg-cocoa-900 px-4 py-3"
          >
            <div className="mx-auto flex max-w-3xl gap-2">
              <input
                autoFocus
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setSearchOpen(false);
                    searchButtonRef.current?.focus();
                  }
                }}
                placeholder={t('nav.searchPlaceholder')}
                aria-label={t('nav.searchPlaceholder')}
                className="min-w-0 flex-1 rounded-md
                  bg-cream px-3 py-2 text-cocoa-950
                  focus-visible:outline
                  focus-visible:outline-2
                  focus-visible:outline-gold-400"
              />

              <button
                type="submit"
                className="rounded-md bg-gold-500
                  px-4 py-2 font-semibold text-cocoa-950
                  hover:bg-gold-400"
              >
                {t('nav.submitSearch')}
              </button>
            </div>
          </form>
        )}
      </header>

      {/* Mobile Slide-out Drawer */}
      <MobileMenu
        open={menuOpen}
        onClose={closeMenu}
        navigation={NAV_LINKS}
      />
    </>
  );
}