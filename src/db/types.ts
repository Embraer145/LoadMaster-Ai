/**
 * Database Types
 * 
 * Type definitions for all database entities.
 * These represent the data as stored in SQLite.
 */

/**
 * Sync status for records
 */
export type SyncStatus = 'pending' | 'synced' | 'conflict' | 'local_only';

/**
 * Base entity with common fields
 */
export interface BaseEntity {
  id: string;
  createdAt: string;  // ISO date string
  updatedAt: string;  // ISO date string
  syncStatus: SyncStatus;
}

/**
 * Operator (Company) entity
 */
export interface OperatorEntity extends BaseEntity {
  code: string;           // e.g., 'WGA'
  name: string;           // e.g., 'Western Global Airlines'
  callsign: string;       // e.g., 'WORLD WIDE'
  active: boolean;
}

/**
 * Aircraft configuration entity
 */
export interface AircraftConfigEntity extends BaseEntity {
  operatorId: string;
  type: string;           // e.g., 'B747-400F'
  displayName: string;
  configJson: string;     // JSON blob with full config (limits, positions, etc.)
  version: number;        // Config version for updates
}

/**
 * Fleet aircraft entity
 */
export interface FleetAircraftEntity extends BaseEntity {
  operatorId: string;
  registration: string;   // e.g., 'N404KZ'
  aircraftType: string;   // e.g., 'B747-400F'
  configId: string;       // Reference to aircraft config
  active: boolean;
}

/**
 * Flight plan entity
 */
export interface FlightPlanEntity extends BaseEntity {
  operatorId: string;
  flightNumber: string;   // e.g., 'KD3402'
  flightDate: string;     // ISO date
  registration: string;   // Aircraft registration
  routeJson: string;      // JSON array of route stops
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

/**
 * Route stop (stored as JSON in FlightPlanEntity.routeJson)
 */
export interface RouteStop {
  sequence: number;
  airportCode: string;
  airportName: string;
  isOrigin: boolean;
  isDestination: boolean;
  isStopover: boolean;
  scheduledArrival?: string;
  scheduledDeparture?: string;
}

/**
 * Load plan entity (the main loadsheet)
 */
export interface LoadPlanEntity extends BaseEntity {
  operatorId: string;
  flightPlanId: string;
  flightNumber: string;
  flightDate: string;
  registration: string;
  status: 'draft' | 'final' | 'transmitted' | 'archived';
  fuelKg: number;
  positionsJson: string;  // JSON of loaded positions
  physicsJson: string;    // JSON of calculated physics
  createdBy: string;      // User ID
  finalizedAt?: string;
  transmittedAt?: string;
}

/**
 * Cargo manifest item entity
 */
export interface CargoItemEntity extends BaseEntity {
  operatorId: string;
  flightPlanId: string;
  uldId: string;          // ULD identifier
  awb: string;            // Air waybill
  weightKg: number;
  cargoType: string;      // GEN, PER, DG, PRI, MAL
  origin: string;         // Origin airport
  destination: string;    // Destination airport (off-load point)
  specialHandling?: string;
  dgClass?: string;       // Dangerous goods class if applicable
  loadedPosition?: string; // Position ID where loaded
}

/**
 * Audit log entity
 */
export interface AuditLogEntity {
  id: string;
  timestamp: string;
  operatorId: string;
  userId: string;
  action: string;         // e.g., 'LOAD_PLAN_CREATED', 'CARGO_MOVED'
  entityType: string;     // e.g., 'LoadPlan', 'CargoItem'
  entityId: string;
  previousValue?: string; // JSON of previous state
  newValue?: string;      // JSON of new state
  metadata?: string;      // Additional context as JSON
}

/**
 * Sync log entity
 */
export interface SyncLogEntity {
  id: string;
  timestamp: string;
  direction: 'push' | 'pull';
  entityType: string;
  recordCount: number;
  status: 'success' | 'partial' | 'failed';
  errorMessage?: string;
  durationMs: number;
}

/**
 * User preferences (local only)
 */
export interface UserPreferencesEntity {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

/**
 * Airframe layout entity (per registration)
 */
export interface AirframeLayoutEntity extends BaseEntity {
  operatorId?: string;
  registration: string;
  aircraftType: string;
  layoutJson: string;
  version: number;
  locked: boolean;
}

