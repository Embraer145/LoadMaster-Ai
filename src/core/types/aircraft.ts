/**
 * Aircraft Type Definitions
 * Pure TypeScript - No framework dependencies
 * 
 * These types define the structure of aircraft configurations
 * that can be loaded into the LoadMaster system.
 */

/**
 * Weight limits for an aircraft (in kg)
 */
export interface AircraftLimits {
  /** Operating Empty Weight */
  OEW: number;
  /** Maximum Zero Fuel Weight */
  MZFW: number;
  /** Maximum Takeoff Weight */
  MTOW: number;
  /** Maximum Landing Weight */
  MLW: number;
}

/**
 * Center of Gravity limits (in % MAC)
 */
export interface CGLimits {
  /** Forward limit */
  forward: number;
  /** Aft limit */
  aft: number;
}

/**
 * Mean Aerodynamic Chord data for CG calculations
 */
export interface MACData {
  /** Reference chord length in inches */
  refChord: number;
  /** Leading Edge MAC position (station) */
  leMAC: number;
}

/**
 * Type of cargo position (for layout rendering)
 */
export type PositionType = 
  | 'nose' 
  | 'nose_side' 
  | 'left' 
  | 'right' 
  | 'tail' 
  | 'lower_fwd' 
  | 'lower_aft' 
  | 'bulk';

/**
 * Which deck the position is on
 */
export type DeckType = 'MAIN' | 'LOWER';

/**
 * Lower deck compartment grouping
 */
export type LowerHoldGroup = 'FWD' | 'AFT' | 'BULK';

/**
 * Definition of a single cargo position on the aircraft
 */
export interface PositionDefinition {
  /** Unique position identifier (e.g., 'A1', 'CL', '11P') */
  id: string;
  /** Position type for layout */
  type: PositionType;
  /** Which deck */
  deck: DeckType;
  /** Maximum weight capacity in kg */
  maxWeight: number;
  /** Arm (station) in inches from datum for moment calculation */
  arm: number;
  /** For lower deck positions, which compartment group */
  group?: LowerHoldGroup;
}

/**
 * Complete aircraft configuration
 */
export interface AircraftConfig {
  /** Aircraft type designation (e.g., 'B747-400F') */
  type: string;
  /** Optional display name */
  displayName?: string;
  /**
   * Indicates whether this configuration is sample/simplified (not traceable to aircraft manual tables).
   * When false, values should be backed by approved data + provenance references.
   */
  isSampleData?: boolean;
  /**
   * Optional provenance references for FAA-style traceability.
   * Use this to link each major data block to a source document revision/page/table.
   */
  dataProvenance?: {
    aircraftIdentity?: string; // e.g. model/STC/config string
    documents?: Array<{
      id: string;
      title: string;
      revision?: string;
      reference?: string; // page/table reference
      notes?: string;
    }>;
    notes?: string;
  };
  /** Weight limits */
  limits: AircraftLimits;
  /** CG limits in % MAC */
  cgLimits: CGLimits;
  /** MAC data for CG calculations */
  mac: MACData;
  /** All cargo positions on this aircraft type */
  positions: PositionDefinition[];
  /** Default fuel arm for calculations */
  fuelArm: number;
}

/**
 * An aircraft instance (registration + config)
 */
export interface AircraftInstance {
  /** Registration number (e.g., 'N545KD') */
  registration: string;
  /** Aircraft type reference */
  type: string;
  /** Reference to the configuration */
  config: AircraftConfig;
}

