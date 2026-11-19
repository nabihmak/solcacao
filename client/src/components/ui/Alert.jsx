/**
 * Alert - small message box for form errors and success notes.
 * type: "error" or "success"
 */
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Alert({ type = 'error', children }) {
  if (!children) return null;
  const isError = type === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
        isError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {isError ? (
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
      )}
      <span>{children}</span>
    </div>
  );
}
