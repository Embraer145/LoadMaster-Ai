/**
 * AI Optimizer Types
 * 
 * Type definitions for the load optimization engine.
 */

/**
 * Optimization mode selection
 */
export type OptimizationMode = 'safety' | 'fuel_efficiency' | 'unload_efficiency';

/**
 * Configuration for a specific optimization mode
 */
export interface OptimizationModeConfig {
  /** Mode identifier */
  mode: OptimizationMode;
  /** Display name */
  name: string;
  /** Description of what this mode optimizes for */
  description: string;
  /** Priority weights for different factors (0-1, should sum to 1) */
  weights: OptimizationWeights;
  /** Target CG as bias towards aft (0 = center, 1 = max aft) */
  cgBias: number;
  /** Consider destination order for loading */
  considerDestinationOrder: boolean;
  /** Prefer lower deck for heavy items (stability) */
  preferLowerDeckForHeavy: boolean;
}

/**
 * Weights for optimization factors
 */
export interface OptimizationWeights {
  /** Weight for CG centering (safety margin) */
  cgCentering: number;
  /** Weight for achieving optimal cruise CG */
  fuelEfficiency: number;
  /** Weight for unloading order optimization */
  unloadOrder: number;
  /** Weight for structural balance (left/right) */
  lateralBalance: number;
  /** Weight for keeping heavy items low */
  verticalStability: number;
}

/**
 * Position score for optimization
 */
export interface PositionScore {
  positionId: string;
  totalScore: number;
  breakdown: {
    cgScore: number;
    unloadScore: number;
    balanceScore: number;
    stabilityScore: number;
  };
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  /** Was optimization successful */
  success: boolean;
  /** Number of items placed */
  itemsPlaced: number;
  /** Number of items that couldn't be placed */
  itemsRemaining: number;
  /** Final CG achieved */
  finalCG: number;
  /** Final weight */
  finalWeight: number;
  /** Time taken in ms */
  durationMs: number;
  /** Mode used */
  modeUsed: OptimizationMode;
  /** Any warnings */
  warnings: string[];
}

/**
 * Route stop for unload optimization
 */
export interface RouteStopInfo {
  sequence: number;
  airportCode: string;
  isOrigin: boolean;
  isFinalDestination: boolean;
}

