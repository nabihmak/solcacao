/**
 * ProfileDetailsForm - edit name, phone and preferred language.
 * Email and account type are shown but cannot be changed.
 */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { updateProfile } from '../../services/userService';
import { LANGUAGES } from '../../utils/constants';
import { collectErrors, required } from '../../utils/validation';
import { readApiError } from '../../utils/apiErrors';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { focusFirstInvalid } from '../../utils/focus';

export default function ProfileDetailsForm() {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone || '',
    preferredLanguage: user.preferredLanguage,
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
    const newErrors = collectErrors({ name: required(form.name) });
    setErrors(Object.fromEntries(Object.entries(newErrors).map(([f, key]) => [f, t(key)])));
    if (Object.keys(newErrors).length) {
      focusFirstInvalid(formElement);
      return;
    }

    setSaving(true);
    try {
      const data = await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        preferredLanguage: form.preferredLanguage,
      });
      setUser(data.user);
      setFeedback({ type: 'success', text: t('account.saved') });
    } catch (error) {
      const { message, fieldErrors } = readApiError(error, t);
      setErrors(fieldErrors);
      focusFirstInvalid(formElement);
      setFeedback({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <h2 className="text-xl font-semibold">{t('account.profile.title')}</h2>
      <Alert type={feedback.type}>{feedback.text}</Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={t('auth.fields.name')}
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />
        <FormField
          label={t('auth.fields.email')}
          name="email"
          type="email"
          value={user.email}
          disabled
          hint={t('account.profile.emailNote')}
        />
        <FormField
          label={t('auth.fields.phone')}
          name="phone"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
          hint={t('auth.hints.optional')}
        />
        <FormField
          as="select"
          label={t('auth.fields.preferredLanguage')}
          name="preferredLanguage"
          value={form.preferredLanguage}
          onChange={handleChange}
        >
          {LANGUAGES.map((code) => (
            <option key={code} value={code} lang={code}>
              {t(`account.languages.${code}`)}
            </option>
          ))}
        </FormField>
      </div>

      <Button type="submit" loading={saving}>
        {t('account.save')}
      </Button>
    </form>
  );
}
