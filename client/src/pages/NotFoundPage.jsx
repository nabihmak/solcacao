/**
 * NotFoundPage - shown for any unknown path inside /en or /es.
 */
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

export default function NotFoundPage() {
  const { t, localePath } = useLanguage();

  return (
    <section className="mx-auto max-w-6xl px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold">{t('pages.notFound.title')}</h1>
      <Link
        to={localePath()}
        className="mt-6 inline-block rounded-full bg-cocoa-900 px-6 py-2 text-sm font-medium text-cream hover:bg-cocoa-700"
      >
        {t('pages.notFound.back')}
      </Link>
    </section>
  );
}
