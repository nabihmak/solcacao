import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { FLAVORS, saveDemoSubmission, validateSupport } from '../../utils/support';

const inputClass = 'mt-2 block w-full rounded-xl border border-cocoa-200 bg-cocoa-50 px-4 py-3 transition hover:border-cocoa-400 text-cocoa-950 focus:ring-2 focus:ring-cocoa-700';
export default function SupportForm({ type }) {
  const { t } = useLanguage();
  const tr = key => t(`support.${key}`);
  const initial = { name: '', email: '', category: type === 'sampler' ? 'wholesale' : '', message: '', consent: false, rating: '', flavors: [], quantity: '1' };
  const [data, setData] = useState(initial);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  function update(name, value) { setData(d => ({ ...d, [name]: value })); setStatus(''); }
  function field(name, label, props = {}) {
    const id = `${type}-${name}`;
    return <div><label htmlFor={id} className="font-medium">{tr(label)}</label><input {...props} id={id} name={name} value={data[name]} onChange={e => update(name, e.target.value)} className={inputClass} required aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${id}-error` : undefined} />{error(name)}</div>;
  }
  function error(name) { return errors[name] && <p id={`${type}-${name}-error`} className="mt-2 text-sm font-medium text-red-800">{tr(errors[name])}</p>; }
  function submit(event) {
    event.preventDefault();
    const next = validateSupport(data, type);
    setErrors(next); setStatus('');
    if (Object.keys(next).length) {
      requestAnimationFrame(() => document.getElementById(`${type}-${Object.keys(next)[0]}`)?.focus());
      return;
    }
    try { saveDemoSubmission(data, type); setStatus('saved'); }
    catch { setStatus('storageError'); }
  }
  if (status === 'saved') return <section role="status" aria-live="polite" className="rounded-3xl border border-cocoa-200 bg-white p-8 text-center shadow-lg sm:p-12"><div aria-hidden="true" className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-800">✓</div><p className="text-sm font-semibold uppercase tracking-widest text-gold-700">SolCacao</p><h2 className="mt-4 text-3xl">{tr('received')}</h2><p className="mt-4 leading-7">{tr('receivedDetail')}</p><p className="mt-6 rounded-xl bg-cocoa-50 p-4 text-sm leading-6">{tr('saved')}</p><button type="button" onClick={() => { setData(initial); setErrors({}); setStatus(''); }} className="mt-8 rounded-xl bg-cocoa-900 px-6 py-3 font-semibold text-cream">{tr('another')}</button></section>;
  return <form noValidate onSubmit={submit} className="space-y-6 rounded-2xl border border-cocoa-200 bg-white p-6 shadow-xl sm:p-10">
    <div><h2 className="text-3xl">{tr(type === 'contact' ? 'formTitle' : type)}</h2><p className="mt-2 text-sm text-cocoa-700">{tr('formIntro')}</p></div>

    {Object.keys(errors).length > 0 && <p role="alert" className="font-medium text-red-800">{tr('fixErrors')}</p>}
    <div className="grid gap-6 sm:grid-cols-2">{field('name', 'name', { autoComplete: 'name', maxLength: 80 })}{field('email', 'email', { type: 'email', autoComplete: 'email', maxLength: 254 })}</div>
    <div><label htmlFor={`${type}-category`} className="font-medium">{tr('category')}</label><select id={`${type}-category`} value={data.category} onChange={e => update('category', e.target.value)} className={inputClass} required aria-invalid={!!errors.category} aria-describedby={errors.category ? `${type}-category-error` : undefined}><option value="">{tr('choose')}</option>{['support','wholesale','order','other'].map(c => <option key={c} value={c}>{tr(c)}</option>)}</select>{error('category')}</div>
    {type === 'feedback' && <div><label htmlFor="feedback-rating" className="font-medium">{tr('rating')}</label><select id="feedback-rating" className={inputClass} value={data.rating} onChange={e => update('rating', e.target.value)} required aria-invalid={!!errors.rating} aria-describedby={errors.rating ? 'feedback-rating-error' : undefined}><option value="">{tr('choose')}</option>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n} / 5</option>)}</select>{error('rating')}</div>}
    {type === 'sampler' && <>
      <fieldset id="sampler-flavors" tabIndex={-1} aria-describedby="sampler-flavors-hint sampler-flavors-error"><legend className="font-medium">{tr('flavors')}</legend><p id="sampler-flavors-hint" className="mt-2 text-sm">{tr('pickThree')} ({data.flavors.length}/3)</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{FLAVORS.map(f => { const locked = !data.flavors.includes(f) && data.flavors.length >= 3; return <label key={f} className={`flex min-h-12 items-center gap-3 rounded-lg border border-cocoa-300 p-3 ${locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}><input type="checkbox" disabled={locked} checked={data.flavors.includes(f)} onChange={e => update('flavors', e.target.checked ? [...data.flavors, f] : data.flavors.filter(x => x !== f))} className="h-5 w-5 accent-cocoa-800" />{tr(f)}</label>; })}</div><p id="sampler-flavors-error" className="mt-2 text-sm font-medium text-red-800">{errors.flavors ? tr(errors.flavors) : ''}</p></fieldset>
      {field('quantity', 'quantity', { type: 'number', min: 1, max: 50, step: 1 })}
      <p className="text-sm">{tr('samplerSummary')}: {data.flavors.map(f => tr(f)).join(', ') || tr('none')} · {data.quantity} {tr('boxes')}</p>
    </>}
    <div><label htmlFor={`${type}-message`} className="font-medium">{tr('message')}</label><textarea id={`${type}-message`} rows={5} maxLength={2000} value={data.message} onChange={e => update('message', e.target.value)} className={inputClass} required aria-invalid={!!errors.message} aria-describedby={`${type}-message-hint${errors.message ? ` ${type}-message-error` : ''}`} /><p id={`${type}-message-hint`} className="mt-1 text-sm">{tr('messageHint')} · {data.message.length}/2000</p>{error('message')}</div>
    <div><label className="flex items-start gap-3"><input id={`${type}-consent`} type="checkbox" checked={data.consent} onChange={e => update('consent', e.target.checked)} required aria-invalid={!!errors.consent} aria-describedby={errors.consent ? `${type}-consent-error` : undefined} className="mt-1 h-5 w-5 shrink-0 accent-cocoa-800" /><span>{tr('consent')}</span></label>{error('consent')}</div>
    <div className="flex flex-wrap gap-3"><button type="submit" className="min-h-12 rounded-full bg-cocoa-900 px-8 py-3 font-semibold text-cream transition hover:bg-cocoa-700 hover:shadow-lg">{tr('submit')}</button><button type="button" onClick={() => { setData(initial); setErrors({}); setStatus(''); }} className="min-h-12 rounded-full px-6 py-3 text-cocoa-700 transition hover:bg-cocoa-50">{tr('reset')}</button></div>
    <p role="status" aria-live="polite" className="font-medium">{status ? tr(status) : ''}</p>
  </form>;
}
