/**
 * ChangePasswordForm - change the password (needs the current password).
 */
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { changePassword } from '../../services/userService';
import * as rules from '../../utils/validation';
import { readApiError } from '../../utils/apiErrors';
import PasswordField from '../ui/PasswordField';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { focusFirstInvalid } from '../../utils/focus';

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function ChangePasswordForm() {
  const { t } = useLanguage();
  const [form, setForm] = useState(EMPTY_FORM);
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
    const checks = {
      currentPassword: rules.required(form.currentPassword),
      newPassword: rules.password(form.newPassword),
      confirmPassword: rules.matches(form.confirmPassword, form.newPassword),
    };
    if (!checks.newPassword && form.newPassword === form.currentPassword) {
      checks.newPassword = 'auth.errors.samePassword';
    }
    const newErrors = rules.collectErrors(checks);
    setErrors(Object.fromEntries(Object.entries(newErrors).map(([f, key]) => [f, t(key)])));
    if (Object.keys(newErrors).length) {
      focusFirstInvalid(formElement);
      return;
    }

    setSaving(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      setForm(EMPTY_FORM);
      setFeedback({ type: 'success', text: t('account.security.success') });
    } catch (error) {
      const { message, fieldErrors } = readApiError(error, t, { badRequestKey: 'auth.errors.wrongCurrentPassword' });
      // A wrong current password has no field list, so mark that field ourselves
      const noFields = Object.keys(fieldErrors).length === 0;
      setErrors(error.status === 400 && noFields ? { currentPassword: message } : fieldErrors);
      focusFirstInvalid(formElement);
      setFeedback({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  }

  const field = (name) => ({ name, value: form[name], onChange: handleChange, error: errors[name] });

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-md space-y-4">
      <h2 className="text-xl font-semibold">{t('account.security.title')}</h2>
      <Alert type={feedback.type}>{feedback.text}</Alert>

      <PasswordField
        label={t('auth.fields.currentPassword')}
        autoComplete="current-password"
        {...field('currentPassword')}
      />
      <PasswordField
        label={t('auth.fields.newPassword')}
        autoComplete="new-password"
        hint={t('auth.hints.password')}
        {...field('newPassword')}
      />
      <PasswordField
        label={t('auth.fields.confirmPassword')}
        autoComplete="new-password"
        {...field('confirmPassword')}
      />

      <Button type="submit" loading={saving}>
        {t('account.security.submit')}
      </Button>
    </form>
  );
}
