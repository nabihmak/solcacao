/**
 * PasswordField - password input with a show/hide (eye) button.
 * Same accessibility rules as FormField: unique id, linked hint/error,
 * and the eye button says what it does ("Show password" / "Hide password").
 */
import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function PasswordField({ label, name, error, hint, className = '', ...inputProps }) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const id = useId();
  const messageId = `${id}-message`;
  const message = error || hint;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-cocoa-800">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
          className={`w-full rounded-lg border bg-white py-2.5 pl-3 pr-11 text-sm text-cocoa-900 focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-600 focus:border-red-600 focus:ring-red-600/50'
              : 'border-cocoa-400 focus:border-cocoa-900 focus:ring-cocoa-900/70'
          }`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-cocoa-600 hover:text-cocoa-900"
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      {message && (
        <p id={messageId} className={`mt-1 text-xs ${error ? 'text-red-700' : 'text-cocoa-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
