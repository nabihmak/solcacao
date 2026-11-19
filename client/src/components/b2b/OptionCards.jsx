/**
 * OptionCards - a group of radio buttons shown as cards (Student 4).
 * Used for the chocolate style (step 1) and the packaging type (step 3).
 *
 * It is a real <fieldset> of native radio inputs, so arrow keys move between the
 * options and screen readers announce the group name. Each wizard step uses its own
 * `name`, so picking a packaging type never clears the chocolate style.
 */
import { useId } from 'react';

export default function OptionCards({ legend, name, options, value, onChange, error, columns = 'sm:grid-cols-2' }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 text-sm font-medium text-cocoa-800">{legend}</legend>
      <div className={`grid gap-3 ${columns}`}>
        {options.map((option, index) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                checked ? 'border-cocoa-900 bg-cocoa-50 ring-1 ring-cocoa-900' : 'border-cocoa-300 bg-white hover:border-cocoa-500'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                // The first option carries the error state, so "focus first invalid" lands in this group
                aria-invalid={index === 0 && Boolean(error)}
                className="mt-1 h-4 w-4 shrink-0 accent-cocoa-900"
              />
              <span>
                <span className="block text-sm font-semibold text-cocoa-900">{option.label}</span>
                {option.description && <span className="mt-0.5 block text-xs text-cocoa-600">{option.description}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}
