/**
 * Drawer - a panel that slides in from the side of the screen (Student 3).
 * Used for the shopping cart (right) and the mobile catalog filters (left);
 * any team member can reuse it.
 *
 * Accessibility, following the same rules as AuthModal and MobileMenu:
 *  - role="dialog" + aria-modal, named by its title
 *  - focus moves to the close button on open and returns to the opener on close
 *  - Tab / Shift+Tab stay inside, Esc and a click on the dark background close it
 *  - when closed it is "invisible", so nothing inside can be reached with Tab
 */
import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])';

export default function Drawer({ open, onClose, side = 'right', title, closeLabel, footer, children }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const openedFrom = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // the page behind does not scroll
    closeRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const items = panelRef.current.querySelectorAll(FOCUSABLE);
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (openedFrom && openedFrom.isConnected) openedFrom.focus();
      else document.getElementById('main')?.focus();
    };
  }, [open, onClose]);

  const hiddenPosition = side === 'right' ? 'translate-x-full' : '-translate-x-full';

  return (
    <div
      className={`fixed inset-0 z-[60] ${open ? 'visible' : 'invisible'}`}
      // Opening: visible at once. Closing: stay visible until the slide-out has finished.
      style={{ transition: open ? 'visibility 0s' : 'visibility 0s linear 300ms' }}
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 bg-cocoa-950/60 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`absolute inset-y-0 ${side === 'right' ? 'right-0' : 'left-0'} flex w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 motion-reduce:transition-none ${
          open ? 'translate-x-0' : hiddenPosition
        }`}
      >
        <div className="flex items-center justify-between border-b border-cocoa-200 px-5 py-4">
          <h2 id={titleId} className="text-xl font-semibold text-cocoa-900">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="rounded-full p-2 text-cocoa-700 hover:bg-cocoa-100 hover:text-cocoa-900"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-cocoa-200 bg-cocoa-50 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
