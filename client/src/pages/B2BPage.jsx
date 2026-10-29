/**
 * B2BPage (/:lang/b2b) - wholesale and corporate services showcase (Student 4).
 *
 * Public page: anyone can read about the B2B services. The quote wizard itself
 * lives on /:lang/b2b/quote and is limited to corporate (B2B) partners.
 *  - corporate partner -> "Request a custom quote" opens the wizard
 *  - anyone else       -> "Create a corporate account" (/register?type=b2b) or sign in
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Gift, Hotel, PartyPopper, Shapes, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import usePageTitle from '../hooks/usePageTitle';

const SERVICES = [
  { key: 'molds', icon: Shapes },
  { key: 'packaging', icon: Gift },
  { key: 'whiteLabel', icon: Tag },
];

const AUDIENCES = [
  { key: 'wholesale', icon: Building2 },
  { key: 'hotels', icon: Hotel },
  { key: 'events', icon: PartyPopper },
];

const STEPS = ['profile', 'files', 'packaging', 'review'];

const primaryLink =
  'inline-flex items-center justify-center gap-2 rounded-full bg-gold-500 px-6 py-3 text-sm font-semibold text-cocoa-950 transition-colors hover:bg-gold-400';
const secondaryLink =
  'inline-flex items-center justify-center gap-2 rounded-full border border-cocoa-500 px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-cocoa-800';

export default function B2BPage() {
  const { user, isPartner, openAuthModal } = useAuth();
  const { t, localePath } = useLanguage();
  usePageTitle(t('pages.b2b.title'));

  // The main call to action depends on who is looking at the page
  const callToAction = isPartner ? (
    <Link to={localePath('/b2b/quote')} className={primaryLink}>
      {t('b2b.cta.quote')} <ArrowRight size={16} aria-hidden="true" />
    </Link>
  ) : (
    <>
      <Link to={localePath('/register?type=b2b')} className={primaryLink}>
        {t('b2b.cta.register')} <ArrowRight size={16} aria-hidden="true" />
      </Link>
      {!user && (
        <button type="button" onClick={openAuthModal} className={secondaryLink}>
          {t('b2b.cta.signIn')}
        </button>
      )}
    </>
  );

  return (
    <>
      {/* Hero */}
      <section className="on-dark relative overflow-hidden bg-cocoa-950 text-cream">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full border border-cocoa-700 shadow-[0_0_0_60px_rgba(87,57,35,0.25)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">{t('b2b.hero.eyebrow')}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">{t('pages.b2b.title')}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-cocoa-100">{t('b2b.hero.text')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">{callToAction}</div>
          {user && !isPartner && <p className="mt-4 text-sm text-cocoa-200">{t('b2b.cta.retailNote')}</p>}
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20" aria-labelledby="services-heading">
        <h2 id="services-heading" className="text-2xl font-semibold text-cocoa-900 sm:text-3xl">
          {t('b2b.services.title')}
        </h2>
        <p className="mt-3 max-w-2xl text-cocoa-700">{t('b2b.services.intro')}</p>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {SERVICES.map(({ key, icon: Icon }) => (
            <li key={key} className="rounded-2xl border border-cocoa-200 bg-white p-6 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cocoa-900 text-gold-400">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-cocoa-900">{t(`b2b.services.${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-6 text-cocoa-700">{t(`b2b.services.${key}.text`)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Who it is for */}
      <section className="bg-cocoa-100/60" aria-labelledby="audience-heading">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <h2 id="audience-heading" className="text-2xl font-semibold text-cocoa-900">
            {t('b2b.audience.title')}
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {AUDIENCES.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-start gap-3 rounded-xl bg-white p-5">
                <Icon size={22} className="mt-0.5 shrink-0 text-gold-700" aria-hidden="true" />
                <span>
                  <span className="block font-semibold text-cocoa-900">{t(`b2b.audience.${key}.title`)}</span>
                  <span className="mt-1 block text-sm text-cocoa-700">{t(`b2b.audience.${key}.text`)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How the quote works */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20" aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-2xl font-semibold text-cocoa-900 sm:text-3xl">
          {t('b2b.how.title')}
        </h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((key, index) => (
            <li key={key} className="rounded-xl border border-cocoa-200 bg-white p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-sm font-bold text-cocoa-950">
                {index + 1}
              </span>
              <h3 className="mt-3 font-semibold text-cocoa-900">{t(`b2b.wizard.steps.${key}`)}</h3>
              <p className="mt-1 text-sm text-cocoa-700">{t(`b2b.how.${key}`)}</p>
            </li>
          ))}
        </ol>
        <div className="on-dark mt-10 flex flex-col items-start gap-4 rounded-2xl bg-cocoa-900 p-6 text-cream sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="max-w-xl text-lg font-semibold">{t('b2b.how.ready')}</p>
          <div className="flex flex-col gap-3 sm:flex-row">{callToAction}</div>
        </div>
      </section>
    </>
  );
}
