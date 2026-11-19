/**
 * QuantityStepper - "−  2  +" control used on the product page and in the cart.
 * The number can also be typed; it is kept between min and max.
 */
import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function QuantityStepper({ value, onChange, min = 1, max = 99, label, size = 'md' }) {
  const { t } = useLanguage();
  const [text, setText] = useState(String(value));

  useEffect(() => setText(String(value)), [value]);

  function commit(next) {
    const number = Math.floor(Number(next));
    const clamped = Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : value;
    setText(String(clamped));
    if (clamped !== value) onChange(clamped);
  }

  const button =
    size === 'sm'
      ? 'h-8 w-8'
      : 'h-10 w-10';

  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded-full border border-cocoa-300 bg-white">
      <button
        type="button"
        onClick={() => commit(value - 1)}
        disabled={value <= min}
        aria-label={t('shop.product.decrease')}
        className={`${button} inline-flex items-center justify-center rounded-full text-cocoa-800 hover:bg-cocoa-100 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Minus size={16} aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={text}
        aria-label={t('shop.product.quantity')}
        onChange={(event) => setText(event.target.value)}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit(event.currentTarget.value);
        }}
        className="w-10 appearance-none bg-transparent text-center text-sm font-semibold tabular-nums text-cocoa-900 focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-cocoa-900 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
      />
      <button
        type="button"
        onClick={() => commit(value + 1)}
        disabled={value >= max}
        aria-label={t('shop.product.increase')}
        className={`${button} inline-flex items-center justify-center rounded-full text-cocoa-800 hover:bg-cocoa-100 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
