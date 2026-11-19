/**
 * Tests for the homepage sampler promotion and seasonal row.
 */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { AuthProvider } from '../../context/AuthContext';
import { CartProvider } from '../../context/CartContext';
import SamplerPromo from './SamplerPromo';
import SeasonalPicks from './SeasonalPicks';

let host;
let root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

const render = async (ui) => {
  await act(async () => {
    root.render(
      <MemoryRouter>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>{ui}</CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </MemoryRouter>
    );
  });
};

const product = (id, name) => ({
  _id: id,
  slug: `seasonal-${id}`,
  sku: `SKU-${id}`,
  name: { en: name, es: name },
  category: 'seasonal',
  origin: 'Peru',
  cacaoPct: 70,
  price: 12,
  tastingNotes: { en: ['Cinnamon'], es: ['Canela'] },
  stock: 10,
  inStock: true,
  lowStock: false,
});

describe('SamplerPromo', () => {
  it('shows the six flavors and links to the sampler page', async () => {
    vi.stubGlobal('fetch', vi.fn());
    await render(<SamplerPromo />);
    expect(host.querySelector('h2').textContent).toBe('Create your tasting sampler');
    expect(host.querySelectorAll('ul li')).toHaveLength(6);
    expect(host.querySelector('a').getAttribute('href')).toBe('/en/sampler');
  });
});

describe('SeasonalPicks', () => {
  it('loads seasonal products from the API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ products: [product('s1', 'Winter Bar'), product('s2', 'Day of the Dead Bar')] }),
    });
    vi.stubGlobal('fetch', mockFetch);
    await render(<SeasonalPicks />);
    expect(mockFetch.mock.calls[0][0]).toBe('/api/products?category=seasonal&limit=3');
    expect(host.textContent).toContain('Winter Bar');
    expect(host.textContent).toContain('Day of the Dead Bar');
    expect(host.querySelector('a[href="/en/catalog?category=seasonal"]')).not.toBeNull();
  });

  it('hides the section when the API is not available', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await render(<SeasonalPicks />);
    expect(host.querySelector('section')).toBeNull();
  });
});
