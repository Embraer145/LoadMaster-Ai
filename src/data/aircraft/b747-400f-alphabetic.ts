/**
 * Boeing 747-400F Aircraft Configuration (ALPHABETIC Layout)
 * 
 * This is the standard alphabetic position layout template.
 * Position IDs: A1, A2, B1, CL, CR, DL, DR, ... SL, SR, T
 * Used by most operators as the base template.
 */

import type { 
  AircraftConfig, 
  PositionDefinition,
  DeckType,
  PositionType,
  LowerHoldGroup,
  StationDefinition,
  PositionConstraint,
} from '@core/types';

// Best-effort seed constraints for B747-400F (alphabetic) based on Aerostan B747-200F diagrams.
// These are placeholders until operator/aircraft manuals are provided and entered.
const SEED_CONSTRAINTS_B747_400F_ALPHA: Record<string, PositionConstraint> = (() => {
  const out: Record<string, PositionConstraint> = {};
  const set = (ids: string[], c: PositionConstraint) => {
    for (const id of ids) out[id] = c;
  };

  // Main deck: best-effort height classes.
  // - Forward/nose taper + under flight deck areas: treat as 96 in max.
  // - Mid fuselage: treat as 118 in max.
  // - Tail taper: treat as 96 in max.
  const H96: PositionConstraint = { maxHeightIn: 96, source: 'aerostan_best_effort', notes: 'Best-effort seed (Aerostan 747-200F). Verify via 747-400F loading manual.' };
  const H118: PositionConstraint = { maxHeightIn: 118, source: 'aerostan_best_effort', notes: 'Best-effort seed (Aerostan 747-200F). Verify via 747-400F loading manual.' };
  const H64: PositionConstraint = { maxHeightIn: 64, source: 'aerostan_best_effort', notes: 'Best-effort belly container height class. Verify via 747-400F lower hold manual tables.' };

  // Nose/forward rows (heuristic)
  set(['A1', 'A2', 'B1'], H96);
  set(['CL','CR','DL','DR','EL','ER','FL','FR'], H96);

  // Mid section rows (heuristic): G..M
  for (const row of ['G','H','J','K','L','M']) {
    set([`${row}L`, `${row}R`], H118);
  }

  // Transitional C..F: still near forward curvature; seed 96 for now.
  for (const row of ['C','D','E','F']) {
    set([`${row}L`, `${row}R`], H96);
  }

  // Aft rows P..S + tail
  for (const row of ['P','Q','R','S']) {
    set([`${row}L`, `${row}R`], H96);
  }
  set(['T'], H96);

  // Lower deck: 64 in class for container bays in this prototype
  set(['11P','12P','21P','22P','23P','31P','32P','41P','42P','52','53'], H64);

  return out;
})();

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
  { id: 'A1', type: 'nose', deck: 'MAIN', maxWeight: 5000, arm: calculateArm('A1', 'MAIN'), constraints: SEED_CONSTRAINTS_B747_400F_ALPHA['A1'] },
  { id: 'A2', type: 'nose', deck: 'MAIN', maxWeight: 5000, arm: calculateArm('A2', 'MAIN'), constraints: SEED_CONSTRAINTS_B747_400F_ALPHA['A2'] },
  { id: 'B1', type: 'nose_side', deck: 'MAIN', maxWeight: 5000, arm: calculateArm('B1', 'MAIN'), constraints: SEED_CONSTRAINTS_B747_400F_ALPHA['B1'] },
  
  // Left Side (C-S)
  ...['C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'P', 'Q', 'R', 'S'].map(row => ({
    id: `${row}L`,
    type: 'left' as PositionType,
    deck: 'MAIN' as DeckType,
    maxWeight: 6800,
    arm: calculateArm(`${row}L`, 'MAIN'),
    constraints: SEED_CONSTRAINTS_B747_400F_ALPHA[`${row}L`],
  })),
  
  // Right Side (C-S)
  ...['C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'P', 'Q', 'R', 'S'].map(row => ({
    id: `${row}R`,
    type: 'right' as PositionType,
    deck: 'MAIN' as DeckType,
    maxWeight: 6800,
    arm: calculateArm(`${row}R`, 'MAIN'),
    constraints: SEED_CONSTRAINTS_B747_400F_ALPHA[`${row}R`],
  })),
  
  // Tail
  { id: 'T', type: 'tail', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('T', 'MAIN'), constraints: SEED_CONSTRAINTS_B747_400F_ALPHA['T'] },
];

/**
 * Lower Deck Position Definitions
 */
const LOWER_DECK_POSITIONS: PositionDefinition[] = [
  // Forward Hold
  { id: '11P', type: 'lower_fwd', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('11P', 'LOWER'), group: 'FWD' as LowerHoldGroup, constraints: SEED_CONSTRAINTS_B747_400F_ALPHA['11P'] },
  { id: '12P', type: 'lower_fwd', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('12P', 'LOWER'), group: 'FWD' as LowerHoldGroup, constraints: SEED_CONSTRAINTS_B747_400F_ALPHA['12P'] },
  { id: '21P', type: 'lower_fwd', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('21P', 'LOWER'), group: 'FWD' as LowerHoldGroup, constraints: SEED_CONSTRAINTS_B747_400F_ALPHA['21P'] },
  { id: '22P', type: 'lower_fwd', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('22P', 'LOWER'), group: 'FWD' as LowerHoldGroup, constraints: SEED_CONSTRAINTS_B747_400F_ALPHA['22P'] },
  { id: '23P', type: 'lower_fwd', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('23P', 'LOWER'), group: 'FWD' as LowerHoldGroup, constraints: SEED_CONSTRAINTS_B747_400F_ALPHA['23P'] },
  
  // Aft Hold
  { id: '31P', type: 'lower_aft', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('31P', 'LOWER'), group: 'AFT' as LowerHoldGroup, constraints: SEED_CONSTRAINTS_B747_400F_ALPHA['31P'] },
  { id: '32P', type: 'lower_aft', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('32P', 'LOWER'), group: 'AFT' as LowerHoldGroup, constraints: SEED_CONSTRAINTS_B747_400F_ALPHA['32P'] },
  { id: '41P', type: 'lower_aft', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('41P', 'LOWER'), group: 'AFT' as LowerHoldGroup, constraints: SEED_CONSTRAINTS_B747_400F_ALPHA['41P'] },
  { id: '42P', type: 'lower_aft', deck: 'LOWER', maxWeight: 4000, arm: calculateArm('42P', 'LOWER'), group: 'AFT' as LowerHoldGroup, constraints: SEED_CONSTRAINTS_B747_400F_ALPHA['42P'] },
  
  // Bulk Cargo
  { id: '52', type: 'bulk', deck: 'LOWER', maxWeight: 2000, arm: calculateArm('52', 'LOWER'), group: 'BULK' as LowerHoldGroup, constraints: SEED_CONSTRAINTS_B747_400F_ALPHA['52'] },
  { id: '53', type: 'bulk', deck: 'LOWER', maxWeight: 2000, arm: calculateArm('53', 'LOWER'), group: 'BULK' as LowerHoldGroup, constraints: SEED_CONSTRAINTS_B747_400F_ALPHA['53'] },
];

/**
 * Non-cargo W&B stations (SAMPLE).
 * Replace arms/stations with W&B manual station table for FAA-grade accuracy.
 */
const STATIONS: StationDefinition[] = [
  // Crew (fixed total weight, but still modeled at an arm)
  { id: 'CREW_FLIGHT_DECK', label: 'Crew (Flight Deck)', category: 'crew', arm: 350 },
  { id: 'JUMPSEAT_1', label: 'Jumpseat 1', category: 'crew', arm: 420, maxCount: 1 },

  // Extra riders (0–6)
  { id: 'RIDER_1', label: 'Extra Rider 1', category: 'rider', arm: 650, maxCount: 1 },
  { id: 'RIDER_2', label: 'Extra Rider 2', category: 'rider', arm: 650, maxCount: 1 },
  { id: 'RIDER_3', label: 'Extra Rider 3', category: 'rider', arm: 650, maxCount: 1 },
  { id: 'RIDER_4', label: 'Extra Rider 4', category: 'rider', arm: 650, maxCount: 1 },
  { id: 'RIDER_5', label: 'Extra Rider 5', category: 'rider', arm: 650, maxCount: 1 },
  { id: 'RIDER_6', label: 'Extra Rider 6', category: 'rider', arm: 650, maxCount: 1 },

  // Additional items / catering / equipment
  { id: 'ITEMS_FWD', label: 'Additional Items (FWD)', category: 'items', arm: 700 },
  { id: 'ITEMS_AFT', label: 'Additional Items (AFT)', category: 'items', arm: 1550 },
  { id: 'ITEMS_OTHER', label: 'Additional Items (Other)', category: 'items', arm: 1100 },
];

/**
 * Complete B747-400F Configuration
 */
export const B747_400F_ALPHABETIC_CONFIG: AircraftConfig = {
  type: 'B747-400F-ALPHABETIC',
  displayName: 'Boeing 747-400F (Alphabetic Layout)',
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

  stations: STATIONS,
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

