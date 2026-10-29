/**
 * B2BQuotePage (/:lang/b2b/quote) - the custom quote wizard plus the partner's
 * earlier requests (Student 4).
 *
 * App.jsx wraps this page in <ProtectedRoute accountType="B2B">, so only signed-in
 * corporate partners reach it (matches "Access: Partner" for POST /api/b2b/quote).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import usePageTitle from '../hooks/usePageTitle';
import QuoteWizard from '../components/b2b/QuoteWizard';
import { fetchMyQuotes } from '../services/b2bService';

export default function B2BQuotePage() {
  const { user } = useAuth();
  const { lang, t, localePath } = useLanguage();
  usePageTitle(t('b2b.quote.title'));

  const [requests, setRequests] = useState([]);

  const loadRequests = useCallback(() => {
    fetchMyQuotes()
      .then(({ requests: list }) => setRequests(list))
      .catch(() => setRequests([])); // the list is extra information; the wizard still works
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <Link
        to={localePath('/b2b')}
        className="inline-flex items-center gap-1 text-sm font-medium text-cocoa-700 hover:text-cocoa-900"
      >
        <ChevronLeft size={16} aria-hidden="true" /> {t('b2b.quote.back')}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold text-cocoa-900 sm:text-4xl">{t('b2b.quote.title')}</h1>
      <p className="mt-3 max-w-2xl text-cocoa-700">
        {t('b2b.quote.intro', { company: user?.corporatePartner?.companyName || user?.name || '' })}
      </p>

      <div className="mt-8">
        <QuoteWizard onSubmitted={loadRequests} />
      </div>

      {requests.length > 0 && (
        <section className="mt-12" aria-labelledby="requests-heading">
          <h2 id="requests-heading" className="text-xl font-semibold text-cocoa-900">
            {t('b2b.quote.history')}
          </h2>
          <ul className="mt-4 divide-y divide-cocoa-200 rounded-xl border border-cocoa-200 bg-white">
            {requests.map((request) => (
              <li key={request._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="font-semibold text-cocoa-900">{request.reference}</span>
                <span className="text-cocoa-700">
                  {request.cacaoOrigin} · {request.cacaoPercentage}% · {request.quantity.toLocaleString(lang)}{' '}
                  {t('b2b.quote.units')}
                </span>
                <span className="rounded-full bg-cocoa-100 px-3 py-0.5 text-xs font-semibold text-cocoa-800">
                  {t(`b2b.status.${request.status}`)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
