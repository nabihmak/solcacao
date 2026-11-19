/**
 * Student 2: Slide-out mobile navigation dialog.
 * - Opening moves focus to Close and locks background scrolling.
 * - Tab/Shift+Tab remain inside the drawer; Escape closes it.
 * - Cleanup restores prior focus and body overflow (including on resize).
 * - Uses a <div role="dialog"> rather than overriding <aside> semantics.
 */
import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function MobileMenu({ open, onClose, navigation }) {
  const { t, localePath } = useLanguage();
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }

      if (event.key === 'Tab') {
        const elements = panelRef.current?.querySelectorAll(
          'button:not([disabled]), a[href]'
        );

        if (!elements?.length) return;

        const first = elements[0];
        const last = elements[elements.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    function handleResize() {
      if (window.innerWidth >= 768) onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[60] md:hidden
        ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={-1}
        disabled={!open}
        aria-label={t('nav.closeMenu')}
        onClick={onClose}
        className={`absolute inset-0 w-full bg-black/60
          transition-opacity duration-300
          ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <div
        ref={panelRef}
        id="mobile-navigation"
        role="dialog"
        aria-modal={open ? 'true' : undefined}
        aria-label={t('nav.mobileNavigation')}
        className={`absolute inset-y-0 right-0 flex w-80
          max-w-[85vw] flex-col overflow-y-auto
          bg-cocoa-900 px-5 py-6 text-cream shadow-xl
          transition-transform duration-300
          motion-reduce:transition-none
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between">
          <span className="font-serif text-xl font-semibold">
            Sol<span className="text-gold-500">Cacao</span>
          </span>

          <button
            ref={closeButtonRef}
            type="button"
            tabIndex={open ? 0 : -1}
            onClick={onClose}
            aria-label={t('nav.closeMenu')}
            className="rounded-md p-2 focus-visible:outline
              focus-visible:outline-2 focus-visible:outline-gold-400"
          >
            <X size={26} />
          </button>
        </div>

        <nav
          aria-label={t('nav.navigationLinks')}
          className="mt-8 flex flex-col gap-2"
        >
          {navigation.map((link) => (
            <NavLink
              key={link.key}
              to={localePath(link.path)}
              end={link.path === ''}
              tabIndex={open ? 0 : -1}
              onClick={onClose}
              className={({ isActive }) =>
                `rounded-md px-4 py-3 text-base font-medium
                hover:bg-cocoa-700 focus-visible:outline
                focus-visible:outline-2 focus-visible:outline-gold-400
                ${isActive ? 'bg-cocoa-700 text-gold-400' : 'text-cocoa-100'}`
              }
            >
              {t(link.key)}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
