/**
 * RegisterPage (/:lang/register) - two-step registration.
 *   Step 1: choose Retail or Corporate account
 *   Step 2: fill in the matching form
 * Tip: link to /:lang/register?type=b2b to open the corporate form directly.
 */
import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import AccountTypeSelector from '../components/auth/AccountTypeSelector';
import RegisterForm from '../components/auth/RegisterForm';
import usePageTitle from '../hooks/usePageTitle';

export default function RegisterPage() {
  const { user, openAuthModal } = useAuth();
  const { t, localePath } = useLanguage();
  const [searchParams] = useSearchParams();

  const initialType = { b2b: 'B2B', retail: 'Retail' }[searchParams.get('type')] || null;
  const [accountType, setAccountType] = useState(initialType);
  usePageTitle(t('auth.register.title'));

  // Already logged in (or just registered) -> go to the account page
  if (user) return <Navigate to={localePath('/account')} replace />;

  const isB2B = accountType === 'B2B';

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold sm:text-4xl">
        {accountType ? t(isB2B ? 'auth.register.b2bTitle' : 'auth.register.retailTitle') : t('auth.register.title')}
      </h1>
      <p className="mt-2 text-cocoa-600">
        {accountType ? t(isB2B ? 'auth.register.b2bText' : 'auth.register.retailText') : t('auth.register.subtitle')}
      </p>

      <div className="mt-8">
        {accountType ? (
          <div className="rounded-2xl border border-cocoa-200 bg-white p-5 shadow-sm sm:p-8">
            <button
              type="button"
              onClick={() => setAccountType(null)}
              className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-cocoa-500 hover:text-cocoa-800"
            >
              <ArrowLeft size={16} /> {t('auth.register.changeType')}
            </button>
            {/* key resets the form when the account type changes */}
            <RegisterForm key={accountType} accountType={accountType} />
          </div>
        ) : (
          <AccountTypeSelector onSelect={setAccountType} />
        )}
      </div>

      <p className="mt-8 text-sm text-cocoa-600">
        {t('auth.register.haveAccount')}{' '}
        <button type="button" onClick={openAuthModal} className="font-semibold text-gold-700 hover:underline">
          {t('auth.login.submit')}
        </button>
      </p>
    </section>
  );
}
