/**
 * Boeing 747-400F CUSTOM Template
 * 
 * Blank starting point for creating custom aircraft configurations.
 * Uses alphabetic position layout but minimal constraints.
 * Super admins can customize this completely via the Template Editor.
 */

import type { 
  AircraftConfig, 
  PositionDefinition,
  DeckType,
  PositionType,
  LowerHoldGroup,
  StationDefinition,
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
 * Main Deck Position Definitions (Alphabetic)
 */
const MAIN_DECK_POSITIONS: PositionDefinition[] = [
  { id: 'A1', type: 'nose', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('A1', 'MAIN') },
  { id: 'A2', type: 'nose', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('A2', 'MAIN') },
  { id: 'B1', type: 'nose', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('B1', 'MAIN') },
  { id: 'CL', type: 'left', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('CL', 'MAIN') },
  { id: 'CR', type: 'right', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('CR', 'MAIN') },
  { id: 'DL', type: 'left', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('DL', 'MAIN') },
  { id: 'DR', type: 'right', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('DR', 'MAIN') },
  { id: 'EL', type: 'left', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('EL', 'MAIN') },
  { id: 'ER', type: 'right', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('ER', 'MAIN') },
  { id: 'FL', type: 'left', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('FL', 'MAIN') },
  { id: 'FR', type: 'right', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('FR', 'MAIN') },
  { id: 'GL', type: 'left', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('GL', 'MAIN') },
  { id: 'GR', type: 'right', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('GR', 'MAIN') },
  { id: 'HL', type: 'left', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('HL', 'MAIN') },
  { id: 'HR', type: 'right', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('HR', 'MAIN') },
  { id: 'JL', type: 'left', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('JL', 'MAIN') },
  { id: 'JR', type: 'right', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('JR', 'MAIN') },
  { id: 'KL', type: 'left', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('KL', 'MAIN') },
  { id: 'KR', type: 'right', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('KR', 'MAIN') },
  { id: 'LL', type: 'left', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('LL', 'MAIN') },
  { id: 'LR', type: 'right', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('LR', 'MAIN') },
  { id: 'ML', type: 'left', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('ML', 'MAIN') },
  { id: 'MR', type: 'right', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('MR', 'MAIN') },
  { id: 'PL', type: 'left', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('PL', 'MAIN') },
  { id: 'PR', type: 'right', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('PR', 'MAIN') },
  { id: 'QL', type: 'left', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('QL', 'MAIN') },
  { id: 'QR', type: 'right', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('QR', 'MAIN') },
  { id: 'RL', type: 'left', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('RL', 'MAIN') },
  { id: 'RR', type: 'right', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('RR', 'MAIN') },
  { id: 'SL', type: 'left', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('SL', 'MAIN') },
  { id: 'SR', type: 'right', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('SR', 'MAIN') },
  { id: 'T', type: 'tail', deck: 'MAIN', maxWeight: 6800, arm: calculateArm('T', 'MAIN') },
];

/**
 * Lower Deck Position Definitions
 */
const LOWER_DECK_POSITIONS: PositionDefinition[] = [
  { id: '11P', type: 'lower_fwd', deck: 'LOWER', maxWeight: 6804, arm: calculateArm('11P', 'LOWER'), group: 'FWD' },
  { id: '12P', type: 'lower_fwd', deck: 'LOWER', maxWeight: 6804, arm: calculateArm('12P', 'LOWER'), group: 'FWD' },
  { id: '21P', type: 'lower_fwd', deck: 'LOWER', maxWeight: 6804, arm: calculateArm('21P', 'LOWER'), group: 'FWD' },
  { id: '22P', type: 'lower_fwd', deck: 'LOWER', maxWeight: 6804, arm: calculateArm('22P', 'LOWER'), group: 'FWD' },
  { id: '23P', type: 'lower_fwd', deck: 'LOWER', maxWeight: 6804, arm: calculateArm('23P', 'LOWER'), group: 'FWD' },
  { id: '31P', type: 'lower_aft', deck: 'LOWER', maxWeight: 6804, arm: calculateArm('31P', 'LOWER'), group: 'AFT' },
  { id: '32P', type: 'lower_aft', deck: 'LOWER', maxWeight: 6804, arm: calculateArm('32P', 'LOWER'), group: 'AFT' },
  { id: '41P', type: 'lower_aft', deck: 'LOWER', maxWeight: 6804, arm: calculateArm('41P', 'LOWER'), group: 'AFT' },
  { id: '42P', type: 'lower_aft', deck: 'LOWER', maxWeight: 6804, arm: calculateArm('42P', 'LOWER'), group: 'AFT' },
  { id: '52', type: 'bulk', deck: 'LOWER', maxWeight: 1360, arm: calculateArm('52', 'LOWER'), group: 'BULK' },
  { id: '53', type: 'bulk', deck: 'LOWER', maxWeight: 1360, arm: calculateArm('53', 'LOWER'), group: 'BULK' },
];

/**
 * Non-cargo stations (crew, riders, items)
 */
const STATIONS: StationDefinition[] = [
  { id: 'CREW_FLIGHT_DECK', label: 'Flight Crew', arm: 250, category: 'crew' },
  { id: 'JUMPSEAT_1', label: 'Jumpseat', arm: 300, category: 'rider', maxCount: 1 },
  { id: 'RIDER_1', label: 'Rider 1', arm: 350, category: 'rider' },
  { id: 'RIDER_2', label: 'Rider 2', arm: 360, category: 'rider' },
  { id: 'RIDER_3', label: 'Rider 3', arm: 370, category: 'rider' },
  { id: 'RIDER_4', label: 'Rider 4', arm: 380, category: 'rider' },
  { id: 'RIDER_5', label: 'Rider 5', arm: 390, category: 'rider' },
  { id: 'RIDER_6', label: 'Rider 6', arm: 400, category: 'rider' },
  { id: 'ITEMS_FWD', label: 'Items (FWD)', arm: 500, category: 'item' },
  { id: 'ITEMS_AFT', label: 'Items (AFT)', arm: 1500, category: 'item' },
  { id: 'ITEMS_OTHER', label: 'Items (Other)', arm: 1000, category: 'item' },
];

/**
 * Complete B747-400F CUSTOM Configuration
 */
export const B747_400F_CUSTOM_CONFIG: AircraftConfig = {
  type: 'B747-400F-CUSTOM',
  displayName: 'B747-400F (Custom/Blank)',
  isSampleData: true,
  dataProvenance: {
    aircraftIdentity: 'B747-400F (Custom configuration template)',
    notes: 'Blank starting point for custom aircraft configurations. Customize via Template Editor.',
  },
  limits: {
    OEW: 165000,    // Sample value
    MZFW: 288000,   // Sample value
    MTOW: 396890,   // Sample value
    MLW: 302090,    // Sample value
  },
  cgLimits: {
    forward: 11,    // Sample value
    aft: 33,        // Sample value
  },
  mac: {
    refChord: 327.8,  // Sample value
    leMAC: 1150,      // Sample value
  },
  fuelArm: 1300,      // Sample value
  positions: [...MAIN_DECK_POSITIONS, ...LOWER_DECK_POSITIONS],
  stations: STATIONS,
};

