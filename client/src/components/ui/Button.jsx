/**
 * Button - shared button styles with an optional loading spinner.
 * variant: "primary" (dark chocolate), "gold", "outline" or "ghost"
 */
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-cocoa-900 text-cream hover:bg-cocoa-700',
  gold: 'bg-gold-500 text-cocoa-950 hover:bg-gold-400',
  outline: 'border border-cocoa-300 text-cocoa-800 hover:bg-cocoa-100',
  ghost: 'text-cocoa-700 hover:bg-cocoa-100',
};

export default function Button({ variant = 'primary', loading = false, className = '', children, disabled, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
