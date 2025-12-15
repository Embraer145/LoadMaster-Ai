/**
 * Boeing 747-400F Aircraft Configuration
 * 
 * This file contains the complete configuration for the B747-400F
 * including all cargo positions, weight limits, and CG data.
 */

import type { 
  AircraftConfig, 
  PositionDefinition,
  DeckType,
  PositionType,
  LowerHoldGroup,
} from '@core/types';

/**
 * Helper function to calculate arm based on position ID
 * Arms are in inches from aircraft datum
 */
function calculateArm(id: string, deck: DeckType): number {
  if (deck === 'LOWER') {
    if (id.startsWith('1')) return 600;
    if (id.startsWith('2')) return 800;
    if (id.startsWith('3')) return 1400;
    if (id.startsWith('4')) return 1600;
    return 1800; // Bulk
  }
  
  // Main deck
  if (id === 'A1' || id === 'A2') return 300;
  if (id === 'B1') return 400;
  if (id === 'T') return 1900;
  
  // Standard positions C through S
  const rowChar = id.charAt(0);
  const rowOffset = (rowChar.charCodeAt(0) - 67) * 100; // 'C' is base (67)
  return 500 + rowOffset;
}

/**
 * Main Deck Position Definitions
 */
const MAIN_DECK_POSITIONS: PositionDefinition[] = [
  // Nose Section
  { id: 'A1', type: 'nose', deck: 'MAIN', maxWeight: 5000, arm: calculateArm('A1', 'MAIN') },
  { id: 'A2', type: 'nose', deck: 'MAIN', maxWeight: 5000, arm: calculateArm('A2', 'MAIN') },
  { id: 'B1', type: 'nose_side', deck: 'MAIN', maxWeight: 5000, arm: calculateArm('B1', 'MAIN') },
  
  // Left Side (C-S)
  ...['C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'P', 'Q', 'R', 'S'].map(row => ({
    id: `${row}L`,
    type: 'left' as PositionType,
    deck: 'MAIN' as DeckType,
    maxWeight: 6800,
    arm: calculateArm(`${row}L`, 'MAIN'),
  })),
  
  // Right Side (C-S)
  ...['C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'P', 'Q', 'R', 'S'].map(row => ({
    id: `${row}R`,
    type: 'right' as PositionType,
    deck: 'MAIN' as DeckType,
    maxWeight: 6800,
    arm: calculateArm(`${row}R`, 'MAIN'),
  })),
  
  // Tail
  { id: 'T', type: 'tail', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('T', 'MAIN') },
];

/**
 * Lower Deck Position Definitions
 */
const LOWER_DECK_POSITIONS: PositionDefinition[] = [
  // Forward Hold
  { id: '11P', type: 'lower_fwd', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('11P', 'LOWER'), group: 'FWD' as LowerHoldGroup },
  { id: '12P', type: 'lower_fwd', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('12P', 'LOWER'), group: 'FWD' as LowerHoldGroup },
  { id: '21P', type: 'lower_fwd', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('21P', 'LOWER'), group: 'FWD' as LowerHoldGroup },
  { id: '22P', type: 'lower_fwd', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('22P', 'LOWER'), group: 'FWD' as LowerHoldGroup },
  { id: '23P', type: 'lower_fwd', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('23P', 'LOWER'), group: 'FWD' as LowerHoldGroup },
  
  // Aft Hold
  { id: '31P', type: 'lower_aft', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('31P', 'LOWER'), group: 'AFT' as LowerHoldGroup },
  { id: '32P', type: 'lower_aft', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('32P', 'LOWER'), group: 'AFT' as LowerHoldGroup },
  { id: '41P', type: 'lower_aft', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('41P', 'LOWER'), group: 'AFT' as LowerHoldGroup },
  { id: '42P', type: 'lower_aft', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('42P', 'LOWER'), group: 'AFT' as LowerHoldGroup },
  
  // Bulk Cargo
  { id: '52', type: 'bulk', deck: 'LOWER', maxWeight: 2000, arm: calculateArm('52', 'LOWER'), group: 'BULK' as LowerHoldGroup },
  { id: '53', type: 'bulk', deck: 'LOWER', maxWeight: 2000, arm: calculateArm('53', 'LOWER'), group: 'BULK' as LowerHoldGroup },
];

/**
 * Complete B747-400F Configuration
 */
export const B747_400F_CONFIG: AircraftConfig = {
  type: 'B747-400F',
  displayName: 'Boeing 747-400 Freighter',
  // IMPORTANT: This config currently uses simplified/sample arms + limits placeholders.
  // Replace with traceable aircraft manual data before any operational/FAA-acceptance effort.
  isSampleData: true,
  dataProvenance: {
    aircraftIdentity: 'B747-400F (sample config; replace with aircraft/ops-manual-backed data)',
    documents: [
      {
        id: 'WB_MANUAL',
        title: 'Aircraft Weight & Balance Manual (REQUIRED - provide revision/table refs)',
        notes: 'Needed for stations/arms/index conversions, OEW moment/index, and CG envelopes.',
      },
      {
        id: 'LOADING_MANUAL',
        title: 'Aircraft Weight & Balance / Loading Manual (REQUIRED - provide revision/table refs)',
        notes: 'Needed for position limits, ULD compatibility, compartment limits, and restrictions.',
      },
      {
        id: 'AFM',
        title: 'Aircraft Flight Manual / AFM Supplements (IF APPLICABLE)',
        notes: 'Used when envelope/limitations are defined in AFM/AFMS rather than W&B manual.',
      },
    ],
    notes: 'This metadata is a placeholder. Populate with real document references for traceability.',
  },
  
  limits: {
    OEW: 165000,    // Operating Empty Weight (kg)
    MZFW: 288000,   // Maximum Zero Fuel Weight (kg)
    MTOW: 396890,   // Maximum Takeoff Weight (kg)
    MLW: 302090,    // Maximum Landing Weight (kg)
  },
  
  cgLimits: {
    forward: 11,    // Forward limit (% MAC)
    aft: 33,        // Aft limit (% MAC)
  },
  
  mac: {
    refChord: 327.8,  // Reference chord length (inches)
    leMAC: 1150,      // Leading edge MAC position (station inches)
  },
  
  fuelArm: 1300,      // Fuel center of gravity arm (inches)
  
  positions: [
    ...MAIN_DECK_POSITIONS,
    ...LOWER_DECK_POSITIONS,
  ],
};

/**
 * Export position groups for UI layout
 */
export const B747_MAIN_DECK = MAIN_DECK_POSITIONS;
export const B747_LOWER_DECK = LOWER_DECK_POSITIONS;

/**
 * Get positions by deck
 */
export function getPositionsByDeck(deck: DeckType): PositionDefinition[] {
  return B747_400F_CONFIG.positions.filter(p => p.deck === deck);
}

/**
 * Get main deck left side positions
 */
export function getMainDeckLeft(): PositionDefinition[] {
  return MAIN_DECK_POSITIONS.filter(p => p.type === 'left');
}

/**
 * Get main deck right side positions
 */
export function getMainDeckRight(): PositionDefinition[] {
  return MAIN_DECK_POSITIONS.filter(p => p.type === 'right');
}

/**
 * Get lower deck positions by group
 */
export function getLowerDeckByGroup(group: LowerHoldGroup): PositionDefinition[] {
  return LOWER_DECK_POSITIONS.filter(p => p.group === group);
}

