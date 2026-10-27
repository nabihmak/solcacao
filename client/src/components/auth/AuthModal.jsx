/**
 * AuthModal - sign-in dialog that can be opened from anywhere with
 * useAuth().openAuthModal(). Closes with the X button, the Esc key
 * or a click on the dark background.
 *
 * Keyboard accessibility (WCAG 2.1.2 and 2.4.3):
 *  - focus moves into the dialog when it opens (the email field)
 *  - Tab and Shift+Tab stay inside the dialog while it is open
 *  - when it closes, focus goes back to the button that opened it
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import LoginForm from './LoginForm';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  const { t, localePath } = useLanguage();
  const navigate = useNavigate();
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isAuthModalOpen) return undefined;

    const openedFrom = document.activeElement; // remember where focus was
    dialogRef.current?.querySelector('input')?.focus(); // then move focus to the email field

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        closeAuthModal();
        return;
      }
      // Keep Tab / Shift+Tab inside the dialog
      if (event.key === 'Tab' && dialogRef.current) {
        const items = dialogRef.current.querySelectorAll(FOCUSABLE);
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
    }

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden'; // stop the page behind from scrolling

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      // Give focus back; if that button is gone (e.g. after signing in), go to the main content
      if (openedFrom && openedFrom.isConnected) openedFrom.focus();
      else document.getElementById('main')?.focus();
    };
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  function goToRegister() {
    closeAuthModal();
    navigate(localePath('/register'));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm"
      onClick={closeAuthModal}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        aria-describedby="auth-modal-subtitle"
        className="relative w-full max-w-md rounded-2xl bg-cream p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()} // clicks inside do not close the modal
      >
        <button
          type="button"
          onClick={closeAuthModal}
          aria-label={t('auth.close')}
          className="absolute right-3 top-3 rounded-full p-2 text-cocoa-600 hover:bg-cocoa-100 hover:text-cocoa-900"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <h2 id="auth-modal-title" className="text-2xl font-semibold text-cocoa-900">
          {t('auth.login.title')}
        </h2>
        <p id="auth-modal-subtitle" className="mb-6 mt-1 text-sm text-cocoa-600">
          {t('auth.login.subtitle')}
        </p>

        <LoginForm onSuccess={closeAuthModal} />

        <p className="mt-6 text-center text-sm text-cocoa-700">
          {t('auth.login.noAccount')}{' '}
          <button
            type="button"
            onClick={goToRegister}
            className="font-semibold text-gold-700 underline-offset-2 hover:underline"
          >
            {t('auth.login.createAccount')}
          </button>
        </p>
      </div>
    </div>
  );
}
