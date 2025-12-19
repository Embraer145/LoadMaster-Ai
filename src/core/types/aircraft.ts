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
  /**
   * Optional per-position geometric/contour constraints.
   * Seeded from templates; may be overridden per registration via Airframe Layouts.
   */
  constraints?: PositionConstraint;
}

/**
 * Per-position geometric/contour limits (best-effort until backed by manuals).
 * Units: inches.
 */
export interface PositionConstraint {
  /** Max allowable loaded height at this position (in). */
  maxHeightIn?: number;
  /** Optional max width (in) */
  maxWidthIn?: number;
  /** Optional max length (in) */
  maxLengthIn?: number;
  /** Optional allowlist of ULD/contour codes (string-backed for future catalog) */
  allowedUldCodes?: string[];
  /** Optional allowlist of contour codes (string-backed) */
  allowedContourCodes?: string[];
  /** Provenance/notes (e.g., “Aerostan best-effort”, manual table ref) */
  notes?: string;
  /** Source marker for auditing seed data */
  source?: 'aerostan_best_effort' | 'manual' | 'user';
}

/**
 * Station category for non-cargo loads (crew, riders, equipment, etc.)
 */
export type StationCategory = 'crew' | 'rider' | 'items';

/**
 * A weight & balance station (non-cargo).
 * This is intentionally explicit for auditability: each station has an arm.
 */
export interface StationDefinition {
  /** Unique station id */
  id: string;
  /** Human label (for UI/manifest) */
  label: string;
  /** Arm (station) in inches from datum for moment calculation */
  arm: number;
  /** Category */
  category: StationCategory;
  /** Optional max count (used for seats/jumpseats) */
  maxCount?: number;
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
  /** Non-cargo stations (crew/riders/equipment). Used by Misc/Preflight inputs. */
  stations?: StationDefinition[];
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

