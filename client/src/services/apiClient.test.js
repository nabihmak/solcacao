// Unit tests for apiClient (Student 1). fetch is replaced, so no server is needed.
import { afterEach, describe, expect, test, vi } from 'vitest';
import { apiRequest } from './apiClient';
import { tokenStorage } from './tokenStorage';

function reply(status, body) {
  return vi.fn().mockResolvedValue({ status, ok: status < 400, json: async () => body });
}

afterEach(() => {
  vi.unstubAllGlobals();
  tokenStorage.clear();
});

describe('apiRequest', () => {
  test('sends JSON and the saved token, returns the data', async () => {
    tokenStorage.set('abc123');
    const fetchMock = reply(200, { user: { name: 'Ana' } });
    vi.stubGlobal('fetch', fetchMock);

    const data = await apiRequest('/api/users/profile', { method: 'PUT', body: { name: 'Ana' } });

    expect(data).toEqual({ user: { name: 'Ana' } });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/users/profile');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer abc123' });
    expect(options.body).toBe('{"name":"Ana"}');
  });

  test('token: null sends no Authorization header (sign-in, sign-up)', async () => {
    tokenStorage.set('abc123');
    const fetchMock = reply(200, {});
    vi.stubGlobal('fetch', fetchMock);
    await apiRequest('/api/auth/login', { method: 'POST', body: {}, token: null });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  test('an error answer throws status, message and field errors', async () => {
    const errors = [{ field: 'email', message: 'auth.errors.email' }];
    vi.stubGlobal('fetch', reply(400, { message: 'Validation failed', errors }));
    await expect(apiRequest('/api/auth/register', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 400,
      message: 'Validation failed',
      errors,
    });
  });

  test('no connection throws status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(apiRequest('/api/auth/me')).rejects.toMatchObject({ status: 0 });
  });

  test('a FormData body (file upload) is sent as is, without a JSON content type', async () => {
    tokenStorage.set('abc123');
    const fetchMock = reply(201, { request: { reference: 'SC-2026-0001' } });
    vi.stubGlobal('fetch', fetchMock);
    const form = new FormData();
    form.append('caption', '{}');
    const data = await apiRequest('/api/b2b/quote', { method: 'POST', body: form });
    expect(data.request.reference).toBe('SC-2026-0001');
    const [, options] = fetchMock.mock.calls[0];
    expect(options.body).toBe(form);
    expect(options.headers).toEqual({ Authorization: 'Bearer abc123' });
  });

  test('204 No Content returns null', async () => {
    vi.stubGlobal('fetch', reply(204));
    expect(await apiRequest('/api/auth/logout', { method: 'POST' })).toBeNull();
  });
});
