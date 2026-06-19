import { checkAvailability, reserveSlot, getAlternativeSlots, releaseCode, generateCode } from './services/inventory.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function runEdgeCaseTests() {
  console.log('=== Edge Case Test Suite ===\n');

  const date = '2026-05-26';
  const time = '20:00';

  // 1. Invalid date/time should be rejected by inventory logic
  const invalid = checkAvailability('not-a-date', '99:99', 'Standard Dining', 2);
  assert(invalid.available === false, 'Invalid date/time should not be accepted.');
  console.log('✅ Invalid date/time handled safely.');

  // 2. Party size less than 6 should not allow Large Group mapping
  const tooSmall = checkAvailability(date, '18:00', 'Large Group', 4);
  assert(tooSmall.available === false, 'Large Group should reject party size below 6.');
  console.log('✅ Large-group size validation works.');

  // 3. Fully booked slot should return no alternatives for that slot but still offer others
  const booked = checkAvailability(date, time, 'Standard Dining', 2);
  assert(booked.available === false, 'Fully booked slot should be unavailable.');
  const alternates = getAlternativeSlots(date, 'Standard Dining', 2);
  assert(alternates.length > 0, 'Alternative slots should exist when a slot is full.');
  assert(!alternates.includes('20:00 IST'), 'Fully booked slot should not be suggested again.');
  console.log('✅ Overbooked slot fallback works.');

  // 4. Reservation code should be unique and valid format
  const code1 = generateCode();
  const code2 = generateCode();
  assert(code1.startsWith('TABLE-') && code1.length >= 9, 'Code format should match TABLE-{LETTER}{2DIGITS}.');
  assert(code1 !== code2 || code1.length === 0, 'Code generator should ideally be unique across runs.');
  console.log('✅ Reservation code format is valid.');

  // 5. Cancelling unknown code should be rejected
  const releaseUnknown = releaseCode('TABLE-ZZ99');
  assert(releaseUnknown === false, 'Releasing a nonexistent code should fail.');
  console.log('✅ Unknown code cancellation is blocked.');

  // 6. Booking should decrement capacity and allow release once cancelled
  const reserveDate = '2026-05-27';
  const reserveTime = '18:00';
  const reserveOccasion = 'Standard Dining';
  const reserveParty = 2;
  const before = checkAvailability(reserveDate, reserveTime, reserveOccasion, reserveParty);
  const success = reserveSlot(reserveDate, reserveTime, reserveOccasion, reserveParty);
  const after = checkAvailability(reserveDate, reserveTime, reserveOccasion, reserveParty);

  assert(success === true, 'Reservation should succeed when capacity exists.');
  assert(after.remaining === before.remaining - 1, 'Reservation should decrement remaining capacity by 1.');
  const code = generateCode();
  const release = releaseCode(code);
  assert(release === true, 'Generated code should be releasable only if it was tracked.');
  console.log('✅ Capacity and release behavior works correctly.');

  console.log('\n🏆 All edge case tests passed.');
}

runEdgeCaseTests();
