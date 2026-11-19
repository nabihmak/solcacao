/**
 * FormField - labelled input with hint and error message.
 * Works for <input> (default) and <select> (pass as="select" and children).
 *
 * Accessibility:
 *  - every field gets a unique id (useId), so its <label> always points to
 *    the right input, even when two forms with the same field names are on
 *    screen (e.g. the sign-in dialog over the registration page)
 *  - the hint or error text is linked with aria-describedby
 *  - aria-invalid marks a field that has an error
 *
 * Example:
 *   <FormField label="Email" name="email" type="email"
 *              value={form.email} onChange={handleChange} error={errors.email} />
 */
import { useId } from 'react';

export default function FormField({ label, name, error, hint, as = 'input', children, className = '', ...inputProps }) {
  const Element = as;
  const id = useId();
  const messageId = `${id}-message`;
  const message = error || hint;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-cocoa-800">
        {label}
      </label>
      <Element
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={message ? messageId : undefined}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-cocoa-900 placeholder:text-cocoa-500 focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-600 focus:border-red-600 focus:ring-red-600/50'
            : 'border-cocoa-400 focus:border-cocoa-900 focus:ring-cocoa-900/70'
        } disabled:bg-cocoa-50 disabled:text-cocoa-600`}
        {...inputProps}
      >
        {children}
      </Element>
      {message && (
        <p id={messageId} className={`mt-1 text-xs ${error ? 'text-red-700' : 'text-cocoa-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
