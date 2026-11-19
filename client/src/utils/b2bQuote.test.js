/**
 * Unit tests for the B2B quote wizard rules (run with: npm test)
 */
import { describe, expect, test } from 'vitest';
import { EMPTY_QUOTE, ORIGINS, fileExtension, stepWithError, validateQuote, validateStep } from './b2bQuote';

const TODAY = '2026-10-28';
const good = {
  ...EMPTY_QUOTE,
  cacaoOrigin: 'Peru',
  cacaoPercentage: '72',
  chocolateStyle: 'dark',
  packagingType: 'giftBox',
  quantity: '500',
  deliveryDate: '2026-12-01',
};
const logo = { name: 'brand-logo.PDF', size: 2 * 1024 * 1024 };

describe('step 1: cacao profile', () => {
  test('origins come from the catalog', () => {
    expect(ORIGINS).toContain('Peru');
    expect(ORIGINS).toEqual([...ORIGINS].sort());
  });
  test('valid profile has no errors', () => {
    expect(validateStep(0, good, null, TODAY)).toEqual({});
  });
  test.each([
    ['34', 'too low'],
    ['101', 'too high'],
    ['70.5', 'not whole'],
    ['', 'empty'],
  ])('percentage %s is rejected (%s)', (pct) => {
    expect(validateStep(0, { ...good, cacaoPercentage: pct }, null, TODAY).cacaoPercentage).toBe('b2b.errors.percentage');
  });
  test('unknown origin and missing style are rejected', () => {
    const errors = validateStep(0, { ...good, cacaoOrigin: 'Atlantis', chocolateStyle: '' }, null, TODAY);
    expect(Object.keys(errors).sort()).toEqual(['cacaoOrigin', 'chocolateStyle']);
  });
});

describe('step 2: brand file', () => {
  test('a file is required', () => {
    expect(validateStep(1, good, null, TODAY).brandFile).toBe('b2b.errors.fileRequired');
  });
  test('file type is checked by extension (any letter case)', () => {
    expect(fileExtension('Logo.SVG')).toBe('svg');
    expect(validateStep(1, good, logo, TODAY)).toEqual({});
    expect(validateStep(1, good, { name: 'logo.exe', size: 10 }, TODAY).brandFile).toBe('b2b.errors.fileType');
  });
  test('files over 10 MB are rejected', () => {
    expect(validateStep(1, good, { name: 'pack.pdf', size: 11 * 1024 * 1024 }, TODAY).brandFile).toBe('b2b.errors.fileSize');
  });
});

describe('step 3: packaging', () => {
  test('quantity must be a whole number of at least 100', () => {
    expect(validateStep(2, { ...good, quantity: '99' }, null, TODAY).quantity).toBe('b2b.errors.quantity');
    expect(validateStep(2, { ...good, quantity: '100' }, null, TODAY)).toEqual({});
  });
  test('delivery date is optional but must be after today', () => {
    expect(validateStep(2, { ...good, deliveryDate: '' }, null, TODAY)).toEqual({});
    expect(validateStep(2, { ...good, deliveryDate: TODAY }, null, TODAY).deliveryDate).toBe('b2b.errors.date');
  });
  test('packaging type is required', () => {
    expect(validateStep(2, { ...good, packagingType: '' }, null, TODAY).packagingType).toBe('b2b.errors.packaging');
  });
});

describe('whole request', () => {
  test('a complete request passes', () => {
    expect(validateQuote(good, logo, TODAY)).toEqual({});
  });
  test('stepWithError finds the first step with a problem', () => {
    expect(stepWithError({ quantity: 'x' })).toBe(2);
    expect(stepWithError({ brandFile: 'x', quantity: 'x' })).toBe(1);
    expect(stepWithError({})).toBe(-1);
  });
});
