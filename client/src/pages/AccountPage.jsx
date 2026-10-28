/**
 * AccountPage (/:lang/account) - profile management panel (Student 1).
 * Tabs: Profile, Company (B2B only), Addresses, Security.
 * Wrapped in <ProtectedRoute> in App.jsx, so a user is always signed in here.
 *
 * The tabs follow the standard accessible tabs pattern:
 *  - each tab is linked to its panel (aria-controls / aria-labelledby)
 *  - only the selected tab is in the Tab order; Left/Right arrows, Home and End move between tabs
 */
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, KeyRound, LogOut, MapPin, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import usePageTitle from '../hooks/usePageTitle';
import ProfileDetailsForm from '../components/profile/ProfileDetailsForm';
import CompanyDetailsForm from '../components/profile/CompanyDetailsForm';
import AddressBook from '../components/profile/AddressBook';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import Button from '../components/ui/Button';

const TABS = [
  { id: 'profile', icon: UserRound, Panel: ProfileDetailsForm },
  { id: 'company', icon: Building2, Panel: CompanyDetailsForm, b2bOnly: true },
  { id: 'addresses', icon: MapPin, Panel: AddressBook },
  { id: 'security', icon: KeyRound, Panel: ChangePasswordForm },
];

export default function AccountPage() {
  const { user, isPartner, logout } = useAuth();
  const { t, localePath } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const tabRefs = useRef({});
  usePageTitle(t('account.title'));

  const visibleTabs = TABS.filter((tab) => !tab.b2bOnly || isPartner);
  const current = visibleTabs.find((tab) => tab.id === activeTab) || visibleTabs[0];
  const { Panel } = current;

  function handleLogout() {
    logout();
    navigate(localePath());
  }

  // Arrow-key navigation between tabs
  function handleTabKeyDown(event) {
    const index = visibleTabs.findIndex((tab) => tab.id === current.id);
    const moves = {
      ArrowRight: (index + 1) % visibleTabs.length,
      ArrowLeft: (index - 1 + visibleTabs.length) % visibleTabs.length,
      Home: 0,
      End: visibleTabs.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = visibleTabs[moves[event.key]].id;
    setActiveTab(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      {/* Header */}
      <div className="on-dark flex flex-col gap-4 rounded-2xl bg-cocoa-900 p-6 text-cream sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="text-sm uppercase tracking-widest text-gold-400">{t('account.title')}</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{t('account.greeting', { name: user.name })}</h1>
          <span
            className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
              isPartner ? 'bg-gold-500 text-cocoa-950' : 'bg-cocoa-700 text-cocoa-100'
            }`}
          >
            {isPartner
              ? `${t('account.b2bBadge')} · ${user.corporatePartner?.companyName || ''}`
              : t('account.retailBadge')}
          </span>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="border-cocoa-500 text-cream hover:bg-cocoa-800 sm:self-start"
        >
          <LogOut size={16} aria-hidden="true" /> {t('account.signOut')}
        </Button>
      </div>

      {/* Tabs: 2-column grid on phones, one row on larger screens */}
      <div
        role="tablist"
        aria-label={t('account.title')}
        onKeyDown={handleTabKeyDown}
        className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
      >
        {visibleTabs.map(({ id, icon: Icon }) => {
          const selected = current.id === id;
          return (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[id] = el;
              }}
              id={`account-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="account-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selected ? 'bg-cocoa-900 text-cream' : 'bg-white text-cocoa-700 hover:bg-cocoa-100'
              }`}
            >
              <Icon size={16} aria-hidden="true" /> {t(`account.tabs.${id}`)}
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      <div
        id="account-panel"
        role="tabpanel"
        aria-labelledby={`account-tab-${current.id}`}
        tabIndex={0}
        className="mt-4 rounded-2xl border border-cocoa-200 bg-white p-5 shadow-sm sm:p-8"
      >
        <Panel />
      </div>
    </section>
  );
}
