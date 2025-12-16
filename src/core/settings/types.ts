/**
 * Settings Types
 * 
 * Type definitions for application settings and rules.
 */

import type { OptimizationMode } from '../optimizer/types';
import type { WarehouseSortMode } from '../warehouse/types';

/**
 * Complete application settings
 */
export interface AppSettings {
  general: GeneralSettings;
  standardWeights: StandardWeightsSettings;
  optimization: OptimizationSettings;
  dangerousGoods: DGSettings;
  unloadEfficiency: UnloadSettings;
  display: DisplaySettings;
  compliance: ComplianceSettings;
}

/**
 * General application settings
 */
export interface GeneralSettings {
  /** Default operator code */
  defaultOperator: string;
  /** Auto-save interval in seconds (0 = disabled) */
  autoSaveInterval: number;
  /** Show weight in kg or lbs */
  weightUnit: 'kg' | 'lbs';
  /** Date format */
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  /** Enable audit logging */
  auditLogging: boolean;
  /** Require confirmation before finalizing */
  requireFinalizeConfirmation: boolean;
}

/**
 * Standard weights (audit-facing)
 *
 * These values are intended to match operator/FAA standard weight policies.
 * In production, these should be controlled/configured with provenance.
 */
export interface StandardWeightsSettings {
  /** Fixed crew total weight (kg). Set according to operator/FAA standard weight policy. */
  crewTotalKg: number;
  /** Standard weight per additional rider/jumpseater (kg). */
  standardRiderKg: number;
  /** Maximum additional riders supported in UI (0–6 on 747 upper deck in this simulator). */
  maxAdditionalRiders: number;
  /** Default additional items (catering/equipment) weight (kg) for convenience. */
  additionalItemsDefaultKg: number;
}

/**
 * Optimization settings
 */
export interface OptimizationSettings {
  /** Default optimization mode */
  defaultMode: OptimizationMode;
  /** Allow mode changes after loading starts */
  allowModeChange: boolean;
  /** Minimum CG margin from limits (% MAC) */
  minCGMargin: number;
  /** Target aft CG for fuel efficiency mode (% MAC) */
  fuelEfficientCGTarget: number;
  /** Maximum iterations for AI optimization */
  maxIterations: number;
  /** Enable lateral balance check */
  checkLateralBalance: boolean;
  /** Maximum lateral imbalance (kg) */
  maxLateralImbalance: number;
  /** Maximum repack attempts for autoload (bounded search) */
  maxAutoloadAttempts: number;
}

/**
 * Dangerous Goods settings and rules
 */
export interface DGSettings {
  /** Enable DG handling rules */
  enabled: boolean;
  /** Require NOTOC for any DG */
  requireNotoc: boolean;
  /** DG classes and their rules */
  classRules: DGClassRule[];
  /** Separation rules between DG classes */
  separationRules: DGSeparationRule[];
  /** Position restrictions for DG */
  positionRules: DGPositionRule[];
}

/**
 * DG class definition
 */
export interface DGClassRule {
  /** DG class code (e.g., '1.1', '2.1', '3', '7') */
  classCode: string;
  /** Class name */
  name: string;
  /** Description */
  description: string;
  /** Color for UI display */
  color: string;
  /** Is this class allowed on passenger aircraft */
  allowedOnPassenger: boolean;
  /** Is this class allowed on cargo aircraft */
  allowedOnCargo: boolean;
  /** Requires special handling */
  requiresSpecialHandling: boolean;
  /** Must be accessible for inspection */
  mustBeAccessible: boolean;
  /** Maximum quantity per aircraft (kg, 0 = no limit) */
  maxQuantity: number;
}

/**
 * Separation rule between DG classes
 */
export interface DGSeparationRule {
  /** First DG class */
  class1: string;
  /** Second DG class */
  class2: string;
  /** Separation type */
  separation: 'prohibited' | 'separated' | 'segregated' | 'allowed';
  /** Minimum distance in positions (if applicable) */
  minPositions: number;
  /** Description of rule */
  description: string;
}

/**
 * Position-specific DG rules
 */
export interface DGPositionRule {
  /** Position ID or pattern (e.g., 'A*' for all A positions) */
  positionPattern: string;
  /** Allowed DG classes (empty = all allowed) */
  allowedClasses: string[];
  /** Prohibited DG classes */
  prohibitedClasses: string[];
  /** Maximum DG weight at this position */
  maxDGWeight: number;
  /** Reason for restriction */
  reason: string;
}

/**
 * Unload efficiency settings
 */
export interface UnloadSettings {
  /** Enable unload optimization */
  enabled: boolean;
  /** Loading strategy */
  strategy: UnloadStrategy;
  /** Position accessibility scores (can override defaults) */
  accessibilityOverrides: Record<string, number>;
  /** Group cargo by destination */
  groupByDestination: boolean;
  /** Prefer specific zones for first-off cargo */
  firstOffZones: string[];
  /** Prefer specific zones for last-off cargo */
  lastOffZones: string[];
}

/**
 * Unload strategy options
 */
export type UnloadStrategy = 
  | 'lifo'              // Last In, First Out
  | 'accessibility'     // Near doors first
  | 'destination_group' // Group by destination
  | 'balanced';         // Balance between CG and unload

/**
 * Display settings
 */
export interface DisplaySettings {
  /** Theme */
  theme: 'dark' | 'light' | 'auto';
  /** Default warehouse (staging bar) sort mode */
  defaultWarehouseSort: WarehouseSortMode;
  /** Show position IDs on deck view */
  showPositionIds: boolean;
  /** Show weight on loaded positions */
  showWeightOnPositions: boolean;
  /** Highlight overweight positions */
  highlightOverweight: boolean;
  /** Show CG travel on envelope */
  showCGTravel: boolean;
  /** Animation speed for AI loading (ms per item) */
  aiAnimationSpeed: number;
}

/**
 * Compliance / operational policy settings (audit-facing)
 *
 * These settings do not change physics directly, but they do control:
 * - offline policy
 * - runtime self-audit requirements
 * - report generation behavior
 */
export interface ComplianceSettings {
  /** Offline policy for EFB/paperless operation */
  offlinePolicy: {
    /** Allow calculations when offline (requires cached data availability) */
    allowed: boolean;
    /** Maximum cache age allowed in offline mode */
    maxCacheAgeHours: number;
  };
  /** Require assumptions list on every calculation trace / proof pack */
  requireAssumptionsDisclosure: boolean;
  /** Require version labels (software + data hashes) on proof/audit outputs */
  requireVersionLabels: boolean;
}

