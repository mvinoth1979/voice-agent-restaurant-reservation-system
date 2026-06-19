import { checkAvailability, reserveSlot, getAlternativeSlots } from './services/inventory.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function runEvalChecks() {
  console.log('=== Evaluation Suite ===\n');

  const date = '2026-05-26';
  const occasion = 'Standard Dining';
  const partySize = 4;

  // Eval 1: Success path should book and reduce inventory
  const successCheck = checkAvailability(date, '18:00', occasion, partySize);
  assert(successCheck.available === true, 'Expected 18:00 to be available for party of 4.');
  const success = reserveSlot(date, '18:00', occasion, partySize);
  assert(success === true, 'Booking for available slot should succeed.');
  console.log('✅ Success path booking works.');

  // Eval 2: Failure path should not book an unavailable slot
  const failCheck = checkAvailability(date, '20:00', occasion, partySize);
  assert(failCheck.available === false, 'Expected 20:00 to be unavailable.');
  const failBooking = reserveSlot(date, '20:00', occasion, partySize);
  assert(failBooking === false, 'Booking should fail for an unavailable slot.');
  console.log('✅ Failure path booking is blocked.');

  // Eval 3: Alternative slots should be returned and exclude the full slot
  const alternatives = getAlternativeSlots(date, occasion, partySize);
  assert(alternatives.length >= 3, 'Expected multiple alternatives for a full slot scenario.');
  assert(!alternatives.includes('20:00 IST'), 'Full slot should not appear as an alternative.');
  console.log('✅ Alternative slot recommendations are sensible.');

  // Eval 4: Reservation flow should preserve capacity invariants
  const postBookingCheck = checkAvailability(date, '18:00', occasion, partySize);
  assert(postBookingCheck.remaining === successCheck.remaining - 1, 'Remaining capacity should reflect booking updates.');
  console.log('✅ Capacity invariant is preserved.');

  console.log('\n🏆 Evaluations passed.');
}

runEvalChecks();
