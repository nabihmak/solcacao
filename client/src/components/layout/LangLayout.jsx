/**
 * LangLayout - wraps every page with the Navbar and Footer and keeps the
 * language in sync with the URL prefix (/en/... or /es/...).
 */
import { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { SUPPORTED_LANGUAGES, useLanguage } from '../../i18n/LanguageContext';
import Navbar from './Navbar';
import Footer from './Footer';
import AuthModal from '../auth/AuthModal';

export default function LangLayout() {
  const { lang } = useParams();
  const { setLang, t } = useLanguage();
  const isSupported = SUPPORTED_LANGUAGES.includes(lang);

  // When the URL language changes, update the global language state
  useEffect(() => {
    if (isSupported) {
      setLang(lang);
      document.documentElement.lang = lang;
    }
  }, [lang, isSupported, setLang]);

  // Unknown prefix such as /fr -> go to the English home page
  if (!isSupported) return <Navigate to="/en" replace />;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Accessibility: lets keyboard users jump past the navigation (WCAG 2.4.1) */}
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-gold-500 px-4 py-2 font-semibold text-cocoa-950 focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        {t('nav.skip')}
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <Footer />
      {/* Sign-in dialog, opened from anywhere with useAuth().openAuthModal() */}
      <AuthModal />
    </div>
  );
}
