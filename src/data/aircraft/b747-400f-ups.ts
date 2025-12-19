/**
 * Boeing 747-400F (Sample) - UPS Positioning Prototype
 *
 * This config is intentionally SAMPLE/SIMPLIFIED.
 * The key difference vs other prototypes is the LOWER deck naming/layout:
 * - P1..P5, wing-box gap, P6..P9 (full-width, no L/R split)
 * - No BULK position labeling for this template.
 */

import type { AircraftConfig, DeckType, PositionDefinition, PositionType, StationDefinition } from '@core/types';

function calculateArmMain(id: string): number {
  const m = id.match(/^(\d+)([AB])?$/);
  if (!m) return 900;
  const n = Number(m[1]);
  return 250 + n * 80;
}

function calculateArmLower(id: string): number {
  const m = id.match(/^P(\d)$/i);
  if (!m) return 1200;
  const n = Number(m[1]);
  if (n >= 1 && n <= 5) return 700 + (n - 1) * 55;
  if (n >= 6 && n <= 9) return 1450 + (n - 6) * 55;
  return 1200;
}

// Main deck: use the same simplified assumptions as Numeric until the definitive UPS diagram
// is provided as an explicit ordered list.
const MAIN_DECK_POSITIONS: PositionDefinition[] = [
  { id: '1', type: 'nose' as PositionType, deck: 'MAIN' as DeckType, maxWeight: 6800, arm: calculateArmMain('1') },
  { id: '2', type: 'nose' as PositionType, deck: 'MAIN' as DeckType, maxWeight: 6800, arm: calculateArmMain('2') },
  { id: '3', type: 'nose' as PositionType, deck: 'MAIN' as DeckType, maxWeight: 6800, arm: calculateArmMain('3') },
  ...Array.from({ length: 11 }, (_, i) => 4 + i).flatMap((n) => ([
    { id: `${n}A`, type: 'left' as PositionType, deck: 'MAIN' as DeckType, maxWeight: 6800, arm: calculateArmMain(`${n}A`) },
    { id: `${n}B`, type: 'right' as PositionType, deck: 'MAIN' as DeckType, maxWeight: 6800, arm: calculateArmMain(`${n}B`) },
  ])),
  ...[18, 19].flatMap((n) => ([
    { id: `${n}A`, type: 'left' as PositionType, deck: 'MAIN' as DeckType, maxWeight: 6800, arm: calculateArmMain(`${n}A`) },
    { id: `${n}B`, type: 'right' as PositionType, deck: 'MAIN' as DeckType, maxWeight: 6800, arm: calculateArmMain(`${n}B`) },
  ])),
  { id: '20', type: 'tail' as PositionType, deck: 'MAIN' as DeckType, maxWeight: 6800, arm: calculateArmMain('20') },
];

const LOWER_DECK_POSITIONS: PositionDefinition[] = [
  // Forward full-width: P1..P5
  ...[1, 2, 3, 4, 5].map((n) => ({
    id: `P${n}`,
    type: 'lower_fwd' as PositionType,
    deck: 'LOWER' as DeckType,
    maxWeight: 5000,
    arm: calculateArmLower(`P${n}`),
    group: 'FWD' as any,
  })),
  // Aft full-width: P6..P9
  ...[6, 7, 8, 9].map((n) => ({
    id: `P${n}`,
    type: 'lower_aft' as PositionType,
    deck: 'LOWER' as DeckType,
    maxWeight: 5000,
    arm: calculateArmLower(`P${n}`),
    group: 'AFT' as any,
  })),
  // Bulk: none — intentionally omitted.
];

const STATIONS: StationDefinition[] = [
  { id: 'CREW_FLIGHT_DECK', label: 'Crew (Flight Deck)', category: 'crew', arm: 350 },
  { id: 'JUMPSEAT_1', label: 'Jumpseat 1', category: 'crew', arm: 420, maxCount: 1 },
  { id: 'RIDER_1', label: 'Extra Rider 1', category: 'rider', arm: 650, maxCount: 1 },
  { id: 'RIDER_2', label: 'Extra Rider 2', category: 'rider', arm: 650, maxCount: 1 },
  { id: 'RIDER_3', label: 'Extra Rider 3', category: 'rider', arm: 650, maxCount: 1 },
  { id: 'RIDER_4', label: 'Extra Rider 4', category: 'rider', arm: 650, maxCount: 1 },
  { id: 'RIDER_5', label: 'Extra Rider 5', category: 'rider', arm: 650, maxCount: 1 },
  { id: 'RIDER_6', label: 'Extra Rider 6', category: 'rider', arm: 650, maxCount: 1 },
  { id: 'ITEMS_FWD', label: 'Additional Items (FWD)', category: 'items', arm: 700 },
  { id: 'ITEMS_AFT', label: 'Additional Items (AFT)', category: 'items', arm: 1550 },
  { id: 'ITEMS_OTHER', label: 'Additional Items (Other)', category: 'items', arm: 1100 },
];

export const B747_400F_UPS_CONFIG: AircraftConfig = {
  type: 'B747-400F-UPS',
  displayName: 'Boeing 747-400F (UPS Prototype)',
  isSampleData: true,
  limits: {
    OEW: 165000,
    MZFW: 288000,
    MTOW: 396890,
    MLW: 302090,
  },
  cgLimits: { forward: 11, aft: 33 },
  mac: { refChord: 327.8, leMAC: 1150 },
  fuelArm: 1300,
  positions: [...MAIN_DECK_POSITIONS, ...LOWER_DECK_POSITIONS],
  stations: STATIONS,
};

export const B747_UPS_MAIN_DECK = MAIN_DECK_POSITIONS;
export const B747_UPS_LOWER_DECK = LOWER_DECK_POSITIONS;


