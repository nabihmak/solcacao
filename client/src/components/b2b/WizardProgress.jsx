/**
 * WizardProgress - the horizontal 1-2-3-4 step bar above the quote wizard (Student 4).
 *
 *  - completed steps show a check mark and can be clicked to go back and edit
 *  - the current step is marked with aria-current="step" for screen readers
 *  - steps the user has not reached yet are shown but cannot be clicked
 */
import { Check } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function WizardProgress({ steps, current, furthest, onSelect }) {
  const { t } = useLanguage();

  return (
    <nav aria-label={t('b2b.wizard.progressLabel')}>
      <ol className="grid grid-cols-4 gap-2">
        {steps.map((key, index) => {
          const isCurrent = index === current;
          const done = index < furthest && !isCurrent; // passed this step at least once

          const reachable = index <= furthest && !isCurrent;
          const circle = `flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
            isCurrent
              ? 'border-cocoa-900 bg-cocoa-900 text-cream'
              : done
                ? 'border-gold-600 bg-gold-500 text-cocoa-950'
                : 'border-cocoa-300 bg-white text-cocoa-600'
          }`;
          const content = (
            <>
              <span className={circle} aria-hidden="true">
                {done ? <Check size={16} /> : index + 1}
              </span>
              <span className="text-center text-xs font-medium leading-tight sm:text-sm">
                <span className="sr-only">
                  {t('b2b.wizard.stepOf', { step: index + 1, total: steps.length })}
                  {': '}
                </span>
                {t(`b2b.wizard.steps.${key}`)}
                {done && <span className="sr-only"> ({t('b2b.wizard.completed')})</span>}
              </span>
            </>
          );

          return (
            <li key={key} className="relative">
              {/* Line joining this step to the next one */}
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[calc(50%+1.5rem)] right-[calc(-50%+1.5rem)] top-[1.1rem] h-0.5 ${
                    index < furthest ? 'bg-gold-500' : 'bg-cocoa-200'
                  }`}
                />
              )}
              {reachable ? (
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className="flex w-full flex-col items-center gap-2 rounded-lg p-1 text-cocoa-800 hover:text-cocoa-950"
                >
                  {content}
                </button>
              ) : (
                <div
                  className={`flex flex-col items-center gap-2 p-1 ${isCurrent ? 'text-cocoa-950' : 'text-cocoa-600'}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
