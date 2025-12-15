/**
 * Load Plan Type Definitions
 * Pure TypeScript - No framework dependencies
 * 
 * These types define the state of a loading operation.
 */

import type { PositionDefinition } from './aircraft';
import type { CargoItem } from './cargo';

/**
 * A position with its loaded content
 */
export interface LoadedPosition extends PositionDefinition {
  /** The cargo item loaded at this position, or null if empty */
  content: CargoItem | null;
}

/**
 * Physics calculation results
 */
export interface PhysicsResult {
  /** Total weight including fuel (kg) */
  weight: number;
  /** Takeoff CG in % MAC */
  towCG: number;
  /** Zero Fuel Weight (kg) */
  zfw: number;
  /** ZFW CG in % MAC */
  zfwCG: number;
  /** Total moment (kg * inches) */
  totalMoment: number;
  /** Is aircraft overweight? */
  isOverweight: boolean;
  /** Is CG out of limits? */
  isUnbalanced: boolean;
  /** Forward limit at current weight */
  forwardLimit: number;
  /** Aft limit at current weight */
  aftLimit: number;
}

/**
 * Flight information
 */
export interface FlightInfo {
  /** Flight number (e.g., 'KD3402') */
  flightNumber: string;
  /** Aircraft registration */
  registration: string;
  /** Origin airport */
  origin: string;
  /** Destination airport */
  destination: string;
  /** Stopover airport (if any) */
  stopover: string | null;
  /** Flight date */
  date: string;
}

/**
 * Complete load plan state
 */
export interface LoadPlan {
  /** Flight information */
  flight: FlightInfo | null;
  /** Aircraft type being used */
  aircraftType: string;
  /** All positions with their loaded content */
  positions: LoadedPosition[];
  /** Items in warehouse (not yet loaded) */
  warehouse: CargoItem[];
  /** Fuel load in kg */
  fuel: number;
  /** Calculated physics */
  physics: PhysicsResult | null;
}

/**
 * Drag state for UI
 */
export interface DragState {
  /** Item being dragged */
  item: CargoItem | null;
  /** Source of the drag ('warehouse' or position ID) */
  source: 'warehouse' | string | null;
}

/**
 * Selection state for UI
 */
export interface SelectionState {
  /** ID of selected item or position */
  id: string | null;
  /** Source type */
  source: 'warehouse' | 'slot' | null;
}

