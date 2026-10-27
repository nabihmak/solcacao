import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LanguageProvider } from '../../i18n/LanguageContext';
import CartIndicator from './CartIndicator';

function renderCart(count) {
  return renderToStaticMarkup(
    <LanguageProvider>
      <CartIndicator count={count} />
    </LanguageProvider>
  );
}

describe('CartIndicator', () => {
  it('shows an empty cart without a number badge', () => {
    const html = renderCart(0);

    expect(html).toContain('Cart: 0 items');
    expect(html).not.toContain('>0</span>');
  });

  it('displays the supplied cart count', () => {
    const html = renderCart(3);

    expect(html).toContain('Cart: 3 items');
    expect(html).toContain('>3</span>');
  });

  it('caps the visible badge at 99+', () => {
    const html = renderCart(105);

    expect(html).toContain('Cart: 105 items');
    expect(html).toContain('>99+</span>');
  });

  it('handles negative values safely', () => {
    const html = renderCart(-5);

    expect(html).toContain('Cart: 0 items');
  });
});