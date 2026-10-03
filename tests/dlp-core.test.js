const test = require('node:test');
const assert = require('node:assert/strict');
const { maskSensitive, luhnValid, MASK } = require('../dlp-core.js');

test('masks Luhn-valid card numbers in several formats', () => {
  for (const card of ['4111111111111111', '4111 1111 1111 1111', '4111-1111-1111-1111']) {
    const { masked, found } = maskSensitive(`pay with ${card} please`);
    assert.equal(found, true, card);
    assert.equal(masked, `pay with ${MASK} please`);
  }
});

test('leaves numbers that fail the Luhn check alone', () => {
  const { masked, found } = maskSensitive('order 4111111111111112 shipped');
  assert.equal(found, false);
  assert.equal(masked, 'order 4111111111111112 shipped');
});

test('result is stable across repeated calls (no regex lastIndex leak)', () => {
  const results = Array.from({ length: 6 }, () => maskSensitive('mail me at a.b@example.com').found);
  assert.deepEqual(results, [true, true, true, true, true, true]);
});

test('masks emails and phone numbers', () => {
  assert.equal(maskSensitive('a.b@example.com').masked, MASK);
  assert.equal(maskSensitive('call +7 912 345 67 89 now').masked, `call ${MASK} now`);
  assert.equal(maskSensitive('call (555) 123-4567 now').masked, `call ${MASK} now`);
});

test('does not touch ordinary text or long non-phone numbers', () => {
  assert.equal(maskSensitive('hello world 2026').found, false);
  assert.equal(maskSensitive('id 12345678901234567890123').found, false);
});

test('luhnValid', () => {
  assert.equal(luhnValid('79927398713'), true);
  assert.equal(luhnValid('79927398710'), false);
});
