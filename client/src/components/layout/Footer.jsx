/**
 * Footer - global footer shell (Phase 1). Student 2 owns the final version.
 */
import { useLanguage } from '../../i18n/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-cocoa-950 text-cocoa-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-serif text-lg text-cream">
          Sol<span className="text-gold-500">Cacao</span>
        </p>
        <p>{t('footer.tagline')}</p>
        <p>
          © {year} SolCacao. {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}
