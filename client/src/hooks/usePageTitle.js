/**
 * usePageTitle - sets the browser tab title for the current page (WCAG 2.4.2 Page Titled).
 * Example: usePageTitle(t('account.title'))  ->  "My account | SolCacao"
 */
import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | SolCacao` : 'SolCacao | Artisanal Chocolate';
  }, [title]);
}
