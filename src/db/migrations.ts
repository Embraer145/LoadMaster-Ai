/**
 * Database Migrations
 * 
 * Professional migration system for schema version upgrades.
 * Each migration runs ONCE and is tracked in schema_versions table.
 */

import type { Database as SqlJsDatabase } from 'sql.js';
import { seedTemplatesFromCode } from './seedTemplates';

export interface Migration {
  version: number;
  description: string;
  up: (db: SqlJsDatabase) => void;
}

/**
 * All migrations in order
 */
export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Initial schema - operators, aircraft_configs, fleet, flight_plans, load_plans, audit_log',
    up: (db) => {
      // v1 was the initial schema (already created if database exists)
      // This is a no-op placeholder for tracking purposes
    },
  },
  
  {
    version: 2,
    description: 'Add airframe_layouts table for per-registration door configurations',
    up: (db) => {
      db.run(`
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
      `);
    },
  },
  
  {
    version: 3,
    description: 'Add aircraft_type_templates table for template management',
    up: (db) => {
      db.run(`
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
      `);
      
      // Seed templates after creating table
      try {
        seedTemplatesFromCode();
      } catch (err) {
        console.warn('Template seeding skipped during migration:', err);
      }
    },
  },
];

/**
 * Get current schema version from database
 */
export function getCurrentSchemaVersion(db: SqlJsDatabase): number {
  try {
    // Check if schema_versions table exists
    const tableCheck = db.exec(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='schema_versions'
    `);
    
    if (tableCheck.length === 0) {
      // Table doesn't exist - this is a v0 or v1 database
      // Check if operators table exists to determine if it's v0 or v1
      const operatorsCheck = db.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='operators'
      `);
      return operatorsCheck.length > 0 ? 1 : 0;
    }
    
    // Get the latest version
    const result = db.exec('SELECT MAX(version) as version FROM schema_versions');
    if (result.length > 0 && result[0]?.values.length > 0) {
      const version = result[0].values[0]?.[0];
      return typeof version === 'number' ? version : 1;
    }
    
    return 1;
  } catch (err) {
    console.warn('Error getting schema version:', err);
    return 1; // Safe fallback
  }
}

/**
 * Record that a migration has been applied
 */
export function recordMigration(db: SqlJsDatabase, migration: Migration): void {
  const timestamp = new Date().toISOString();
  
  // Ensure schema_versions table exists
  db.run(`
    CREATE TABLE IF NOT EXISTS schema_versions (
      version INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);
  
  // Record this migration
  db.run(
    `INSERT OR REPLACE INTO schema_versions (version, description, applied_at) 
     VALUES (?, ?, ?)`,
    [migration.version, migration.description, timestamp]
  );
}

/**
 * Run all pending migrations
 */
export function runMigrations(db: SqlJsDatabase): { applied: number[]; errors: Array<{ version: number; error: Error }> } {
  const currentVersion = getCurrentSchemaVersion(db);
  const pendingMigrations = MIGRATIONS.filter(m => m.version > currentVersion);
  
  const applied: number[] = [];
  const errors: Array<{ version: number; error: Error }> = [];
  
  console.log(`Current schema version: ${currentVersion}`);
  
  if (pendingMigrations.length === 0) {
    console.log('✅ Database schema is up to date');
    return { applied, errors };
  }
  
  console.log(`Running ${pendingMigrations.length} pending migration(s)...`);
  
  for (const migration of pendingMigrations) {
    try {
      console.log(`Applying migration v${migration.version}: ${migration.description}`);
      migration.up(db);
      recordMigration(db, migration);
      applied.push(migration.version);
      console.log(`✅ Migration v${migration.version} completed`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`❌ Migration v${migration.version} failed:`, error);
      errors.push({ version: migration.version, error });
      // Stop on first error (don't leave database in inconsistent state)
      break;
    }
  }
  
  if (errors.length === 0) {
    console.log(`✅ All migrations completed successfully. Database now at v${currentVersion + applied.length}`);
  } else {
    console.warn(`⚠️ Some migrations failed. Database remains at v${currentVersion + applied.length}`);
  }
  
  return { applied, errors };
}

/**
 * Check if migrations are needed
 */
export function needsMigration(db: SqlJsDatabase): boolean {
  const currentVersion = getCurrentSchemaVersion(db);
  const latestVersion = Math.max(...MIGRATIONS.map(m => m.version));
  return currentVersion < latestVersion;
}

