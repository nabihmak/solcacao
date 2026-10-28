/**
 * AccountButton - the user entry point shown in the navigation bar.
 *  - Logged out: "Sign in" button that opens the AuthModal
 *  - Logged in : link to the account page with the user's first name
 * Student 2 can place this component inside the final Navbar.
 */
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';

export default function AccountButton({ onNavigate }) {
  const { user, status, openAuthModal } = useAuth();
  const { t, localePath } = useLanguage();

  const baseClass =
    'inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-cocoa-100 hover:text-gold-300 sm:px-3';

  // While a saved session is being checked, keep the space but show nothing
  if (status === 'loading') return <span className="inline-block h-8 w-8" aria-hidden="true" />;

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          openAuthModal();
        }}
        className={baseClass}
      >
        <User size={18} aria-hidden="true" />
        {/* Icon only on small phones; the text stays available to screen readers */}
        <span className="sr-only sm:not-sr-only">{t('nav.signIn')}</span>
      </button>
    );
  }

  return (
    <Link to={localePath('/account')} onClick={onNavigate} className={baseClass} title={t('nav.account')}>
      <User size={18} aria-hidden="true" />
      <span className="sr-only sm:not-sr-only sm:max-w-[8rem] sm:truncate">{user.name.split(' ')[0]}</span>
    </Link>
  );
}
