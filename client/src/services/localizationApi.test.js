
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  fetchTranslationDictionary,
} from './localizationApi';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Student 2 - Localization API Integration', () => {
  it('fetches English translations', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        nav: { home: 'Home' },
      }),
    });

    vi.stubGlobal('fetch', mockFetch);

    const data = await fetchTranslationDictionary('en');

    expect(data.nav.home).toBe('Home');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/i18n/en',
      { signal: undefined }
    );
  });

  it('fetches Spanish translations', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        nav: { home: 'Inicio' },
      }),
    });

    vi.stubGlobal('fetch', mockFetch);

    const data = await fetchTranslationDictionary('es');

    expect(data.nav.home).toBe('Inicio');
  });

  it('handles unsupported language errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
      })
    );

    await expect(
      fetchTranslationDictionary('fr')
    ).rejects.toThrow('HTTP 400');
  });

  it('rejects invalid translation responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => null,
      })
    );

    await expect(
      fetchTranslationDictionary('en')
    ).rejects.toThrow('Invalid translation response');
  });

  it('passes the abort signal to fetch', async () => {
    const controller = new AbortController();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        nav: { home: 'Inicio' },
      }),
    });

    vi.stubGlobal('fetch', mockFetch);

    await fetchTranslationDictionary('es', {
      signal: controller.signal,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/i18n/es',
      { signal: controller.signal }
    );
  });
});
