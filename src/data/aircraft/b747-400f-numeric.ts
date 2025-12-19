/**
 * Boeing 747-400F (Sample) - Numeric Positioning Prototype
 *
 * This config is intentionally SAMPLE/SIMPLIFIED.
 * It exists to demonstrate that different operators/airframes use different
 * position naming conventions and even different physical slot layouts.
 */

import type {
  AircraftConfig,
  DeckType,
  PositionDefinition,
  PositionType,
  StationDefinition,
} from '@core/types';

function calculateArmMain(id: string): number {
  // SAMPLE: station inches from datum.
  // Centerline positions are plain numbers (1,2,3,20).
  // Paired positions are N + A/B.
  const m = id.match(/^(\d+)([AB])?$/);
  if (!m) return 900;
  const n = Number(m[1]);
  // Place 1..20 roughly nose->tail.
  return 250 + n * 80;
}

function calculateArmLower(id: string): number {
  // SAMPLE: forward hold ~600..900, aft hold ~1400..1700
  const m = id.match(/^(\d{2})([LR])$/);
  if (!m) return 1200;
  const bay = Number(m[1]);
  if (bay >= 11 && bay <= 18) return 650 + (bay - 11) * 40;
  if (bay >= 31 && bay <= 37) return 1450 + (bay - 31) * 45;
  return 1200;
}

const MAIN_DECK_POSITIONS: PositionDefinition[] = [
  // Centerline (first 3 angled in the diagram, but treated as centerline in W&B)
  { id: '1', type: 'nose' as PositionType, deck: 'MAIN' as DeckType, maxWeight: 6800, arm: calculateArmMain('1') },
  { id: '2', type: 'nose' as PositionType, deck: 'MAIN' as DeckType, maxWeight: 6800, arm: calculateArmMain('2') },
  { id: '3', type: 'nose' as PositionType, deck: 'MAIN' as DeckType, maxWeight: 6800, arm: calculateArmMain('3') },

  // Paired positions: 4A/4B .. 14A/14B
  ...Array.from({ length: 11 }, (_, i) => 4 + i).flatMap((n) => ([
    { id: `${n}A`, type: 'left' as PositionType, deck: 'MAIN' as DeckType, maxWeight: 6800, arm: calculateArmMain(`${n}A`) },
    { id: `${n}B`, type: 'right' as PositionType, deck: 'MAIN' as DeckType, maxWeight: 6800, arm: calculateArmMain(`${n}B`) },
  ])),

  // Skip 15–17 (structure/wing-box region in simplified diagram assumptions)

  // Paired positions: 18A/18B, 19A/19B
  ...[18, 19].flatMap((n) => ([
    { id: `${n}A`, type: 'left' as PositionType, deck: 'MAIN' as DeckType, maxWeight: 6800, arm: calculateArmMain(`${n}A`) },
    { id: `${n}B`, type: 'right' as PositionType, deck: 'MAIN' as DeckType, maxWeight: 6800, arm: calculateArmMain(`${n}B`) },
  ])),

  // Centerline tail (fuselage narrows)
  { id: '20', type: 'tail' as PositionType, deck: 'MAIN' as DeckType, maxWeight: 6800, arm: calculateArmMain('20') },
];

const LOWER_DECK_POSITIONS: PositionDefinition[] = [
  // Forward hold: 11L/R..18L/R (16 positions)
  ...Array.from({ length: 8 }, (_, i) => 11 + i).flatMap((bay) => ([
    { id: `${bay}L`, type: 'lower_fwd' as PositionType, deck: 'LOWER' as DeckType, maxWeight: 4000, arm: calculateArmLower(`${bay}L`), group: 'FWD' as any },
    { id: `${bay}R`, type: 'lower_fwd' as PositionType, deck: 'LOWER' as DeckType, maxWeight: 4000, arm: calculateArmLower(`${bay}R`), group: 'FWD' as any },
  ])),
  // Aft hold: 31L/R..37L/R (14 positions)
  ...Array.from({ length: 7 }, (_, i) => 31 + i).flatMap((bay) => ([
    { id: `${bay}L`, type: 'lower_aft' as PositionType, deck: 'LOWER' as DeckType, maxWeight: 4000, arm: calculateArmLower(`${bay}L`), group: 'AFT' as any },
    { id: `${bay}R`, type: 'lower_aft' as PositionType, deck: 'LOWER' as DeckType, maxWeight: 4000, arm: calculateArmLower(`${bay}R`), group: 'AFT' as any },
  ])),
  // Bulk: none (loose cargo only) — intentionally omitted for this prototype.
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

export const B747_400F_NUMERIC_CONFIG: AircraftConfig = {
  type: 'B747-400F-NUMERIC',
  displayName: 'Boeing 747-400F (Numeric Prototype)',
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

export const B747_NUMERIC_MAIN_DECK = MAIN_DECK_POSITIONS;
export const B747_NUMERIC_LOWER_DECK = LOWER_DECK_POSITIONS;


