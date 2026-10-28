import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';

const FOOTER_LINKS = [
  { path: '', key: 'nav.home' },
  { path: '/catalog', key: 'nav.catalog' },
  { path: '/b2b', key: 'nav.b2b' },
  { path: '/contact', key: 'nav.contact' },
];

export default function Footer() {
  const { lang, t, localePath } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-cocoa-950 text-cocoa-200">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-3">

        {/* Brand */}
        <div>
          <Link
            to={localePath()}
            className="font-serif text-2xl font-semibold text-cream
              focus-visible:outline focus-visible:outline-2
              focus-visible:outline-gold-400"
          >
            Sol<span className="text-gold-500">Cacao</span>
          </Link>

          <p className="mt-3 max-w-xs text-sm leading-6">
            {t('footer.tagline')}
          </p>
        </div>

        {/* Quick Navigation */}
        <nav
          aria-label={
            lang === 'es'
              ? 'Enlaces del pie de página'
              : 'Footer navigation'
          }
        >
          <h2 className="mb-4 font-semibold text-cream">
            {lang === 'es' ? 'Enlaces rápidos' : 'Quick Links'}
          </h2>

          <ul className="space-y-3">
            {FOOTER_LINKS.map((link) => (
              <li key={link.key}>
                <Link
                  to={localePath(link.path)}
                  className="text-sm transition-colors
                    hover:text-gold-400
                    focus-visible:outline focus-visible:outline-2
                    focus-visible:outline-gold-400"
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Copyright */}
        <div className="md:text-right">
          <p className="text-sm leading-6">
            © {year} SolCacao.
          </p>

          <p className="mt-2 text-sm">
            {t('footer.rights')}
          </p>
        </div>
      </div>

      <div className="border-t border-cocoa-700">
        <div className="mx-auto max-w-6xl px-5 py-4 text-center text-xs text-cocoa-200">
          SolCacao © {year}
        </div>
      </div>
    </footer>
  );
}