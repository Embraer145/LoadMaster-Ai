/**
 * Cargo Type Definitions
 * Pure TypeScript - No framework dependencies
 * 
 * These types define cargo items, ULDs, and related data.
 */

/**
 * Cargo classification codes
 */
export type CargoCode = 'GEN' | 'PER' | 'DG' | 'PRI' | 'MAL';

/**
 * Simplified ULD type codes (placeholder until operator/aircraft-specific ULD catalogs are loaded)
 */
export type UldType = 'PMC' | 'P6P' | 'LD3' | 'LD1' | 'BULK' | 'OTHER';

/**
 * Simplified door identifiers (compatibility is currently heuristic)
 */
export type DoorId = 'NOSE' | 'SIDE' | 'LOWER_FWD' | 'LOWER_AFT' | 'BULK';

/**
 * Cargo type metadata for display
 */
export interface CargoTypeInfo {
  /** Display label */
  label: string;
  /** Tailwind background color class */
  color: string;
  /** Tailwind border color class */
  border: string;
  /** Short code */
  code: CargoCode;
}

/**
 * Registry of all cargo types
 */
export type CargoTypeRegistry = Record<string, CargoTypeInfo>;

/**
 * Destination information
 */
export interface Destination {
  /** IATA code (e.g., 'JFK') */
  code: string;
  /** City name */
  city: string;
  /** Flag emoji */
  flag: string;
}

/**
 * A stop on a route (used for multi-stop flights)
 */
export interface RouteStop {
  /** Airport code */
  code: string;
  /** City name */
  city: string;
  /** Flag emoji */
  flag: string;
}

/**
 * A cargo item (ULD or pallet)
 */
export interface CargoItem {
  /** Unique identifier (e.g., 'ULD-12345') */
  id: string;
  /** Air Waybill number */
  awb: string;
  /** Weight in kg */
  weight: number;
  /** Cargo type information */
  type: CargoTypeInfo;
  /** Destination */
  dest: Destination;
  /** Origin airport code */
  origin: string;
  /** Preferred deck for loading */
  preferredDeck: 'MAIN' | 'LOWER';
  /** Offload point - the stop where this cargo will be unloaded */
  offloadPoint: string;

  /**
   * MUST FLY flag (ops priority).
   * When true, the autoloader must place this item within limits or fail the run.
   */
  mustFly?: boolean;

  /** ULD type (e.g., PMC, LD3). Used for ops metadata and door compatibility checks. */
  uldType: UldType;
  /**
   * Door compatibility (heuristic for now).
   * In a certified version, this should be derived from actual door dimensions + ULD contour.
   */
  compatibleDoors: DoorId[];
  /** Operational handling flags (e.g., DG, PER, PRI). */
  handlingFlags: string[];
}

/**
 * Cargo items grouped by type for manifest
 */
export interface CargoManifest {
  items: CargoItem[];
  totalWeight: number;
  totalCount: number;
}

