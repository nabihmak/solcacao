import SupportForm from '../components/support/SupportForm';
import { useLanguage } from '../i18n/LanguageContext';
import usePageTitle from '../hooks/usePageTitle';
export default function SupportPage({ type }) {
  const { t } = useLanguage();
  usePageTitle(t(`support.${type}`));
  return <div className="mx-auto max-w-3xl px-5 py-12"><h1 className="mb-6 text-4xl">{t(`support.${type}`)}</h1><SupportForm key={type} type={type} /></div>;
}
