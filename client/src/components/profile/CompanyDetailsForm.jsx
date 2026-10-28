/**
 * CompanyDetailsForm - edit the CorporatePartner details (B2B accounts only).
 */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { updateProfile } from '../../services/userService';
import { INDUSTRIES } from '../../utils/constants';
import * as rules from '../../utils/validation';
import { readApiError } from '../../utils/apiErrors';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { focusFirstInvalid } from '../../utils/focus';

export default function CompanyDetailsForm() {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();
  const company = user.corporatePartner || {};

  const [form, setForm] = useState({
    companyName: company.companyName || '',
    industry: company.industry || '',
    taxId: company.taxId || '',
    website: company.website || '',
  });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFeedback({ type: '', text: '' });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget; // kept for moving focus to the first error
    const newErrors = rules.collectErrors({
      companyName: rules.required(form.companyName),
      industry: rules.required(form.industry),
      website: rules.website(form.website),
    });
    setErrors(Object.fromEntries(Object.entries(newErrors).map(([f, key]) => [f, t(key)])));
    if (Object.keys(newErrors).length) {
      focusFirstInvalid(formElement);
      return;
    }

    setSaving(true);
    try {
      const data = await updateProfile({
        company: {
          companyName: form.companyName.trim(),
          industry: form.industry,
          taxId: form.taxId.trim(),
          website: form.website.trim(),
        },
      });
      setUser(data.user);
      setFeedback({ type: 'success', text: t('account.saved') });
    } catch (error) {
      const { message, fieldErrors } = readApiError(error, t);
      setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([f, m]) => [f.replace('company.', ''), m])));
      focusFirstInvalid(formElement);
      setFeedback({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  }

  const field = (name) => ({ name, value: form[name], onChange: handleChange, error: errors[name] });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <h2 className="text-xl font-semibold">{t('account.company.title')}</h2>
      <Alert type={feedback.type}>{feedback.text}</Alert>

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

      <Button type="submit" variant="gold" loading={saving}>
        {t('account.save')}
      </Button>
    </form>
  );
}
