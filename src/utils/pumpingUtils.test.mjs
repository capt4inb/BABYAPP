import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPumpCountdown, getPumpReminder, getPumpSessions, isValidPumpInterval } from './pumpingUtils.js';

const at = value => new Date(value).getTime();
const schedule = { enabled: true, intervalMinutes: 180 };
const session = completedAt => ({ id: completedAt, completedAt });

test('milk bag data never starts or changes the countdown', () => {
  const milkBags = [{ id: 'bag', expressed_at: '2026-09-10T10:00:00Z', volume_ml: 240 }];
  assert.deepEqual(getPumpSessions(milkBags), []);
  assert.equal(getPumpReminder(getPumpSessions(milkBags), schedule, at('2026-09-10T11:00:00Z')).nextMs, null);
  const recorded = session('2026-09-10T09:00:00Z');
  const original = getPumpReminder(getPumpSessions([recorded]), schedule, at('2026-09-10T11:00:00Z'));
  milkBags[0].expressed_at = '2026-09-10T10:30:00Z';
  milkBags.push({ id: 'new-bag', expressed_at: '2026-09-10T10:59:00Z' });
  assert.deepEqual(getPumpReminder(getPumpSessions([recorded, ...milkBags]), schedule, at('2026-09-10T11:00:00Z')), original);
  assert.deepEqual(getPumpReminder(getPumpSessions([recorded]), schedule, at('2026-09-10T11:00:00Z')), original);
});

test('only explicit pumping records are sorted, including separate entries in the same minute', () => {
  const sessions = getPumpSessions([
    session('2026-09-10T10:30:05Z'), session('2026-09-10T10:30:40Z'),
    session('invalid'), session(null), session(''), session('2026-09-10T08:00:00Z'),
  ]);
  assert.equal(sessions.length, 3);
  assert.equal(sessions[0].completedMs, at('2026-09-10T10:30:40Z'));
});

test('default countdown starts at three hours from completion', () => {
  const sessions = getPumpSessions([session('2026-09-10T09:00:00Z')]);
  const reminder = getPumpReminder(sessions, undefined, at('2026-09-10T09:00:00Z'));
  assert.equal(reminder.nextMs, at('2026-09-10T12:00:00Z'));
  assert.equal(formatPumpCountdown(reminder.remainingMs), '03:00:00');
  assert.equal(formatPumpCountdown(getPumpReminder(sessions, undefined, at('2026-09-10T09:00:01Z')).remainingMs), '02:59:59');
});

test('a backdated or future pumping record cannot reset the latest completed session', () => {
  const sessions = getPumpSessions([
    session('2026-09-10T09:00:00Z'), session('2026-09-10T06:00:00Z'), session('2026-09-11T12:00:00Z'),
  ]);
  const reminder = getPumpReminder(sessions, schedule, at('2026-09-10T10:00:00Z'));
  assert.equal(reminder.nextMs, at('2026-09-10T12:00:00Z'));
  assert.equal(formatPumpCountdown(reminder.remainingMs), '02:00:00');
});

test('countdown keeps its deadline after serialization, reload and crossing midnight', () => {
  const stored = JSON.parse(JSON.stringify([session('2026-09-10T23:00:00Z')]));
  const sessions = getPumpSessions(stored);
  const first = getPumpReminder(sessions, schedule, at('2026-09-10T23:00:00Z'));
  const later = getPumpReminder(sessions, schedule, at('2026-09-11T01:59:58Z'));
  assert.equal(first.nextMs, later.nextMs);
  assert.equal(formatPumpCountdown(later.remainingMs), '00:00:02');
  assert.equal(getPumpReminder(sessions, schedule, later.nextMs).due, true);
  assert.equal(getPumpReminder(sessions, schedule, later.nextMs + 60000).overdueMs, 60000);
  assert.equal(formatPumpCountdown(getPumpReminder(sessions, schedule, later.nextMs + 60000).remainingMs), '00:00:00');
});

test('disabled reminders and no pumping records do not show a deadline', () => {
  const sessions = getPumpSessions([session('2026-09-09T01:00:00Z')]);
  const reminder = getPumpReminder(sessions, { ...schedule, enabled: false }, at('2026-09-10T01:00:00Z'));
  assert.equal(reminder.nextMs, null);
  assert.equal(reminder.due, false);
  assert.equal(getPumpReminder([], schedule, Date.now()).remainingMs, null);
});

test('editing the interval or latest session immediately recalculates the deadline', () => {
  const sessions = getPumpSessions([session('2026-09-10T09:00:00Z')]);
  const reminder = getPumpReminder(sessions, { ...schedule, intervalMinutes: 90 }, at('2026-09-10T10:00:00Z'));
  assert.equal(formatPumpCountdown(reminder.remainingMs), '00:30:00');
  const edited = getPumpSessions([session('2026-09-10T08:00:00Z')]);
  assert.equal(getPumpReminder(edited, schedule, at('2026-09-10T10:00:00Z')).nextMs, at('2026-09-10T11:00:00Z'));
});

test('interval bounds and second formatting are explicit', () => {
  for (const minutes of [0, -1, 1441, NaN, 1.5, '180']) assert.equal(isValidPumpInterval(minutes), false);
  for (const minutes of [1, 90, 180, 1440]) assert.equal(isValidPumpInterval(minutes), true);
  assert.equal(formatPumpCountdown(null), '--:--:--');
  assert.equal(formatPumpCountdown(1), '00:00:01');
  assert.equal(formatPumpCountdown(3600000), '01:00:00');
});
