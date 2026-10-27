/**
 * PagePlaceholder - temporary page body used by the routing shell
 * until each student replaces it with their real page.
 */
import { useLanguage } from '../../i18n/LanguageContext';

export default function PagePlaceholder({ titleKey, subtitleKey }) {
  const { t } = useLanguage();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-semibold text-cocoa-900 sm:text-4xl">{t(titleKey)}</h1>
      <p className="mt-4 max-w-2xl text-cocoa-600">{t(subtitleKey || 'common.comingSoon')}</p>
    </section>
  );
}
