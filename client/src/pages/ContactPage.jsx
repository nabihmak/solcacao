
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, MessageCircle, Package,
  Sparkles, Leaf, X, Send
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import SupportForm from '../components/support/SupportForm';
import { whatsappUrl } from '../utils/support';
import usePageTitle from '../hooks/usePageTitle';

const CHAT_OPTIONS = [
  {
    id: 'products',
    label: 'Chocolate Products',
    message: 'Hello SolCacao Team, I would like to learn more about your chocolate products.'
  },
  {
    id: 'sampler',
    label: 'Chocolate Sampler',
    message: 'Hello SolCacao Team, I would like information about your chocolate sampler.'
  },
  {
    id: 'orders',
    label: 'Orders & Delivery',
    message: 'Hello SolCacao Team, I need assistance with an order or delivery.'
  },
  {
    id: 'wholesale',
    label: 'Wholesale Inquiries',
    message: 'Hello SolCacao Team, I would like to know more about wholesale opportunities.'
  },
  {
    id: 'other',
    label: 'Other Questions',
    message: 'Hello SolCacao Team, I have a question and would like some assistance.'
  }
];

export default function ContactPage() {
  const { t, localePath } = useLanguage();
  const tr = key => t(`support.${key}`);

  const [chatOpen, setChatOpen] = useState(false);
  const [selected, setSelected] = useState('products');

  usePageTitle(tr('contact'));

  const number = import.meta.env.VITE_WHATSAPP_NUMBER;
  const selectedOption = CHAT_OPTIONS.find(
    option => option.id === selected
  );

  const chatUrl = whatsappUrl(number, selectedOption.message);
  const whatsappEnabled = Boolean(whatsappUrl(number, 'Hello'));

  return (
    <div className="contact-experience">
      <section className="relative overflow-hidden bg-cocoa-950 text-cream">
        <div aria-hidden="true" className="contact-orbit" />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-14 sm:pb-24 sm:pt-20">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">
            <span className="h-px w-8 bg-gold-400" />
            {tr('eyebrow')}
          </p>

          <h1 className="mt-6 max-w-2xl text-5xl leading-tight sm:text-7xl">
            {tr('headline')}
            <span className="block italic text-gold-300">
              {tr('headlineAccent')}
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-8 text-cocoa-200">
            {tr('intro')}
          </p>
        </div>
      </section>

      <div className="relative mx-auto -mt-8 grid max-w-6xl gap-10 px-5 pb-16 lg:grid-cols-[1fr_1.65fr] lg:gap-14">
        <aside className="order-2 pt-4 lg:order-1 lg:pt-16">
          <div className="mb-8 flex items-center gap-3 text-gold-700">
            <Leaf size={22} aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">
              {tr('crafted')}
            </span>
          </div>

          <h2 className="text-3xl">{tr('helpTitle')}</h2>

          <p className="mt-4 leading-7 text-cocoa-700">
            {tr('helpText')}
          </p>

          <nav
            aria-label={tr('explore')}
            className="mt-8 divide-y divide-cocoa-200 border-y border-cocoa-200"
          >
            {[
              ['sampler', Package],
              ['feedback', MessageCircle],
              ['faq', Sparkles]
            ].map(([path, Icon]) => (
              <Link
                key={path}
                to={localePath('/' + path)}
                className="group flex min-h-20 items-center gap-4 py-5 transition hover:pl-2 hover:text-gold-700"
              >
                <Icon size={21} aria-hidden="true" />
                <span className="flex-1 font-medium">{tr(path)}</span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </aside>

        <div className="order-1 lg:order-2">
          <SupportForm type="contact" />
        </div>
      </div>

      {whatsappEnabled && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

          {chatOpen && (
            <div
              role="dialog"
              aria-label="SolCacao WhatsApp Assistant"
              className="w-[min(350px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-cocoa-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between bg-[#173f32] px-5 py-4 text-white">
                <div className="flex items-center gap-3">
                  <MessageCircle size={22} />
                  <div>
                    <p className="font-semibold">SolCacao Support</p>
                    <p className="text-xs text-green-100">
                      WhatsApp Assistant
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  aria-label="Close chat"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[60vh] space-y-4 overflow-y-auto bg-[#faf7f1] p-5">
                <div className="rounded-xl bg-white p-4 text-sm leading-6 text-cocoa-900 shadow-sm">
                  <p className="font-semibold">
                    Welcome to SolCacao! 🍫
                  </p>
                  <p className="mt-2">
                    How can we help you today?
                    Please select an option below.
                  </p>
                </div>

                <div className="space-y-2">
                  {CHAT_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelected(option.id)}
                      aria-pressed={selected === option.id}
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                        selected === option.id
                          ? 'border-[#173f32] bg-[#e6eee7] font-semibold'
                          : 'border-cocoa-200 bg-white hover:bg-[#f2eee7]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <a
                  href={chatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#173f32] px-4 py-3 font-semibold text-white transition hover:bg-[#245a47]"
                >
                  <Send size={17} />
                  Continue to WhatsApp
                </a>

                <p className="text-center text-xs text-cocoa-600">
                  WhatsApp will open with your selected message.
                  Press Send to contact our team.
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setChatOpen(!chatOpen)}
            aria-label={chatOpen ? 'Close WhatsApp chat' : 'Open WhatsApp chat'}
            aria-expanded={chatOpen}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-105 hover:bg-[#1fb65a]"
          >
            {chatOpen ? <X size={28} /> : <MessageCircle size={30} />}
          </button>
        </div>
      )}
    </div>
  );
}
