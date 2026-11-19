/**
 * LoginForm - email + password sign-in form (used inside AuthModal).
 * Calls onSuccess(user) after a successful login.
 */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { collectErrors, email as emailRule, required } from '../../utils/validation';
import { readApiError } from '../../utils/apiErrors';
import FormField from '../ui/FormField';
import PasswordField from '../ui/PasswordField';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { focusFirstInvalid } from '../../utils/focus';

export default function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined })); // clear the error while typing
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget; // kept for moving focus to the first error
    setServerError('');

    const newErrors = collectErrors({ email: emailRule(form.email), password: required(form.password) });
    setErrors(newErrors);
    if (Object.keys(newErrors).length) {
      focusFirstInvalid(formElement);
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(form.email.trim(), form.password);
      onSuccess?.(user);
    } catch (error) {
      setServerError(readApiError(error, t, { unauthorizedKey: 'auth.errors.invalidCredentials' }).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Alert type="error">{serverError}</Alert>

      <FormField
        label={t('auth.fields.email')}
        name="email"
        type="email"
        autoComplete="email"
        value={form.email}
        onChange={handleChange}
        error={errors.email && t(errors.email)}
      />
      <PasswordField
        label={t('auth.fields.password')}
        name="password"
        autoComplete="current-password"
        value={form.password}
        onChange={handleChange}
        error={errors.password && t(errors.password)}
      />

      <Button type="submit" loading={submitting} className="w-full">
        {t('auth.login.submit')}
      </Button>
    </form>
  );
}
