import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SlotCapacities {
  standard: number;
  large_group: number;
  outdoor: number;
  special: number;
  bar: number;
}

export interface DayInventory {
  [timeSlot: string]: SlotCapacities;
}

export interface InventoryDatabase {
  [dateStr: string]: DayInventory;
}

// Memory database with default seed data
let inventoryDb: InventoryDatabase = {};

const defaultSlots: DayInventory = {
  "18:00": { standard: 4, large_group: 2, outdoor: 3, special: 2, bar: 6 },
  "19:00": { standard: 3, large_group: 0, outdoor: 2, special: 1, bar: 4 }, // 19:00 standard full quickly
  "20:00": { standard: 0, large_group: 0, outdoor: 0, special: 0, bar: 2 }, // 20:00 fully booked standard
  "21:00": { standard: 5, large_group: 1, outdoor: 4, special: 3, bar: 5 }
};

// Seed next 14 days
const seedInventory = () => {
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    inventoryDb[dateStr] = JSON.parse(JSON.stringify(defaultSlots));
  }
};

seedInventory();

// Translate occasion types to schema keys
export const mapOccasionToKey = (occasion: string): keyof SlotCapacities => {
  const o = occasion.toLowerCase();
  if (o.includes('large') || o.includes('group')) return 'large_group';
  if (o.includes('out') || o.includes('patio')) return 'outdoor';
  if (o.includes('anniversary') || o.includes('special') || o.includes('birthday')) return 'special';
  if (o.includes('bar') || o.includes('lounge')) return 'bar';
  return 'standard';
};

/**
 * Check if the requested table slot is available.
 */
export const checkAvailability = (
  date: string,
  time: string,
  occasion: string,
  partySize: number
): { available: boolean; remaining: number } => {
  // Normalize date format YYYY-MM-DD
  const dateKey = date.trim();
  const timeKey = time.trim(); // expected format "HH:MM" e.g., "19:00"
  
  if (!inventoryDb[dateKey]) {
    // If date is within range but not seeded, seed it
    inventoryDb[dateKey] = JSON.parse(JSON.stringify(defaultSlots));
  }
  
  const dayInv = inventoryDb[dateKey];
  if (!dayInv || !dayInv[timeKey]) {
    return { available: false, remaining: 0 };
  }
  
  const occasionKey = mapOccasionToKey(occasion);
  const capacity = dayInv[timeKey][occasionKey];
  
  // Large group constraint
  if (occasionKey === 'large_group' && partySize < 6) {
    // Large group needs at least 6 people, advise standard
    return { available: false, remaining: capacity };
  }
  
  return {
    available: capacity > 0,
    remaining: capacity
  };
};

/**
 * Reserve a table slot (decrement capacity).
 */
export const reserveSlot = (
  date: string,
  time: string,
  occasion: string,
  partySize: number
): boolean => {
  const dateKey = date.trim();
  const timeKey = time.trim();
  const occasionKey = mapOccasionToKey(occasion);
  
  const { available } = checkAvailability(dateKey, timeKey, occasion, partySize);
  if (!available) return false;
  
  inventoryDb[dateKey][timeKey][occasionKey]--;
  return true;
};

/**
 * Fetch closest available slots for a given date and occasion.
 */
export const getAlternativeSlots = (date: string, occasion: string, partySize: number): string[] => {
  const dateKey = date.trim();
  const dayInv = inventoryDb[dateKey] || defaultSlots;
  const occasionKey = mapOccasionToKey(occasion);
  
  const alternatives: string[] = [];
  
  Object.keys(dayInv).forEach((slot) => {
    if (dayInv[slot][occasionKey] > 0) {
      // Large group validation
      if (occasionKey === 'large_group' && partySize < 6) return;
      alternatives.push(`${slot} IST`);
    }
  });
  
  return alternatives;
};

// Map to keep track of active reservation codes to prevent collisions
const activeCodes = new Set<string>();

/**
 * Generate a collision-resistant reservation code.
 * Format: TABLE-{LETTER}{2DIGITS} (excludes I and O, digits 10-99)
 */
export const generateCode = (): string => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excludes I and O
  let attempts = 0;
  
  while (attempts < 1000) {
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const digits = Math.floor(Math.random() * 90) + 10; // 10 to 99
    const code = `TABLE-${letter}${digits}`;
    
    if (!activeCodes.has(code)) {
      activeCodes.add(code);
      return code;
    }
    attempts++;
  }
  
  // Suffix fallback in extreme collision states
  const timestampCode = `TABLE-Z${Date.now().toString().slice(-2)}`;
  activeCodes.add(timestampCode);
  return timestampCode;
};

/**
 * Release a reservation code (upon cancellation).
 */
export const releaseCode = (code: string): boolean => {
  return activeCodes.delete(code.trim().toUpperCase());
};
