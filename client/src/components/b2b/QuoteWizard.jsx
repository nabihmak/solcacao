/**
 * QuoteWizard - 4-step custom manufacturing quote request for corporate partners (Student 4).
 *
 *   1. Cacao profile   - origin, cacao percentage, chocolate style
 *   2. Brand files     - upload a brand vector or tech pack (PDF, SVG, AI, EPS, PNG)
 *   3. Packaging       - packaging type, quantity, delivery date, notes
 *   4. Review & submit - check everything and send the request
 *
 * How it works:
 *  - "Next" checks only the current step; errors are shown next to the fields and
 *    keyboard focus moves to the first one (WCAG 3.3.1)
 *  - finished steps get a check mark in WizardProgress and can be reopened
 *  - when the step changes, focus moves to the new step's heading, so screen-reader
 *    and keyboard users know where they are
 *  - "Send request" posts a multipart form (b2bService -> POST /api/b2b/quote)
 */
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, FileUp, Pencil, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import OptionCards from './OptionCards';
import WizardProgress from './WizardProgress';
import { submitQuoteRequest } from '../../services/b2bService';
import { focusFirstInvalid } from '../../utils/focus';
import {
  CHOCOLATE_STYLES,
  EMPTY_QUOTE,
  FILE_EXTENSIONS,
  MAX_FILE_MB,
  MAX_PCT,
  MIN_PCT,
  MIN_QUANTITY,
  ORIGINS,
  PACKAGING_TYPES,
  stepWithError,
  todayString,
  validateStep,
} from '../../utils/b2bQuote';

const STEPS = ['profile', 'files', 'packaging', 'review'];

const formatSize = (bytes) => (bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

export default function QuoteWizard({ onSubmitted }) {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [values, setValues] = useState(EMPTY_QUOTE);
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0); // highest step reached so far
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // the created request after a successful send

  const formRef = useRef(null);
  const headingRef = useRef(null);
  const fileInputRef = useRef(null);
  const firstRender = useRef(true);

  // Move focus to the step heading whenever the step changes (not on first load)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, result]);

  const err = (field) => (errors[field] ? t(errors[field], { min: MIN_QUANTITY, mb: MAX_FILE_MB }) : undefined);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors(({ [field]: _removed, ...rest }) => rest);
  }

  // Shows the errors of one step; returns true when the step is valid
  function checkStep(index) {
    const stepErrors = validateStep(index, values, file);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) {
      focusFirstInvalid(formRef.current);
      return false;
    }
    return true;
  }

  function goTo(index) {
    // Going forward (e.g. clicking a later step) still requires the current step to be valid
    if (index > step && !checkStep(step)) return;
    setErrors({});
    setFormError('');
    setStep(index);
    setFurthest((max) => Math.max(max, index));
  }

  function handleFile(event) {
    const chosen = event.target.files?.[0] || null;
    setFile(chosen);
    setErrors(({ brandFile: _removed, ...rest }) => rest);
  }

  function removeFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    fileInputRef.current?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (step < STEPS.length - 1) {
      goTo(step + 1); // Enter key on steps 1-3 means "Next"
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const { request } = await submitQuoteRequest(values, file);
      setResult(request);
      onSubmitted?.(request);
    } catch (error) {
      if (error.status === 400 && error.errors?.length) {
        // The server found a problem: reopen the step that has it
        const serverErrors = Object.fromEntries(error.errors.map(({ field, message }) => [field, message]));
        const target = Math.max(stepWithError(serverErrors), 0);
        setStep(target);
        setErrors(serverErrors);
        setFormError(t('b2b.errors.checkFields'));
      } else if (error.status === 401 || error.status === 403) {
        setFormError(t('b2b.errors.partnerOnly'));
      } else {
        setFormError(t('auth.errors.generic'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setValues(EMPTY_QUOTE);
    setFile(null);
    setStep(0);
    setFurthest(0);
    setErrors({});
    setResult(null);
  }

  /* ---------------- After a successful send ---------------- */
  if (result) {
    return (
      <section className="rounded-2xl border border-cocoa-200 bg-white p-6 text-center shadow-sm sm:p-10" aria-live="polite">
        <CheckCircle2 size={44} className="mx-auto text-emerald-700" aria-hidden="true" />
        <h2 ref={headingRef} tabIndex={-1} className="mt-4 text-2xl font-semibold text-cocoa-900 focus:outline-none">
          {t('b2b.done.title')}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-cocoa-700">{t('b2b.done.text', { reference: result.reference })}</p>
        <p className="mt-4 inline-block rounded-full bg-cocoa-100 px-4 py-1.5 text-sm font-semibold text-cocoa-800">
          {t('b2b.done.reference')}: {result.reference}
        </p>
        <p className="mx-auto mt-4 max-w-md text-xs text-cocoa-600">{t('b2b.done.demoNote')}</p>
        <Button variant="outline" className="mt-6" onClick={startOver}>
          {t('b2b.done.another')}
        </Button>
      </section>
    );
  }

  /* ---------------- The wizard ---------------- */
  const styleOptions = CHOCOLATE_STYLES.map((value) => ({ value, label: t(`b2b.styles.${value}`) }));
  const packagingOptions = PACKAGING_TYPES.map((value) => ({
    value,
    label: t(`b2b.packaging.${value}.title`),
    description: t(`b2b.packaging.${value}.text`),
  }));
  const isLast = step === STEPS.length - 1;

  // Rows shown on the review step
  const review = [
    { step: 0, label: t('b2b.fields.origin'), value: values.cacaoOrigin },
    { step: 0, label: t('b2b.fields.percentage'), value: `${values.cacaoPercentage}%` },
    { step: 0, label: t('b2b.fields.style'), value: values.chocolateStyle && t(`b2b.styles.${values.chocolateStyle}`) },
    { step: 1, label: t('b2b.fields.file'), value: file && `${file.name} (${formatSize(file.size)})` },
    { step: 2, label: t('b2b.fields.packaging'), value: values.packagingType && t(`b2b.packaging.${values.packagingType}.title`) },
    { step: 2, label: t('b2b.fields.quantity'), value: values.quantity && Number(values.quantity).toLocaleString(lang) },
    { step: 2, label: t('b2b.fields.deliveryDate'), value: values.deliveryDate || t('b2b.review.flexible') },
    { step: 2, label: t('b2b.fields.packagingNotes'), value: values.packagingNotes || '—' },
  ];

  return (
    <div className="rounded-2xl border border-cocoa-200 bg-white p-5 shadow-sm sm:p-8">
      <WizardProgress steps={STEPS} current={step} furthest={furthest} onSelect={goTo} />

      <form ref={formRef} noValidate onSubmit={handleSubmit} className="mt-8">
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-cocoa-900 focus:outline-none sm:text-2xl">
          <span className="block text-xs font-semibold uppercase tracking-widest text-gold-700">
            {t('b2b.wizard.stepOf', { step: step + 1, total: STEPS.length })}
          </span>
          {t(`b2b.wizard.titles.${STEPS[step]}`)}
        </h2>
        <p className="mt-1 text-sm text-cocoa-700">{t(`b2b.wizard.intros.${STEPS[step]}`)}</p>

        <div className="mt-6 space-y-6">
          {formError && <Alert>{formError}</Alert>}

          {/* Step 1: cacao profile */}
          {step === 0 && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  as="select"
                  label={t('b2b.fields.origin')}
                  name="cacaoOrigin"
                  value={values.cacaoOrigin}
                  onChange={(event) => update('cacaoOrigin', event.target.value)}
                  error={err('cacaoOrigin')}
                >
                  <option value="">{t('b2b.fields.chooseOrigin')}</option>
                  {ORIGINS.map((origin) => (
                    <option key={origin} value={origin}>
                      {origin}
                    </option>
                  ))}
                </FormField>
                <FormField
                  label={t('b2b.fields.percentage')}
                  name="cacaoPercentage"
                  type="number"
                  inputMode="numeric"
                  min={MIN_PCT}
                  max={MAX_PCT}
                  step={1}
                  value={values.cacaoPercentage}
                  onChange={(event) => update('cacaoPercentage', event.target.value)}
                  hint={t('b2b.hints.percentage', { min: MIN_PCT, max: MAX_PCT })}
                  error={err('cacaoPercentage')}
                />
              </div>
              <OptionCards
                legend={t('b2b.fields.style')}
                name="chocolateStyle"
                options={styleOptions}
                value={values.chocolateStyle}
                onChange={(value) => update('chocolateStyle', value)}
                error={err('chocolateStyle')}
                columns="grid-cols-2 sm:grid-cols-4"
              />
            </>
          )}

          {/* Step 2: brand vector / tech pack upload */}
          {step === 1 && (
            <div>
              <label htmlFor="brand-file" className="mb-1 block text-sm font-medium text-cocoa-800">
                {t('b2b.fields.file')}
              </label>
              <div
                className={`rounded-xl border-2 border-dashed p-6 text-center ${
                  errors.brandFile ? 'border-red-600 bg-red-50/40' : 'border-cocoa-300 bg-cocoa-50/60'
                }`}
              >
                <FileUp size={30} className="mx-auto text-cocoa-600" aria-hidden="true" />
                <input
                  ref={fileInputRef}
                  id="brand-file"
                  name="brandFile"
                  type="file"
                  accept={FILE_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
                  onChange={handleFile}
                  aria-invalid={Boolean(errors.brandFile)}
                  aria-describedby="brand-file-hint brand-file-error"
                  className="mx-auto mt-3 block w-full max-w-xs text-sm text-cocoa-800 file:mr-3 file:rounded-full file:border-0 file:bg-cocoa-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cream hover:file:bg-cocoa-700"
                />
                <p id="brand-file-hint" className="mt-3 text-xs text-cocoa-600">
                  {t('b2b.hints.file', { types: FILE_EXTENSIONS.join(', ').toUpperCase(), mb: MAX_FILE_MB })}
                </p>
              </div>
              <p id="brand-file-error" className="mt-1 text-xs text-red-700">
                {err('brandFile') || ''}
              </p>
              {file && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-cocoa-50 px-4 py-3 text-sm">
                  <span className="min-w-0 truncate text-cocoa-900">
                    <span className="font-semibold">{file.name}</span> · {formatSize(file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={removeFile}
                    aria-label={t('b2b.fields.removeFile', { name: file.name })}
                    className="rounded-full p-1.5 text-cocoa-700 hover:bg-cocoa-200"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: packaging */}
          {step === 2 && (
            <>
              <OptionCards
                legend={t('b2b.fields.packaging')}
                name="packagingType"
                options={packagingOptions}
                value={values.packagingType}
                onChange={(value) => update('packagingType', value)}
                error={err('packagingType')}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label={t('b2b.fields.quantity')}
                  name="quantity"
                  type="number"
                  inputMode="numeric"
                  min={MIN_QUANTITY}
                  step={1}
                  value={values.quantity}
                  onChange={(event) => update('quantity', event.target.value)}
                  hint={t('b2b.hints.quantity', { min: MIN_QUANTITY })}
                  error={err('quantity')}
                />
                <FormField
                  label={`${t('b2b.fields.deliveryDate')} (${t('auth.hints.optional')})`}
                  name="deliveryDate"
                  type="date"
                  min={todayString()}
                  value={values.deliveryDate}
                  onChange={(event) => update('deliveryDate', event.target.value)}
                  error={err('deliveryDate')}
                />
              </div>
              <FormField
                as="textarea"
                rows={3}
                maxLength={500}
                label={`${t('b2b.fields.packagingNotes')} (${t('auth.hints.optional')})`}
                name="packagingNotes"
                value={values.packagingNotes}
                onChange={(event) => update('packagingNotes', event.target.value)}
                hint={t('b2b.hints.packagingNotes')}
                error={err('packagingNotes')}
              />
            </>
          )}

          {/* Step 4: review and send */}
          {step === 3 && (
            <>
              <p className="rounded-lg bg-cocoa-50 px-4 py-3 text-sm text-cocoa-800">
                {t('b2b.review.company')}: <strong>{user?.corporatePartner?.companyName || user?.name}</strong>
              </p>
              <dl className="divide-y divide-cocoa-200 rounded-xl border border-cocoa-200">
                {review.map((row) => (
                  <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
                    <dt className="text-sm text-cocoa-600">{row.label}</dt>
                    <dd className="flex min-w-0 items-center gap-3 text-sm font-medium text-cocoa-900">
                      <span className="break-words">{row.value}</span>
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2].map((index) => (
                  <Button key={index} type="button" variant="ghost" className="px-3 py-1.5" onClick={() => goTo(index)}>
                    <Pencil size={14} aria-hidden="true" />
                    {t('b2b.review.edit', { step: t(`b2b.wizard.steps.${STEPS[index]}`) })}
                  </Button>
                ))}
              </div>
              <FormField
                as="textarea"
                rows={4}
                maxLength={2000}
                label={`${t('b2b.fields.notes')} (${t('auth.hints.optional')})`}
                name="notes"
                value={values.notes}
                onChange={(event) => update('notes', event.target.value)}
                hint={t('b2b.hints.notes')}
                error={err('notes')}
              />
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-cocoa-200 pt-6 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={() => goTo(step - 1)} disabled={step === 0}>
            {t('b2b.wizard.back')}
          </Button>
          <Button type="submit" variant={isLast ? 'gold' : 'primary'} loading={submitting}>
            {isLast ? t('b2b.wizard.submit') : t('b2b.wizard.next')}
          </Button>
        </div>
      </form>
    </div>
  );
}
