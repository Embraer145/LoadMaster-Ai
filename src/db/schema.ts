/**
 * Database Schema
 * 
 * SQL schema definitions for SQLite database.
 * All tables use TEXT for dates (ISO format) for SQLite compatibility.
 */

/**
 * Schema version for migrations
 */
export const SCHEMA_VERSION = 3;

/**
 * All table creation SQL statements
 */
export const SCHEMA_SQL = `
-- =============================================================================
-- LoadMaster Pro Database Schema v${SCHEMA_VERSION}
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Operators (Companies)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS operators (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  callsign TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'local_only'
);

CREATE INDEX IF NOT EXISTS idx_operators_code ON operators(code);

-- -----------------------------------------------------------------------------
-- Aircraft Configurations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aircraft_configs (
  id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  type TEXT NOT NULL,
  display_name TEXT,
  config_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'local_only',
  FOREIGN KEY (operator_id) REFERENCES operators(id)
);

CREATE INDEX IF NOT EXISTS idx_aircraft_configs_type ON aircraft_configs(type);
CREATE INDEX IF NOT EXISTS idx_aircraft_configs_operator ON aircraft_configs(operator_id);

-- -----------------------------------------------------------------------------
-- Fleet Aircraft
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fleet_aircraft (
  id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  registration TEXT NOT NULL,
  aircraft_type TEXT NOT NULL,
  config_id TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'local_only',
  FOREIGN KEY (operator_id) REFERENCES operators(id),
  FOREIGN KEY (config_id) REFERENCES aircraft_configs(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fleet_registration ON fleet_aircraft(registration);
CREATE INDEX IF NOT EXISTS idx_fleet_operator ON fleet_aircraft(operator_id);

-- -----------------------------------------------------------------------------
-- Airframe Layouts (per registration)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS airframe_layouts (
  id TEXT PRIMARY KEY,
  operator_id TEXT,
  registration TEXT NOT NULL UNIQUE,
  aircraft_type TEXT NOT NULL,
  layout_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  locked INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'local_only',
  FOREIGN KEY (operator_id) REFERENCES operators(id)
);

CREATE INDEX IF NOT EXISTS idx_airframe_layouts_registration ON airframe_layouts(registration);
CREATE INDEX IF NOT EXISTS idx_airframe_layouts_operator ON airframe_layouts(operator_id);

-- -----------------------------------------------------------------------------
-- Aircraft Type Templates (Master Templates)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aircraft_type_templates (
  id TEXT PRIMARY KEY,
  type_code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  template_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_system_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_aircraft_type_templates_code ON aircraft_type_templates(type_code);

-- -----------------------------------------------------------------------------
-- Flight Plans
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flight_plans (
  id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  flight_number TEXT NOT NULL,
  flight_date TEXT NOT NULL,
  registration TEXT NOT NULL,
  route_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'local_only',
  FOREIGN KEY (operator_id) REFERENCES operators(id)
);

CREATE INDEX IF NOT EXISTS idx_flight_plans_date ON flight_plans(flight_date);
CREATE INDEX IF NOT EXISTS idx_flight_plans_number ON flight_plans(flight_number);
CREATE INDEX IF NOT EXISTS idx_flight_plans_operator ON flight_plans(operator_id);

-- -----------------------------------------------------------------------------
-- Load Plans (Loadsheets)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS load_plans (
  id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  flight_plan_id TEXT,
  flight_number TEXT NOT NULL,
  flight_date TEXT NOT NULL,
  registration TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  fuel_kg REAL NOT NULL,
  positions_json TEXT NOT NULL,
  physics_json TEXT NOT NULL,
  created_by TEXT,
  finalized_at TEXT,
  transmitted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'local_only',
  FOREIGN KEY (operator_id) REFERENCES operators(id),
  FOREIGN KEY (flight_plan_id) REFERENCES flight_plans(id)
);

CREATE INDEX IF NOT EXISTS idx_load_plans_date ON load_plans(flight_date);
CREATE INDEX IF NOT EXISTS idx_load_plans_flight ON load_plans(flight_number);
CREATE INDEX IF NOT EXISTS idx_load_plans_status ON load_plans(status);

-- -----------------------------------------------------------------------------
-- Cargo Items (Manifest)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cargo_items (
  id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  flight_plan_id TEXT,
  uld_id TEXT NOT NULL,
  awb TEXT,
  weight_kg REAL NOT NULL,
  cargo_type TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  special_handling TEXT,
  dg_class TEXT,
  loaded_position TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'local_only',
  FOREIGN KEY (operator_id) REFERENCES operators(id),
  FOREIGN KEY (flight_plan_id) REFERENCES flight_plans(id)
);

CREATE INDEX IF NOT EXISTS idx_cargo_flight ON cargo_items(flight_plan_id);
CREATE INDEX IF NOT EXISTS idx_cargo_destination ON cargo_items(destination);
CREATE INDEX IF NOT EXISTS idx_cargo_type ON cargo_items(cargo_type);

-- -----------------------------------------------------------------------------
-- Audit Log (for certification compliance)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  operator_id TEXT,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);

-- -----------------------------------------------------------------------------
-- Sync Log
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_log (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  direction TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  duration_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_timestamp ON sync_log(timestamp);

-- -----------------------------------------------------------------------------
-- User Preferences (local only)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- -----------------------------------------------------------------------------
-- Schema Version Tracking
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

INSERT OR IGNORE INTO schema_version (version, applied_at) 
VALUES (${SCHEMA_VERSION}, datetime('now'));
`;

/**
 * Get table names for the schema
 */
export const TABLE_NAMES = [
  'operators',
  'aircraft_configs',
  'fleet_aircraft',
  'airframe_layouts',
  'flight_plans',
  'load_plans',
  'cargo_items',
  'audit_log',
  'sync_log',
  'user_preferences',
  'schema_version',
] as const;

export type TableName = typeof TABLE_NAMES[number];

