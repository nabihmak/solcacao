/**
 * AddressForm - add a new address or edit an existing one.
 * Props:
 *   initial  - address object when editing (undefined when adding)
 *   onSave   - async (values) => void, throws on API errors
 *   onCancel - closes the form
 */
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { collectErrors, required } from '../../utils/validation';
import { readApiError } from '../../utils/apiErrors';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { focusFirstInvalid } from '../../utils/focus';

export default function AddressForm({ initial, onSave, onCancel }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    label: initial?.label || '',
    street: initial?.street || '',
    city: initial?.city || '',
    state: initial?.state || '',
    postalCode: initial?.postalCode || '',
    country: initial?.country || '',
    isDefault: initial?.isDefault || false,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget; // kept for moving focus to the first error
    setServerError('');
    const newErrors = collectErrors({
      street: required(form.street),
      city: required(form.city),
      postalCode: required(form.postalCode),
      country: required(form.country),
    });
    setErrors(Object.fromEntries(Object.entries(newErrors).map(([f, key]) => [f, t(key)])));
    if (Object.keys(newErrors).length) {
      focusFirstInvalid(formElement);
      return;
    }

    setSaving(true);
    try {
      // Trim every text value before sending
      const values = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
      );
      await onSave(values);
    } catch (error) {
      const { message, fieldErrors } = readApiError(error, t);
      setErrors(fieldErrors);
      focusFirstInvalid(formElement);
      setServerError(message);
      setSaving(false);
    }
  }

  const field = (name) => ({ name, value: form[name], onChange: handleChange, error: errors[name] });

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-xl border border-gold-400/60 bg-cocoa-50 p-4 sm:p-5"
    >
      <h3 className="font-serif text-lg font-semibold">
        {initial ? t('account.addresses.editTitle') : t('account.addresses.newTitle')}
      </h3>
      <Alert type="error">{serverError}</Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('auth.fields.label')} hint={t('auth.hints.label')} {...field('label')} />
        <FormField label={t('auth.fields.street')} autoComplete="street-address" {...field('street')} />
        <FormField label={t('auth.fields.city')} autoComplete="address-level2" {...field('city')} />
        <FormField
          label={t('auth.fields.state')}
          autoComplete="address-level1"
          hint={t('auth.hints.optional')}
          {...field('state')}
        />
        <FormField label={t('auth.fields.postalCode')} autoComplete="postal-code" {...field('postalCode')} />
        <FormField label={t('auth.fields.country')} autoComplete="country-name" {...field('country')} />
      </div>

      <label className="flex items-center gap-2 text-sm text-cocoa-800">
        <input
          type="checkbox"
          name="isDefault"
          checked={form.isDefault}
          onChange={handleChange}
          className="h-4 w-4 rounded border-cocoa-400 text-cocoa-900 focus:ring-gold-400"
        />
        {t('auth.fields.isDefault')}
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={saving}>
          {t('account.addresses.save')}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('account.cancel')}
        </Button>
      </div>
    </form>
  );
}
