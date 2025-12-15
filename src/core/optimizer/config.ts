/**
 * AI Optimizer Configuration
 * 
 * Configuration for different optimization modes.
 * These values can be adjusted based on operational experience.
 * 
 * INDUSTRY STANDARDS REFERENCED:
 * - Boeing 747 FCOM recommendations for optimal cruise CG
 * - IATA Ground Operations Manual for loading sequences
 * - Airline operational best practices for turnaround times
 * 
 * CG BIAS EXPLANATION:
 * - 0.0 = Target center of envelope (maximum margin all directions)
 * - 0.5 = Target midpoint between center and aft limit
 * - 0.8 = Target near aft limit (maximum fuel efficiency)
 * 
 * For B747-400F, optimal cruise CG is approximately 28-32% MAC.
 * Forward CG increases trim drag by requiring more stabilizer deflection.
 * Aft CG reduces drag but decreases stability margins.
 */

import type { OptimizationModeConfig, OptimizationMode } from './types';

/**
 * Safety Mode Configuration
 * 
 * Prioritizes maximum CG margin for safety.
 * Keeps CG centered in envelope with maximum buffer to limits.
 * Heavy items placed low for stability.
 * Lateral (left/right) balance is prioritized.
 */
export const SAFETY_MODE: OptimizationModeConfig = {
  mode: 'safety',
  name: 'Safety First',
  description: 'Maximizes CG margin from limits. Best for turbulent conditions or inexperienced crews.',
  weights: {
    cgCentering: 0.40,      // Highest priority: keep CG centered
    fuelEfficiency: 0.10,   // Low priority: some aft bias acceptable
    unloadOrder: 0.10,      // Low priority: safety over speed
    lateralBalance: 0.25,   // High priority: left/right balance
    verticalStability: 0.15, // Medium priority: heavy items low
  },
  cgBias: 0.0,              // Target center of envelope
  considerDestinationOrder: false,
  preferLowerDeckForHeavy: true,
};

/**
 * Fuel Efficiency Mode Configuration
 * 
 * Targets aft CG for reduced trim drag.
 * For B747, optimal cruise CG is 28-32% MAC.
 * Aft CG reduces horizontal stabilizer deflection needed for trim.
 * Can save 1-3% fuel on long-haul flights.
 * 
 * CAUTION: Aft CG reduces pitch stability margin.
 * Not recommended for short flights where fuel savings are minimal.
 */
export const FUEL_EFFICIENCY_MODE: OptimizationModeConfig = {
  mode: 'fuel_efficiency',
  name: 'Fuel Efficient',
  description: 'Targets aft CG for reduced trim drag. Saves 1-3% fuel on long flights.',
  weights: {
    cgCentering: 0.15,      // Lower priority: accept less margin
    fuelEfficiency: 0.45,   // Highest priority: aft CG
    unloadOrder: 0.10,      // Low priority
    lateralBalance: 0.20,   // Medium priority
    verticalStability: 0.10, // Lower priority
  },
  cgBias: 0.6,              // Target 60% towards aft limit (~28-30% MAC for 747)
  considerDestinationOrder: false,
  preferLowerDeckForHeavy: false,
};

/**
 * Unload Efficiency Mode Configuration
 * 
 * Optimizes for fast turnaround at each stop.
 * Items for earlier stops are placed in more accessible positions.
 * Final destination items are loaded deepest.
 * 
 * LOADING SEQUENCE PRINCIPLE:
 * Last-In-First-Out (LIFO) for each stop.
 * Items for first stop should be:
 * - Near cargo doors
 * - On top (if stacked)
 * - In accessible positions
 */
export const UNLOAD_EFFICIENCY_MODE: OptimizationModeConfig = {
  mode: 'unload_efficiency',
  name: 'Fast Turnaround',
  description: 'Loads for efficient unloading at each stop. Groups cargo by destination.',
  weights: {
    cgCentering: 0.20,      // Medium priority: must stay in limits
    fuelEfficiency: 0.05,   // Low priority
    unloadOrder: 0.45,      // Highest priority: unload sequence
    lateralBalance: 0.20,   // Medium priority
    verticalStability: 0.10, // Lower priority
  },
  cgBias: 0.2,              // Slight aft bias, but not extreme
  considerDestinationOrder: true,
  preferLowerDeckForHeavy: false,
};

/**
 * All available optimization modes
 */
export const OPTIMIZATION_MODES: Record<OptimizationMode, OptimizationModeConfig> = {
  safety: SAFETY_MODE,
  fuel_efficiency: FUEL_EFFICIENCY_MODE,
  unload_efficiency: UNLOAD_EFFICIENCY_MODE,
};

/**
 * Get configuration for a specific mode
 */
export function getOptimizationConfig(mode: OptimizationMode): OptimizationModeConfig {
  return OPTIMIZATION_MODES[mode];
}

/**
 * Get all available modes
 */
export function getAvailableModes(): OptimizationModeConfig[] {
  return Object.values(OPTIMIZATION_MODES);
}

/**
 * Default mode
 */
export const DEFAULT_OPTIMIZATION_MODE: OptimizationMode = 'safety';

/**
 * ============================================================================
 * TUNING GUIDE
 * ============================================================================
 * 
 * To adjust optimization behavior, modify the weights above.
 * 
 * WEIGHTS MUST SUM TO 1.0
 * 
 * Higher weight = higher priority in position selection.
 * 
 * EXAMPLE ADJUSTMENTS:
 * 
 * 1. More conservative fuel mode:
 *    - Increase cgCentering to 0.25
 *    - Decrease fuelEfficiency to 0.35
 *    - Reduce cgBias to 0.4
 * 
 * 2. Faster unloading priority:
 *    - Increase unloadOrder to 0.55
 *    - Decrease cgCentering to 0.15
 * 
 * 3. Better lateral balance:
 *    - Increase lateralBalance in all modes
 * 
 * TESTING:
 * After adjusting, test with various cargo manifests to ensure:
 * - CG stays within limits
 * - No structural limits exceeded
 * - Desired optimization goal is achieved
 * 
 * ============================================================================
 */

/**
 * Position accessibility scores for unload optimization
 * Higher score = more accessible (unloaded first)
 * 
 * These should be adjusted based on:
 * - Door locations for specific aircraft
 * - Ground equipment capabilities
 * - Standard unloading procedures
 */
export const POSITION_ACCESSIBILITY: Record<string, number> = {
  // Main deck - nose section (front door)
  'A1': 0.95, 'A2': 0.95, 'B1': 0.90,
  
  // Main deck - forward section
  'CL': 0.85, 'CR': 0.85,
  'DL': 0.80, 'DR': 0.80,
  'EL': 0.75, 'ER': 0.75,
  'FL': 0.70, 'FR': 0.70,
  
  // Main deck - mid section (side door)
  'GL': 0.75, 'GR': 0.75,
  'HL': 0.70, 'HR': 0.70,
  'JL': 0.65, 'JR': 0.65,
  'KL': 0.60, 'KR': 0.60,
  
  // Main deck - aft section
  'LL': 0.55, 'LR': 0.55,
  'ML': 0.50, 'MR': 0.50,
  'PL': 0.45, 'PR': 0.45,
  'QL': 0.40, 'QR': 0.40,
  'RL': 0.35, 'RR': 0.35,
  'SL': 0.30, 'SR': 0.30,
  'T': 0.25,
  
  // Lower deck - forward
  '11P': 0.80, '12P': 0.75,
  '21P': 0.70, '22P': 0.65, '23P': 0.60,
  
  // Lower deck - aft  
  '31P': 0.55, '32P': 0.50,
  '41P': 0.45, '42P': 0.40,
  
  // Bulk cargo
  '52': 0.35, '53': 0.30,
};

/**
 * Get accessibility score for a position
 */
export function getPositionAccessibility(positionId: string): number {
  return POSITION_ACCESSIBILITY[positionId] ?? 0.5;
}

