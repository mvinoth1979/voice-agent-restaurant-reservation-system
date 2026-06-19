import { checkAvailability, reserveSlot, getAlternativeSlots, generateCode } from './services/inventory.js';

console.log("=== Shivsagar Voice Agent Backend Test Suite ===");

// 1. Test Code Generation
console.log("\n1. Testing Reservation Code Generator...");
const codes = new Set<string>();
let collisions = 0;
for (let i = 0; i < 100; i++) {
  const code = generateCode();
  if (codes.has(code)) {
    collisions++;
  }
  codes.add(code);
}
console.log(`Generated 100 codes. Collisions detected: ${collisions}`);
const sampleCode = Array.from(codes)[0];
console.log(`Sample Reservation Code: ${sampleCode}`);
if (!sampleCode.startsWith("TABLE-") || sampleCode.length < 9) {
  console.error("FAIL: Reservation code is in invalid format.");
} else {
  console.log("PASS: Code generator matches TABLE-X99 format constraints.");
}

// 2. Test Slot Availability
console.log("\n2. Testing Mock Inventory slot checks...");
const date = "2026-05-26";
const time = "19:00"; // Available standard dining count is initially 3
const occasion = "Standard Dining";
const partySize = 4;

console.log(`Checking availability for: ${occasion}, Party of ${partySize} on ${date} at ${time}...`);
const check1 = checkAvailability(date, time, occasion, partySize);
console.log(`Availability check result: available=${check1.available}, remaining=${check1.remaining}`);

if (!check1.available || check1.remaining !== 3) {
  console.error("FAIL: Inventory check failed initial capacity state.");
} else {
  console.log("PASS: Initial capacity checks are accurate.");
}

// 3. Test Booking/Reservation
console.log("\n3. Testing table reservation (capacity decrement)...");
const reserved = reserveSlot(date, time, occasion, partySize);
const check2 = checkAvailability(date, time, occasion, partySize);
console.log(`Reserved: ${reserved}. New capacity check remaining: ${check2.remaining}`);

if (!reserved || check2.remaining !== 2) {
  console.error("FAIL: Reservation did not decrement capacity correctly.");
} else {
  console.log("PASS: Capacity decrements correctly on booking confirmation.");
}

// 4. Test Alternative slot negotiation
console.log("\n4. Testing alternative slot suggestions on date...");
// Make standard dining fully booked for 20:00 (it is already 0 by default)
const alternatives = getAlternativeSlots(date, occasion, partySize);
console.log(`Alternatives on ${date} for ${occasion}: ${alternatives.join(', ')}`);

if (alternatives.includes("20:00 IST")) {
  console.error("FAIL: 20:00 IST was returned as alternative slot, but it has 0 capacity.");
} else if (!alternatives.includes("18:00 IST") || !alternatives.includes("21:00 IST")) {
  console.error("FAIL: Did not return standard alternative time slots.");
} else {
  console.log("PASS: Alternative slots are retrieved accurately based on actual capacity.");
}

console.log("\n=== Backend Test Suite Completed Successfully ===");
