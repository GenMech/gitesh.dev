import test from 'node:test';
import assert from 'node:assert/strict';
import { describeByte, toggleBit } from '../src/assets/byte.mjs';

test('represents the initials G and P in binary, decimal, hex and ASCII', () => {
  assert.deepEqual(describeByte(71), { binary: '01000111', decimal: 71, hex: '0x47', ascii: 'G' });
  assert.deepEqual(describeByte(80), { binary: '01010000', decimal: 80, hex: '0x50', ascii: 'P' });
});

test('labels control, space, delete, and non-ASCII values accurately', () => {
  assert.equal(describeByte(0).ascii, 'NUL');
  assert.equal(describeByte(10).ascii, 'LF');
  assert.equal(describeByte(31).ascii, 'US');
  assert.equal(describeByte(32).ascii, 'Space');
  assert.equal(describeByte(126).ascii, '~');
  assert.equal(describeByte(127).ascii, 'DEL');
  assert.equal(describeByte(128).ascii, 'Non-ASCII');
  assert.deepEqual(describeByte(255), { binary: '11111111', decimal: 255, hex: '0xFF', ascii: 'Non-ASCII' });
});

test('every byte has an eight-digit binary representation and round-trips', () => {
  for (let value = 0; value <= 255; value++) {
    const result = describeByte(value);
    assert.equal(result.binary.length, 8);
    assert.equal(parseInt(result.binary, 2), value);
    assert.equal(parseInt(result.hex, 16), value);
    for (let bit = 0; bit < 8; bit++) {
      assert.equal(toggleBit(toggleBit(value, bit), bit), value);
      assert.equal(Math.abs(toggleBit(value, bit) - value), 2 ** bit);
    }
  }
});

test('switches the most and least significant bits independently', () => {
  assert.equal(toggleBit(0, 7), 128);
  assert.equal(toggleBit(0, 0), 1);
  assert.equal(toggleBit(255, 7), 127);
  assert.equal(toggleBit(71, 0), 70);
});

test('rejects values that cannot describe a byte or bit', () => {
  for (const value of [-1, 256, 1.5, NaN, Infinity, '71', null]) {
    assert.throws(() => describeByte(value), RangeError);
    assert.throws(() => toggleBit(value, 0), RangeError);
  }
  for (const bit of [-1, 8, 0.5, NaN, '0']) assert.throws(() => toggleBit(71, bit), RangeError);
});
