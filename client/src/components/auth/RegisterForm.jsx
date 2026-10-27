/**
 * RegisterForm - step 2 of registration.
 *  - Retail: personal details + password
 *  - B2B   : contact person details + password + company details
 */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { INDUSTRIES } from '../../utils/constants';
import * as rules from '../../utils/validation';
import { readApiError } from '../../utils/apiErrors';
import FormField from '../ui/FormField';
import PasswordField from '../ui/PasswordField';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { focusFirstInvalid } from '../../utils/focus';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  industry: '',
  taxId: '',
  website: '',
};

export default function RegisterForm({ accountType }) {
  const { register } = useAuth();
  const { t, lang } = useLanguage();
  const isB2B = accountType === 'B2B';

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  // Client-side checks (the server checks again with Joi)
  function validateForm() {
    const checks = {
      name: rules.required(form.name),
      email: rules.email(form.email),
      password: rules.password(form.password),
      confirmPassword: rules.matches(form.confirmPassword, form.password),
    };
    if (isB2B) {
      checks.companyName = rules.required(form.companyName);
      checks.industry = rules.required(form.industry);
      checks.website = rules.website(form.website);
    }
    // Translate the error keys for display
    return Object.fromEntries(Object.entries(rules.collectErrors(checks)).map(([field, key]) => [field, t(key)]));
  }

  // Builds the registration data (Phase 3: the JSON body for POST /api/auth/register)
  function buildPayload() {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      accountType,
      preferredLanguage: lang,
    };
    if (isB2B) {
      payload.company = {
        companyName: form.companyName.trim(),
        industry: form.industry,
        taxId: form.taxId.trim(),
        website: form.website.trim(),
      };
    }
    return payload;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget; // kept for moving focus to the first error
    setServerError('');

    const newErrors = validateForm();
    setErrors(newErrors);
    if (Object.keys(newErrors).length) {
      focusFirstInvalid(formElement);
      return;
    }

    setSubmitting(true);
    try {
      // On success the user is logged in and RegisterPage redirects to /account
      await register(buildPayload());
    } catch (error) {
      const { message, fieldErrors } = readApiError(error, t);
      setServerError(message);
      // "company.companyName" from the server -> "companyName" input
      setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([f, m]) => [f.replace('company.', ''), m])));
      focusFirstInvalid(formElement);
      setSubmitting(false);
    }
  }

  // Helper so each input below stays short
  const field = (name) => ({ name, value: form[name], onChange: handleChange, error: errors[name] });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <Alert type="error">{serverError}</Alert>

      <fieldset className="space-y-4">
        {isB2B && (
          <legend className="mb-2 font-serif text-lg font-semibold text-cocoa-900">
            {t('auth.register.contactSection')}
          </legend>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={t(isB2B ? 'auth.fields.contactName' : 'auth.fields.name')}
            autoComplete="name"
            {...field('name')}
          />
          <FormField label={t('auth.fields.email')} type="email" autoComplete="email" {...field('email')} />
          <FormField
            label={t('auth.fields.phone')}
            type="tel"
            autoComplete="tel"
            hint={t('auth.hints.optional')}
            {...field('phone')}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField
            label={t('auth.fields.password')}
            autoComplete="new-password"
            hint={t('auth.hints.password')}
            {...field('password')}
          />
          <PasswordField
            label={t('auth.fields.confirmPassword')}
            autoComplete="new-password"
            {...field('confirmPassword')}
          />
        </div>
      </fieldset>

      {isB2B && (
        // The wrapper draws the divider line (a border on the fieldset itself would cut through the legend)
        <div className="border-t border-cocoa-200 pt-6">
          <fieldset className="space-y-4">
            <legend className="mb-2 font-serif text-lg font-semibold text-cocoa-900">
              {t('auth.register.companySection')}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t('auth.fields.companyName')} autoComplete="organization" {...field('companyName')} />
              <FormField as="select" label={t('auth.fields.industry')} {...field('industry')}>
                <option value="">{t('auth.selectIndustry')}</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>
                    {t(`auth.industries.${industry}`)}
                  </option>
                ))}
              </FormField>
              <FormField label={t('auth.fields.taxId')} hint={t('auth.hints.optional')} {...field('taxId')} />
              <FormField
                label={t('auth.fields.website')}
                type="url"
                placeholder="https://"
                hint={t('auth.hints.website')}
                {...field('website')}
              />
            </div>
          </fieldset>
        </div>
      )}

      <Button type="submit" variant={isB2B ? 'gold' : 'primary'} loading={submitting} className="w-full sm:w-auto">
        {t('auth.register.submit')}
      </Button>
    </form>
  );
}
