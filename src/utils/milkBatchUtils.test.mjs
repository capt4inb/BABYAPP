import assert from 'node:assert/strict';
import test from 'node:test';
import { createMilkBagBatch } from './milkBatchUtils.js';

const defaults = { expressedAt: '2026-09-14T09:00:00Z', storageStatus: 'fridge' };
const row = (volume = '150', quantity = '1', overrides = {}) => ({ volume, quantity, custom: false, ...overrides });

test('expands quantities into individual bags with unique IDs and exact totals', () => {
  const bags = createMilkBagBatch([row('150', '3'), row('180', '2')], defaults);
  assert.equal(bags.length, 5);
  assert.equal(new Set(bags.map(bag => bag.id)).size, 5);
  assert.equal(bags.reduce((sum, bag) => sum + bag.volume_ml, 0), 810);
  assert.ok(bags.every(bag => bag.storage_status === 'fridge' && bag.expressed_at === '2026-09-14T09:00:00.000Z'));
  assert.ok(bags.every(bag => bag.expiry_at === '2026-09-18T09:00:00.000Z'));
});

test('row-specific time and storage override common defaults only when enabled', () => {
  const bags = createMilkBagBatch([
    row('200', '2', { custom: true, expressedAt: '2026-09-13T06:30:00Z', storageStatus: 'room_temp' }),
    row('150', '1', { custom: false, expressedAt: '2020-01-01T00:00:00Z', storageStatus: 'freezer' }),
  ], defaults);
  assert.equal(bags[0].expiry_at, '2026-09-13T10:30:00.000Z');
  assert.equal(bags[1].storage_status, 'room_temp');
  assert.equal(bags[2].expressed_at, '2026-09-14T09:00:00.000Z');
  assert.equal(bags[2].storage_status, 'fridge');
});

test('validates all rows and never mutates drafts when any row is invalid', () => {
  const rows = [row(), row('', '2')];
  const before = structuredClone(rows);
  assert.throws(() => createMilkBagBatch(rows, defaults), /Dòng 2/);
  assert.deepEqual(rows, before);
  for (const quantity of ['0', '-1', '1.5', '', '101', 'abc']) {
    assert.throws(() => createMilkBagBatch([row('150', quantity)], defaults));
  }
  for (const volume of ['0', '-1', '1001', '', 'abc']) {
    assert.throws(() => createMilkBagBatch([row(volume)], defaults));
  }
});

test('rejects invalid times, storage and an oversized total batch', () => {
  assert.throws(() => createMilkBagBatch([], defaults));
  assert.throws(() => createMilkBagBatch([row()], { ...defaults, expressedAt: 'invalid' }));
  assert.throws(() => createMilkBagBatch([row()], { ...defaults, storageStatus: 'used' }));
  assert.throws(() => createMilkBagBatch([row('150', '60'), row('200', '41')], defaults), /100/);
  assert.equal(createMilkBagBatch([row('150', '100')], defaults).length, 100);
});

test('one-bag and decimal-volume entries remain supported', () => {
  const bags = createMilkBagBatch([row('150.5')], defaults);
  assert.equal(bags.length, 1);
  assert.equal(bags[0].volume_ml, 150.5);
});
