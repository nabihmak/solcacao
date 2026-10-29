import { describe, expect, it } from 'vitest';
import { validateSupport, whatsappUrl, saveDemoSubmission } from './support';
const valid = { name: 'Ana', email: 'ana@example.com', category: 'support', message: 'A question about chocolate.', consent: true, rating: '5', flavors: ['dark70', 'milk', 'coffee'], quantity: '2' };
describe('Student 5 validation', () => {
  it.each(['contact', 'feedback', 'sampler'])('accepts a valid %s', type => expect(validateSupport(valid, type)).toEqual({}));
  it('rejects blank, malformed and unacknowledged contact entries', () => {
    expect(Object.keys(validateSupport({ ...valid, name: ' ', email: 'invalid', category: 'unknown', message: 'short', consent: false }, 'contact'))).toEqual(['name','email','category','message','consent']);
  });
  it.each(['0','6','bad'])('rejects feedback rating %s', rating => expect(validateSupport({...valid, rating}, 'feedback')).toHaveProperty('rating'));
  it.each([[], ['dark70','milk'], ['dark70','dark70','milk'], ['dark70','milk','unknown']])('rejects invalid sampler selections %j', (...flavors) => {
    // test.each spreads array cases; reconstruct the selected flavors.
    expect(validateSupport({...valid, flavors}, 'sampler')).toHaveProperty('flavors');
  });
  it.each(['0','51','1.5','NaN',''])('rejects quantity %s', quantity => expect(validateSupport({...valid, quantity}, 'sampler')).toHaveProperty('quantity'));
  it('rejects messages beyond the limit', () => expect(validateSupport({...valid, message: 'x'.repeat(2001)}, 'contact')).toHaveProperty('message'));
  it('encodes WhatsApp text and disables missing or malformed numbers', () => {
    expect(whatsappUrl('', 'hello')).toBeNull();
    expect(whatsappUrl('+1 555', 'hello')).toBeNull();
    expect(whatsappUrl('15551234567', 'Hello & hola')).toBe('https://wa.me/15551234567?text=Hello%20%26%20hola');
  });
  it('stores a demo receipt without personal data', () => {
    let stored;
    saveDemoSubmission(valid, 'contact', {setItem: (_key, value) => { stored = JSON.parse(value); }});
    expect(stored.status).toBe('demo-only');
    expect(Object.keys(stored).sort()).toEqual(['createdAt','status','type']);
  });
  it('exposes storage failures so the UI cannot claim a saved receipt', () => expect(() => saveDemoSubmission(valid, 'contact', {setItem: () => {throw new Error('blocked');}})).toThrow('blocked'));
});
