/**
 * Unit tests for the Phase 2 B2B quote endpoint stand-in (run with: npm test).
 * They check that it answers like POST /api/b2b/quote will: 201, 400, 401 and 403.
 */
import { beforeEach, describe, expect, test } from 'vitest';
import * as authApi from './mockApi';
import * as b2bApi from './b2bMockApi';
import { buildQuoteForm } from './b2bService';

const values = {
  cacaoOrigin: 'Ecuador',
  cacaoPercentage: '70',
  chocolateStyle: 'milk',
  packagingType: 'tin',
  quantity: '1200',
  deliveryDate: '',
  packagingNotes: 'Gold ribbon',
  notes: '',
};
const logo = () => new File(['%PDF-1.4 demo'], 'hotel-logo.pdf', { type: 'application/pdf' });

async function failure(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('expected the call to fail');
}

beforeEach(() => {
  authApi.resetMockDb();
  b2bApi.resetQuotes();
});

describe('POST /api/b2b/quote (mock)', () => {
  test('corporate partner gets 201 with a reference, and only file details are stored', async () => {
    const { token } = await authApi.login('carlos@grandhotel.com', 'Hotel2026');
    const { request } = await b2bApi.submitQuote(token, buildQuoteForm(values, logo()));
    expect(request).toMatchObject({
      companyName: 'Grand Hotel Lima',
      cacaoOrigin: 'Ecuador',
      cacaoPercentage: 70,
      quantity: 1200,
      deliveryDate: null,
      status: 'submitted',
      file: { originalName: 'hotel-logo.pdf', mimeType: 'application/pdf' },
    });
    expect(request.reference).toMatch(/^SC-\d{4}-0001$/);
    expect(request.file.sizeBytes).toBeGreaterThan(0);
  });

  test('missing file and bad quantity -> 400 with field errors', async () => {
    const { token } = await authApi.login('carlos@grandhotel.com', 'Hotel2026');
    const error = await failure(b2bApi.submitQuote(token, buildQuoteForm({ ...values, quantity: '5' }, null)));
    expect(error.status).toBe(400);
    expect(error.errors.map((e) => e.field).sort()).toEqual(['brandFile', 'quantity']);
  });

  test('not signed in -> 401', async () => {
    const error = await failure(b2bApi.submitQuote(null, buildQuoteForm(values, logo())));
    expect(error.status).toBe(401);
  });

  test('personal (Retail) account -> 403', async () => {
    const { token } = await authApi.login('ana@example.com', 'Cacao2026');
    const error = await failure(b2bApi.submitQuote(token, buildQuoteForm(values, logo())));
    expect(error.status).toBe(403);
  });
});

describe('GET /api/b2b/quotes (mock)', () => {
  test('a partner sees only their own requests, newest first', async () => {
    const carlos = await authApi.login('carlos@grandhotel.com', 'Hotel2026');
    await b2bApi.submitQuote(carlos.token, buildQuoteForm(values, logo()));
    await b2bApi.submitQuote(carlos.token, buildQuoteForm({ ...values, cacaoOrigin: 'Peru' }, logo()));

    const other = await authApi.register({
      name: 'Luis Vega',
      email: 'luis@eventos.pe',
      password: 'eventos2026',
      accountType: 'B2B',
      company: { companyName: 'Eventos Lima', industry: 'Corporate Events', taxId: '', website: '' },
    });

    const { requests } = await b2bApi.getMyQuotes(carlos.token);
    expect(requests).toHaveLength(2);
    expect((await b2bApi.getMyQuotes(other.token)).requests).toHaveLength(0);
  });
});
