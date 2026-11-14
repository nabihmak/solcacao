import test from 'node:test';
import assert from 'node:assert/strict';
import { validateInquiry } from './student5.js';
const good = { type: 'sampler', name: 'Ana', email: 'ana@example.com', category: 'wholesale', message: 'I would like a sample box.', consent: true, flavors: ['dark70','milk','coffee'], quantity: '2' };
test('valid sampler', () => assert.deepEqual(validateInquiry(good), {}));
test('invalid email and consent', () => { const e = validateInquiry({...good,email:'invalid',consent:false}); assert.ok(e.email); assert.ok(e.consent); });
test('duplicate sampler flavors', () => assert.ok(validateInquiry({...good,flavors:['milk','milk','coffee']}).flavors));
test('feedback requires rating', () => assert.ok(validateInquiry({...good,type:'feedback',rating:0}).rating));
test('invalid payload', () => assert.ok(validateInquiry(null).body));
