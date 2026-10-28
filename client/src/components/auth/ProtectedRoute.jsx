/**
 * ProtectedRoute - shows its children only to logged-in users.
 * Optional accountType="B2B" limits a page to corporate partners
 * (Student 4 can wrap the B2B wizard with it).
 *
 * Example in App.jsx:
 *   <Route path="account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
 */
import { Loader2, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import Button from '../ui/Button';
import usePageTitle from '../../hooks/usePageTitle';

export default function ProtectedRoute({ accountType, children }) {
  const { user, status, openAuthModal } = useAuth();
  const { t } = useLanguage();

  // Still checking a saved token
  if (status === 'loading') {
    return (
      <div className="flex justify-center py-24 text-cocoa-500" role="status">
        <Loader2 className="animate-spin" aria-hidden="true" />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }

  // Not logged in -> ask the user to sign in (the page appears after login)
  if (!user) {
    return (
      <Notice title={t('auth.protected.title')} text={t('auth.protected.text')}>
        <Button onClick={openAuthModal}>{t('nav.signIn')}</Button>
      </Notice>
    );
  }

  // Logged in, but wrong account type (e.g. Retail user on a B2B-only page)
  if (accountType && user.accountType !== accountType) {
    return <Notice title={t('auth.protected.partnerTitle')} text={t('auth.protected.partnerText')} />;
  }

  return children;
}

function Notice({ title, text, children }) {
  usePageTitle(title);
  return (
    <section className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cocoa-100 text-cocoa-700">
        <Lock size={22} />
      </div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mb-6 mt-2 text-cocoa-600">{text}</p>
      {children}
    </section>
  );
}
