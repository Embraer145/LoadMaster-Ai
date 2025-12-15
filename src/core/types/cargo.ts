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
}

/**
 * Cargo items grouped by type for manifest
 */
export interface CargoManifest {
  items: CargoItem[];
  totalWeight: number;
  totalCount: number;
}

