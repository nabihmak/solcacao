/**
 * AccountTypeSelector - step 1 of registration.
 * The user picks a Retail (personal) or B2B (corporate) account.
 */
import { Building2, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const OPTIONS = [
  { type: 'Retail', icon: ShoppingBag, titleKey: 'auth.register.retailTitle', textKey: 'auth.register.retailText' },
  { type: 'B2B', icon: Building2, titleKey: 'auth.register.b2bTitle', textKey: 'auth.register.b2bText' },
];

export default function AccountTypeSelector({ onSelect }) {
  const { t } = useLanguage();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {OPTIONS.map(({ type, icon: Icon, titleKey, textKey }) => (
        <button
          key={type}
          type="button"
          onClick={() => onSelect(type)}
          className="group flex flex-col rounded-2xl border border-cocoa-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gold-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gold-400"
        >
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cocoa-900 text-gold-400">
            <Icon size={22} />
          </span>
          <span className="font-serif text-xl font-semibold text-cocoa-900">{t(titleKey)}</span>
          <span className="mt-2 flex-1 text-sm text-cocoa-600">{t(textKey)}</span>
          <span className="mt-5 text-sm font-semibold text-gold-700 group-hover:underline">
            {t('auth.register.select')} →
          </span>
        </button>
      ))}
    </div>
  );
}
