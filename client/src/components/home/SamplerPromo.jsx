/**
 * SamplerPromo - homepage section that promotes the sampler builder.
 * (Phase 2 demo feedback: "make the sampler visible on the homepage".)
 *
 * Shows the six flavors from Student 5's sampler form and links to /:lang/sampler.
 * Text comes from the "homeSections.sampler" keys in the EN/ES dictionaries.
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { FLAVORS } from '../../utils/support';

const STEPS = ['step1', 'step2', 'step3'];

export default function SamplerPromo() {
  const { t, localePath } = useLanguage();
  const tr = (key) => t(`homeSections.sampler.${key}`);

  return (
    <section aria-labelledby="sampler-promo-title" className="bg-cocoa-900 text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-gold-300">{tr('eyebrow')}</p>
          <h2 id="sampler-promo-title" className="mt-2 font-serif text-3xl text-cream md:text-4xl">
            {tr('title')}
          </h2>
          <p className="mt-4 text-cocoa-100">{tr('text')}</p>

          <ol className="mt-6 space-y-2">
            {STEPS.map((step, index) => (
              <li key={step} className="flex items-start gap-3 text-cocoa-100">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-cocoa-950"
                >
                  {index + 1}
                </span>
                <span>{tr(step)}</span>
              </li>
            ))}
          </ol>

          <Link
            to={localePath('/sampler')}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-cocoa-950 transition-colors hover:bg-gold-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-cocoa-900"
          >
            {tr('cta')}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-2xl bg-cocoa-800 p-6 ring-1 ring-cocoa-700">
          <h3 className="font-serif text-xl text-cream">{tr('flavorsTitle')}</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {FLAVORS.map((flavor) => (
              <li key={flavor} className="flex items-center gap-2 rounded-lg bg-cocoa-900/60 px-3 py-2 text-sm text-cocoa-100">
                <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-gold-300" />
                {t(`support.${flavor}`)}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-cocoa-200">{tr('note')}</p>
        </div>
      </div>
    </section>
  );
}
