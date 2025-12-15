/**
 * AI Cargo Optimizer
 * 
 * Implements three distinct optimization strategies:
 * 
 * 1. SAFETY - Maximum CG margins, centered loading
 * 2. FUEL EFFICIENCY - Aft CG loading to reduce trim drag
 * 3. UNLOAD EFFICIENCY - Destination grouping near cargo doors
 * 
 * Based on industry best practices:
 * - FAA Aircraft Weight and Balance Handbook
 * - IATA Ground Operations Manual
 * - Boeing 747-400F Operations Manual
 */

import type { CargoItem, LoadedPosition, AircraftConfig } from '../types';

/** Simple route stop for optimizer */
interface SimpleRouteStop {
  code: string;
}
import { calculateFlightPhysics } from '../physics/weightBalance';

export type OptimizationMode = 'safety' | 'fuel_efficiency' | 'unload_efficiency';

export interface OptimizationResult {
  positions: LoadedPosition[];
  unplacedCargo: CargoItem[];
  metrics: {
    cgPosition: number;
    cgMargin: number;
    fuelSavingsPercent: number;
    unloadScore: number;
  };
}

// B747-400F Cargo Door Locations
// Main Deck: Side Cargo Door at positions G-K (around row 7-11)
// Lower Deck: Forward hold door, Aft hold door, Bulk cargo door
const DOOR_POSITIONS = {
  MAIN_SIDE_DOOR: ['GL', 'GR', 'HL', 'HR', 'JL', 'JR', 'KL', 'KR'],
  NOSE_DOOR: ['A1', 'A2', 'B1', 'CL', 'CR', 'DL', 'DR', 'EL', 'ER', 'FL', 'FR'],
  TAIL_POSITIONS: ['PL', 'PR', 'QL', 'QR', 'RL', 'RR', 'SL', 'SR', 'T'],
  LOWER_FWD: ['11P', '12P', '21P', '22P', '23P'],
  LOWER_AFT: ['31P', '32P', '41P', '42P'],
  BULK: ['52', '53'],
};

// Position arms (distance from datum in inches) - higher = more aft
const POSITION_ARMS: Record<string, number> = {
  'A1': 280, 'A2': 280, 'B1': 350,
  'CL': 450, 'CR': 450, 'DL': 550, 'DR': 550,
  'EL': 650, 'ER': 650, 'FL': 750, 'FR': 750,
  'GL': 850, 'GR': 850, 'HL': 950, 'HR': 950,
  'JL': 1050, 'JR': 1050, 'KL': 1150, 'KR': 1150,
  'LL': 1250, 'LR': 1250, 'ML': 1350, 'MR': 1350,
  'PL': 1450, 'PR': 1450, 'QL': 1550, 'QR': 1550,
  'RL': 1650, 'RR': 1650, 'SL': 1750, 'SR': 1750,
  'T': 1850,
  '11P': 500, '12P': 500, '21P': 700, '22P': 700, '23P': 700,
  '31P': 1300, '32P': 1300, '41P': 1500, '42P': 1500,
  '52': 1700, '53': 1700,
};

/**
 * Main optimization function
 */
export async function optimizeLoad(
  cargo: CargoItem[],
  positions: LoadedPosition[],
  config: AircraftConfig,
  mode: OptimizationMode,
  route: SimpleRouteStop[],
  onProgress?: (positions: LoadedPosition[], message: string) => Promise<void>
): Promise<OptimizationResult> {
  // Clone positions to avoid mutation
  let workingPositions = positions.map(p => ({ ...p, content: null })) as LoadedPosition[];
  let remainingCargo = [...cargo];
  
  // Sort cargo based on optimization mode
  const sortedCargo = sortCargoByMode(remainingCargo, mode, route);
  
  // Get position priority based on mode
  const positionPriority = getPositionPriority(workingPositions, mode, route, sortedCargo);
  
  if (onProgress) {
    await onProgress(workingPositions, `Starting ${mode} optimization...`);
  }
  
  // Place cargo iteratively
  for (const cargoItem of sortedCargo) {
    const bestPosition = findBestPosition(
      cargoItem,
      workingPositions,
      positionPriority,
      config,
      mode,
      route
    );
    
    if (bestPosition) {
      const posIdx = workingPositions.findIndex(p => p.id === bestPosition.id);
      workingPositions[posIdx] = { ...workingPositions[posIdx], content: cargoItem };
      remainingCargo = remainingCargo.filter(c => c.id !== cargoItem.id);
      
      if (onProgress) {
        await onProgress(workingPositions, `Placed ${cargoItem.id} at ${bestPosition.id}`);
      }
    }
  }
  
  // Calculate final metrics
  const physics = calculateFlightPhysics(workingPositions, 40000, config);
  const cgMargin = Math.min(physics.towCG - physics.forwardLimit, physics.aftLimit - physics.towCG);
  
  return {
    positions: workingPositions,
    unplacedCargo: remainingCargo,
    metrics: {
      cgPosition: physics.towCG,
      cgMargin,
      fuelSavingsPercent: mode === 'fuel_efficiency' ? calculateFuelSavings(physics.towCG, config) : 0,
      unloadScore: mode === 'unload_efficiency' ? calculateUnloadScore(workingPositions, route) : 0,
    },
  };
}

/**
 * Sort cargo based on optimization mode
 */
function sortCargoByMode(cargo: CargoItem[], mode: OptimizationMode, route: SimpleRouteStop[]): CargoItem[] {
  const sorted = [...cargo];
  
  switch (mode) {
    case 'safety':
      // Sort by weight (heaviest first) - place heavy items at CG
      sorted.sort((a, b) => b.weight - a.weight);
      break;
      
    case 'fuel_efficiency':
      // Sort by weight (lightest first for forward, heaviest for aft)
      // We'll place heaviest aft for max fuel savings
      sorted.sort((a, b) => b.weight - a.weight);
      break;
      
    case 'unload_efficiency':
      // Sort by offload order - cargo for later stops should load first (go deeper)
      // Then by destination - group same destinations together
      const stopOrder = route.map(r => r.code);
      sorted.sort((a, b) => {
        const aIdx = stopOrder.indexOf(a.offloadPoint);
        const bIdx = stopOrder.indexOf(b.offloadPoint);
        // Later offload = load first (goes to back)
        // Earlier offload = load last (stays near doors)
        return bIdx - aIdx;
      });
      break;
  }
  
  return sorted;
}

/**
 * Get position priority based on mode
 */
function getPositionPriority(
  positions: LoadedPosition[],
  mode: OptimizationMode,
  _route: SimpleRouteStop[],
  _cargo: CargoItem[]
): string[] {
  const allPositionIds = positions.map(p => p.id);
  
  switch (mode) {
    case 'safety':
      // Center positions first (around mid-fuselage)
      // Target: positions with arms around 1000-1200 (center of aircraft)
      return allPositionIds.sort((a, b) => {
        const armA = POSITION_ARMS[a] || 1000;
        const armB = POSITION_ARMS[b] || 1000;
        const centerArm = 1100; // Approximate center
        return Math.abs(armA - centerArm) - Math.abs(armB - centerArm);
      });
      
    case 'fuel_efficiency':
      // Aft positions first (higher arm values)
      // This moves CG aft, reducing trim drag
      return allPositionIds.sort((a, b) => {
        const armA = POSITION_ARMS[a] || 1000;
        const armB = POSITION_ARMS[b] || 1000;
        return armB - armA; // Highest arm first
      });
      
    case 'unload_efficiency':
      // Near-door positions for first-off cargo
      // Prioritize positions near the side cargo door for quick access
      const doorProximity = (posId: string): number => {
        if (DOOR_POSITIONS.MAIN_SIDE_DOOR.includes(posId)) return 0; // Best - right at door
        if (DOOR_POSITIONS.NOSE_DOOR.includes(posId)) return 1; // Good - nose door access
        if (DOOR_POSITIONS.LOWER_FWD.includes(posId)) return 2;
        if (DOOR_POSITIONS.LOWER_AFT.includes(posId)) return 3;
        if (DOOR_POSITIONS.TAIL_POSITIONS.includes(posId)) return 4; // Worst - furthest from door
        if (DOOR_POSITIONS.BULK.includes(posId)) return 5;
        return 3; // Default mid-priority
      };
      return allPositionIds.sort((a, b) => doorProximity(a) - doorProximity(b));
  }
}

/**
 * Find the best position for a cargo item
 */
function findBestPosition(
  cargo: CargoItem,
  positions: LoadedPosition[],
  priorityOrder: string[],
  _config: AircraftConfig,
  mode: OptimizationMode,
  route: SimpleRouteStop[]
): LoadedPosition | null {
  // Filter to matching deck and available positions
  const available = positions.filter(p => 
    !p.content && 
    p.deck === cargo.preferredDeck &&
    cargo.weight <= p.maxWeight
  );
  
  if (available.length === 0) {
    // Try other deck if preferred is full
    const otherDeck = positions.filter(p => 
      !p.content && 
      p.deck !== cargo.preferredDeck &&
      cargo.weight <= p.maxWeight
    );
    if (otherDeck.length === 0) return null;
    return otherDeck[0];
  }
  
  // For unload efficiency, prioritize based on offload point
  if (mode === 'unload_efficiency') {
    const stopOrder = route.map(r => r.code);
    const cargoStopIdx = stopOrder.indexOf(cargo.offloadPoint);
    
    // First stop = near door, Last stop = deep in aircraft
    if (cargoStopIdx <= 1) {
      // First or second stop - prioritize door-adjacent positions
      const doorPositions = available.filter(p => 
        DOOR_POSITIONS.MAIN_SIDE_DOOR.includes(p.id) ||
        DOOR_POSITIONS.NOSE_DOOR.includes(p.id)
      );
      if (doorPositions.length > 0) return doorPositions[0];
    } else {
      // Later stops - put deeper in aircraft (higher arm = aft = loaded first)
      const sorted = available.sort((a, b) => {
        const armA = POSITION_ARMS[a.id] || 1000;
        const armB = POSITION_ARMS[b.id] || 1000;
        return armB - armA; // Aft first for later stops
      });
      return sorted[0];
    }
  }
  
  // Use priority order for other modes
  for (const posId of priorityOrder) {
    const pos = available.find(p => p.id === posId);
    if (pos) return pos;
  }
  
  return available[0] || null;
}

/**
 * Calculate fuel savings from aft CG
 * 
 * Research shows: 
 * - 1% aft CG shift ≈ 0.1-0.3% fuel savings
 * - Optimal is typically around 28-30% MAC for fuel efficiency
 * - Forward CG (around 15%) requires more tail downforce = more drag
 */
function calculateFuelSavings(cgPosition: number, _config: AircraftConfig): number {
  const optimalCG = 30; // Target for fuel efficiency (aft, but within limits)
  const neutralCG = 22; // Center position (no benefit or penalty)
  
  if (cgPosition >= optimalCG) {
    return 1.5; // Max ~1.5% savings at optimal aft position
  } else if (cgPosition > neutralCG) {
    // Linear interpolation between neutral and optimal
    return ((cgPosition - neutralCG) / (optimalCG - neutralCG)) * 1.5;
  }
  
  return 0; // No savings for forward CG
}

/**
 * Calculate unload efficiency score
 * 
 * Higher score = better organization for quick unloading
 * Factors:
 * - First-off cargo near doors
 * - Same-destination cargo grouped together
 */
function calculateUnloadScore(positions: LoadedPosition[], route: SimpleRouteStop[]): number {
  let score = 0;
  const loadedPositions = positions.filter(p => p.content);
  
  if (loadedPositions.length === 0) return 0;
  
  const stopOrder = route.map(r => r.code);
  
  for (const pos of loadedPositions) {
    const cargo = pos.content!;
    const stopIdx = stopOrder.indexOf(cargo.offloadPoint);
    const isDoorAdjacent = DOOR_POSITIONS.MAIN_SIDE_DOOR.includes(pos.id) ||
                           DOOR_POSITIONS.NOSE_DOOR.includes(pos.id);
    
    // First stop cargo near doors = high score
    if (stopIdx <= 1 && isDoorAdjacent) {
      score += 10;
    }
    // Later stop cargo in aft positions = good
    else if (stopIdx > 1 && DOOR_POSITIONS.TAIL_POSITIONS.includes(pos.id)) {
      score += 5;
    }
  }
  
  // Normalize to 0-100
  return Math.min(100, (score / loadedPositions.length) * 10);
}

/**
 * Get descriptive text for optimization mode
 */
export function getModeDescription(mode: OptimizationMode): string {
  switch (mode) {
    case 'safety':
      return 'Centers cargo around aircraft CG for maximum stability margins. Best for turbulent routes or inexperienced crews.';
    case 'fuel_efficiency':
      return 'Positions heavy cargo aft to reduce trim drag. Can save 1-2% fuel on long-haul flights.';
    case 'unload_efficiency':
      return 'Groups cargo by destination near cargo doors. First-off items placed for quick access. Reduces turnaround time.';
  }
}
