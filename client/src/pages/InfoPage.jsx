import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import usePageTitle from '../hooks/usePageTitle';
export default function InfoPage({ type }) {
  const { t, localePath } = useLanguage();
  usePageTitle(t(`support.${type}`));
  return <article className="mx-auto max-w-3xl px-5 py-12"><h1 className="mb-8 text-4xl">{t(`support.${type}`)}</h1>{type === 'about' ? <p className="text-lg leading-8">{t('support.aboutText')}</p> : <div className="space-y-4">{[1,2,3].map(n => <details key={n} className="rounded-lg border border-cocoa-300 bg-white p-5"><summary className="cursor-pointer font-semibold">{t(`support.q${n}`)}</summary><p className="mt-4 leading-7">{t(`support.a${n}`)}</p></details>)}</div>}<Link to={localePath('/contact')} className="mt-8 inline-block font-semibold underline">{t('support.contact')}</Link></article>;
}
