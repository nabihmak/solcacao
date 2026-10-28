/**
 * Unit tests for the client-side validation rules (run with: npm test)
 */
import { describe, expect, test } from 'vitest';
import { collectErrors, email, matches, password, required, website } from './validation';

describe('required', () => {
  test('empty or blank text is an error', () => {
    expect(required('')).toBe('auth.errors.required');
    expect(required('   ')).toBe('auth.errors.required');
    expect(required(undefined)).toBe('auth.errors.required');
  });
  test('text is valid', () => {
    expect(required('Ana')).toBeNull();
  });
});

describe('email', () => {
  test.each(['ana@example.com', ' carlos@grandhotel.com '])('%s is valid', (value) => {
    expect(email(value)).toBeNull();
  });
  test.each(['ana', 'ana@', 'ana@example', 'ana example@x.com'])('%s is invalid', (value) => {
    expect(email(value)).toBe('auth.errors.email');
  });
});

describe('password', () => {
  test('8+ characters with a letter and a number is valid', () => {
    expect(password('cacao123')).toBeNull();
  });
  test.each([
    ['too short', 'abc12'],
    ['no number', 'onlyletters'],
    ['no letter', '12345678'],
  ])('%s is invalid', (_label, value) => {
    expect(password(value)).toBe('auth.errors.passwordRules');
  });
});

describe('matches', () => {
  test('different passwords are an error', () => {
    expect(matches('cacao123', 'cacao999')).toBe('auth.errors.passwordMatch');
  });
  test('same passwords are valid', () => {
    expect(matches('cacao123', 'cacao123')).toBeNull();
  });
});

describe('website (optional)', () => {
  test('empty is allowed', () => {
    expect(website('')).toBeNull();
  });
  test('needs http:// or https://', () => {
    expect(website('grandhotel.com')).toBe('auth.errors.website');
    expect(website('https://grandhotel.com')).toBeNull();
  });
});

describe('collectErrors', () => {
  test('keeps only the failed checks', () => {
    expect(collectErrors({ name: null, email: 'auth.errors.email' })).toEqual({ email: 'auth.errors.email' });
  });
});
