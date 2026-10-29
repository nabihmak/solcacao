import { Link } from 'react-router-dom';
import { ArrowUpRight, MessageCircle, Package, Sparkles, Leaf } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import SupportForm from '../components/support/SupportForm';
import { whatsappUrl } from '../utils/support';
import usePageTitle from '../hooks/usePageTitle';
export default function ContactPage() {
  const { t, localePath } = useLanguage();
  const tr = key => t(`support.${key}`);
  usePageTitle(tr('contact'));
  const url = whatsappUrl(import.meta.env.VITE_WHATSAPP_NUMBER, tr('whatsappMessage'));
  return <div className="contact-experience">
    <section className="relative overflow-hidden bg-cocoa-950 text-cream">
      <div aria-hidden="true" className="contact-orbit" />
      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-14 sm:pb-24 sm:pt-20">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold-300"><span className="h-px w-8 bg-gold-400" />{tr('eyebrow')}</p>
        <h1 className="mt-6 max-w-2xl text-5xl leading-tight sm:text-7xl">{tr('headline')}<span className="block italic text-gold-300">{tr('headlineAccent')}</span></h1>
        <p className="mt-6 max-w-lg text-base leading-8 text-cocoa-200">{tr('intro')}</p>
      </div>
    </section>
    <div className="relative mx-auto -mt-8 grid max-w-6xl gap-10 px-5 pb-16 lg:grid-cols-[1fr_1.65fr] lg:gap-14">
      <aside className="order-2 pt-4 lg:order-1 lg:pt-16">
        <div className="mb-8 flex items-center gap-3 text-gold-700"><Leaf size={22} aria-hidden="true" /><span className="text-xs font-semibold uppercase tracking-[0.2em]">{tr('crafted')}</span></div>
        <h2 className="text-3xl">{tr('helpTitle')}</h2><p className="mt-4 leading-7 text-cocoa-700">{tr('helpText')}</p>
        <nav aria-label={tr('explore')} className="mt-8 divide-y divide-cocoa-200 border-y border-cocoa-200">
          {[['sampler',Package],['feedback',MessageCircle],['faq',Sparkles]].map(([path,Icon]) => <Link key={path} to={localePath('/'+path)} className="group flex min-h-20 items-center gap-4 py-5 transition hover:pl-2 hover:text-gold-700"><Icon size={21} aria-hidden="true" /><span className="flex-1 font-medium">{tr(path)}</span><ArrowUpRight size={18} aria-hidden="true" className="transition group-hover:-translate-y-1 group-hover:translate-x-1" /></Link>)}
        </nav>
        {url && <a href={url} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center gap-3 rounded-full border border-cocoa-300 px-5 py-3 font-medium transition hover:bg-white"><MessageCircle size={18} aria-hidden="true" />{tr('whatsapp')}<ArrowUpRight size={16} aria-hidden="true" /></a>}
      </aside>
      <div className="order-1 lg:order-2"><SupportForm type="contact" /></div>
    </div>
  </div>;
}
