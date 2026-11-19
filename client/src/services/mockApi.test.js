/**
 * Unit tests for the Phase 2 in-browser data layer (run with: npm test).
 * They check that it answers like the planned REST API: same data, same error codes.
 */
import { beforeEach, describe, expect, test } from 'vitest';
import * as api from './mockApi';

const retail = { name: 'María Gómez', email: 'maria@example.com', password: 'cacao1234', accountType: 'Retail' };
const b2b = {
  name: 'Luis Vega',
  email: 'luis@eventos.pe',
  password: 'eventos2026',
  accountType: 'B2B',
  company: { companyName: 'Eventos Lima', industry: 'Corporate Events', taxId: '', website: '' },
};

// Runs a call that should fail and returns the error
async function failure(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('expected the call to fail');
}

beforeEach(() => {
  api.resetMockDb();
});

describe('register', () => {
  test('creates a Retail account and returns a token + user without the password', async () => {
    const { token, user } = await api.register(retail);
    expect(token).toBeTruthy();
    expect(user).toMatchObject({
      name: 'María Gómez',
      email: 'maria@example.com',
      accountType: 'Retail',
      corporatePartner: null,
    });
    expect(user.passwordHash).toBeUndefined();
  });

  test('creates a B2B account with company details', async () => {
    const { user } = await api.register(b2b);
    expect(user.corporatePartner).toMatchObject({ companyName: 'Eventos Lima', industry: 'Corporate Events' });
  });

  test('missing company for B2B -> 400 with field errors', async () => {
    const error = await failure(api.register({ ...b2b, company: {} }));
    expect(error.status).toBe(400);
    expect(error.errors.map((e) => e.field)).toEqual(
      expect.arrayContaining(['company.companyName', 'company.industry'])
    );
  });

  test('weak password -> 400', async () => {
    const error = await failure(api.register({ ...retail, password: 'short' }));
    expect(error.status).toBe(400);
    expect(error.errors[0].field).toBe('password');
  });

  test('email already used (any letter case) -> 409', async () => {
    await api.register(retail);
    const error = await failure(api.register({ ...retail, email: 'MARIA@example.com' }));
    expect(error.status).toBe(409);
  });
});

describe('login and session', () => {
  test('demo account signs in -> token + user', async () => {
    const { token, user } = await api.login('ana@example.com', 'Cacao2026');
    expect(token).toBeTruthy();
    expect(user.name).toBe('Ana López');
  });

  test('wrong password and unknown email give the same 401 message', async () => {
    const wrong = await failure(api.login('ana@example.com', 'nope12345'));
    const unknown = await failure(api.login('nobody@example.com', 'Cacao2026'));
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.message).toBe(unknown.message);
  });

  test('getMe needs a valid token', async () => {
    const { token } = await api.login('ana@example.com', 'Cacao2026');
    expect((await api.getMe(token)).user.email).toBe('ana@example.com');
    expect((await failure(api.getMe('fake-token'))).status).toBe(401);
  });

  test('logout ends the session', async () => {
    const { token } = await api.login('ana@example.com', 'Cacao2026');
    await api.logout(token);
    expect((await failure(api.getMe(token))).status).toBe(401);
  });
});

describe('profile and password', () => {
  test('updates name and language, but never email or account type', async () => {
    const { token } = await api.register(retail);
    const { user } = await api.updateProfile(token, {
      name: 'María G.',
      preferredLanguage: 'es',
      email: 'x@x.com',
      accountType: 'B2B',
    });
    expect(user).toMatchObject({
      name: 'María G.',
      preferredLanguage: 'es',
      email: 'maria@example.com',
      accountType: 'Retail',
    });
  });

  test('Retail account cannot save company details -> 400', async () => {
    const { token } = await api.register(retail);
    expect((await failure(api.updateProfile(token, { company: { companyName: 'X Corp' } }))).status).toBe(400);
  });

  test('password change: wrong current -> 400; correct -> new password works', async () => {
    const { token } = await api.register(retail);
    expect((await failure(api.changePassword(token, 'wrong1234', 'newCacao99'))).status).toBe(400);
    await api.changePassword(token, 'cacao1234', 'newCacao99');
    expect((await failure(api.login('maria@example.com', 'cacao1234'))).status).toBe(401);
    expect((await api.login('maria@example.com', 'newCacao99')).user.name).toBe('María Gómez');
  });
});

describe('addresses', () => {
  const home = { label: 'Home', street: '210 W 6th St', city: 'Austin', postalCode: '78701', country: 'United States' };
  const office = {
    label: 'Office',
    street: '500 Commerce Ave',
    city: 'Dallas',
    postalCode: '75201',
    country: 'United States',
  };

  test('first address becomes the default; a new default replaces it', async () => {
    const { token } = await api.register(retail);
    const first = (await api.addAddress(token, home)).address;
    expect(first.isDefault).toBe(true);
    await api.addAddress(token, { ...office, isDefault: true });
    const { addresses } = await api.getAddresses(token);
    expect(addresses.map((a) => [a.label, a.isDefault])).toEqual([
      ['Office', true],
      ['Home', false],
    ]);
  });

  test('missing required fields -> 400', async () => {
    const { token } = await api.register(retail);
    const error = await failure(api.addAddress(token, { label: 'Home' }));
    expect(error.status).toBe(400);
    expect(error.errors.map((e) => e.field)).toEqual(['street', 'city', 'postalCode', 'country']);
  });

  test("another user's address cannot be changed or deleted -> 404", async () => {
    const owner = await api.register(retail);
    const other = await api.register(b2b);
    const { address } = await api.addAddress(owner.token, home);
    expect((await failure(api.updateAddress(other.token, address._id, { city: 'X' }))).status).toBe(404);
    expect((await failure(api.deleteAddress(other.token, address._id))).status).toBe(404);
  });

  test('deleting the default makes the next address the default', async () => {
    const { token } = await api.register(retail);
    const first = (await api.addAddress(token, home)).address;
    await api.addAddress(token, office);
    await api.deleteAddress(token, first._id);
    const { addresses } = await api.getAddresses(token);
    expect(addresses).toHaveLength(1);
    expect(addresses[0]).toMatchObject({ label: 'Office', isDefault: true });
  });
});
