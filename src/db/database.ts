/**
 * Database Manager
 * 
 * Manages SQLite database connection using sql.js.
 * Handles initialization, schema creation, and persistence.
 */

import initSqlJs, { Database as SqlJsDatabase, SqlValue, BindParams } from 'sql.js';
import { SCHEMA_SQL, SCHEMA_VERSION } from './schema';
import { env, debugLog } from '../config/env';

/**
 * Database singleton instance
 */
let db: SqlJsDatabase | null = null;
let sqlJs: Awaited<ReturnType<typeof initSqlJs>> | null = null;

/**
 * Storage key for persisting database
 */
const DB_STORAGE_KEY = `loadmaster_db_${env.dbName}`;
const DB_REV_KEY = `loadmaster_db_rev_${env.dbName}`;
const DB_BROADCAST_CHANNEL = `loadmaster_db_bc_${env.dbName}`;

export function getDbStorageKey(): string {
  return DB_STORAGE_KEY;
}

export function getDbRevKey(): string {
  return DB_REV_KEY;
}

export function getDbBroadcastChannel(): string {
  return DB_BROADCAST_CHANNEL;
}

/**
 * Initialize sql.js and create/load database
 */
export async function initDatabase(): Promise<SqlJsDatabase> {
  if (db) {
    debugLog('Database already initialized');
    return db;
  }

  debugLog('Initializing database...');

  // Initialize sql.js with WASM
  sqlJs = await initSqlJs({
    // Load wasm file from CDN (will be bundled in production)
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
  });

  // Try to load existing database from storage
  const savedData = loadFromStorage();
  
  if (savedData) {
    debugLog('Loading existing database from storage');
    db = new sqlJs.Database(savedData);
  } else {
    debugLog('Creating new database');
    db = new sqlJs.Database();
  }

  // Run migrations to bring database up to current schema version
  const { runMigrations, getCurrentSchemaVersion } = await import('./migrations');
  const beforeVersion = getCurrentSchemaVersion(db);
  
  if (beforeVersion === 0) {
    // Brand new database - create base schema first
    debugLog('Creating base schema for new database');
    db.run(SCHEMA_SQL);
  }
  
  // Run any pending migrations
  const migrationResult = runMigrations(db);
  
  if (migrationResult.errors.length > 0) {
    console.error('❌ Database migrations failed:', migrationResult.errors);
    throw new Error(`Migration failed at version ${migrationResult.errors[0]?.version}`);
  }
  
  if (migrationResult.applied.length > 0) {
    debugLog(`Migrations applied: v${beforeVersion} → v${getCurrentSchemaVersion(db)}`);
  }

  // Seed initial data only on brand-new DBs (best-effort).
  if (!savedData) {
    await seedInitialData(db);
  }

  // Persist to storage after init/seed/migrations
  saveToStorage(db);

  const finalVersion = getCurrentSchemaVersion(db);
  debugLog(`Database initialized (schema v${finalVersion})`);
  return db;
}

/**
 * Get the database instance (must be initialized first)
 */
export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Check if database is initialized
 */
export function isDatabaseInitialized(): boolean {
  return db !== null;
}

/**
 * Save database to localStorage
 */
export function saveToStorage(database?: SqlJsDatabase): void {
  const dbToSave = database || db;
  if (!dbToSave) return;

  try {
    const data = dbToSave.export();
    // NOTE: Do NOT use `String.fromCharCode(...data)` on large arrays — it can overflow the call stack.
    // Encode in chunks to keep stack usage bounded.
    const CHUNK_SIZE = 0x2000; // 8192 bytes per chunk (safe across browsers)
    const parts: string[] = [];
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.subarray(i, i + CHUNK_SIZE);
      parts.push(String.fromCharCode(...chunk));
    }
    const base64 = btoa(parts.join(''));
    localStorage.setItem(DB_STORAGE_KEY, base64);
    // Cross-tab sync: touching a separate key triggers a `storage` event in other tabs.
    const rev = String(Date.now());
    localStorage.setItem(DB_REV_KEY, rev);
    // Also broadcast to other tabs (more reliable than storage events in some edge cases).
    try {
      const bc = new BroadcastChannel(DB_BROADCAST_CHANNEL);
      bc.postMessage({ type: 'db_saved', rev });
      bc.close();
    } catch {
      // ignore
    }
    debugLog('Database saved to storage');
  } catch (error) {
    console.error('Failed to save database to storage:', error);
  }
}

function saveToStorageNoRev(database: SqlJsDatabase): void {
  try {
    const data = database.export();
    const CHUNK_SIZE = 0x2000;
    const parts: string[] = [];
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.subarray(i, i + CHUNK_SIZE);
      parts.push(String.fromCharCode(...chunk));
    }
    const base64 = btoa(parts.join(''));
    localStorage.setItem(DB_STORAGE_KEY, base64);
  } catch (error) {
    console.error('Failed to save database to storage (no-rev):', error);
  }
}

/**
 * Load database from localStorage
 */
function loadFromStorage(): Uint8Array | null {
  try {
    const base64 = localStorage.getItem(DB_STORAGE_KEY);
    if (!base64) return null;

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error('Failed to load database from storage:', error);
    return null;
  }
}

/**
 * Clear database and storage
 */
export function clearDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
  localStorage.removeItem(DB_STORAGE_KEY);
  localStorage.removeItem(DB_REV_KEY);
  debugLog('Database cleared');
}

/**
 * Reload database from localStorage (cross-tab sync).
 * Keeps schema up to date by re-running SCHEMA_SQL.
 */
export async function reloadDatabaseFromStorage(): Promise<void> {
  // If sql.js isn't ready yet, just initialize (it will load from storage if present).
  if (!sqlJs) {
    await initDatabase();
    return;
  }

  const savedData = loadFromStorage();
  try {
    if (db) {
      db.close();
      db = null;
    }
  } catch {
    // ignore
  }

  db = savedData ? new sqlJs.Database(savedData) : new sqlJs.Database();
  db.run(SCHEMA_SQL);
  // IMPORTANT: do NOT bump DB_REV_KEY during a reload, or tabs can get into a ping-pong reload loop.
  // Persist schema upgrades to DB_STORAGE_KEY only.
  saveToStorageNoRev(db);
}

/**
 * Execute a query and return results
 */
export function query<T>(sql: string, params?: BindParams): T[] {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  
  if (params) {
    stmt.bind(params);
  }

  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  
  return results;
}

/**
 * Execute a query and return first result
 */
export function queryOne<T>(sql: string, params?: BindParams): T | null {
  const results = query<T>(sql, params);
  return results[0] || null;
}

/**
 * Execute a statement (INSERT, UPDATE, DELETE)
 */
export function execute(sql: string, params?: BindParams): number {
  const database = getDatabase();
  
  if (params) {
    database.run(sql, params as SqlValue[]);
  } else {
    database.run(sql);
  }
  
  // Auto-save after modifications
  saveToStorage();
  
  return database.getRowsModified();
}

/**
 * Generate a UUID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get current ISO timestamp
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Seed initial data for development
 */
async function seedInitialData(database: SqlJsDatabase): Promise<void> {
  debugLog('Seeding initial data...');

  const timestamp = now();
  const wgaId = generateId();

  // Insert WGA operator
  database.run(`
    INSERT INTO operators (id, code, name, callsign, active, created_at, updated_at, sync_status)
    VALUES (?, 'WGA', 'Western Global Airlines', 'WORLD WIDE', 1, ?, ?, 'synced')
  `, [wgaId, timestamp, timestamp]);

  // Insert aircraft configs (simplified - full config in code; this JSON is a stub)
  const aircraftConfigs = [
    {
      id: generateId(),
      type: 'B747-400F',
      displayName: 'Boeing 747-400 Freighter',
    },
    {
      id: generateId(),
      type: 'B747-400F-NUMERIC',
      displayName: 'Boeing 747-400F (Numeric Prototype)',
    },
    {
      id: generateId(),
      type: 'B747-400F-UPS',
      displayName: 'Boeing 747-400F (UPS Prototype)',
    },
  ] as const;

  const configIdByType = new Map<string, string>(aircraftConfigs.map((c) => [c.type, c.id]));

  for (const c of aircraftConfigs) {
    const configJson = JSON.stringify({
      type: c.type,
      limits: { OEW: 165000, MZFW: 288000, MTOW: 396890, MLW: 302090 },
      cgLimits: { forward: 11, aft: 33 },
      mac: { refChord: 327.8, leMAC: 1150 },
      fuelArm: 1300,
    });
    database.run(
      `
      INSERT INTO aircraft_configs (id, operator_id, type, display_name, config_json, version, created_at, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, 'synced')
      `,
      [c.id, wgaId, c.type, c.displayName, configJson, timestamp, timestamp]
    );
  }

  // Insert fleet aircraft
  const fleet = [
    // Keep seed data aligned with current UI defaults (747 only for now)
    { reg: 'N258SN', type: 'B747-400F' },
    { reg: 'N344KD', type: 'B747-400F' },
    { reg: 'N356KD', type: 'B747-400F' },
    { reg: 'N452SN', type: 'B747-400F' },
  ];

  for (const aircraft of fleet) {
    const configId = configIdByType.get(aircraft.type) ?? configIdByType.get('B747-400F')!;
    database.run(`
      INSERT INTO fleet_aircraft (id, operator_id, registration, aircraft_type, config_id, active, created_at, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, 'synced')
    `, [generateId(), wgaId, aircraft.reg, aircraft.type, configId, timestamp, timestamp]);
  }

  // Seed default airframe layouts (per registration).
  // Default assumption: typical 747 freighter door set present; super_admin can override per tail.
  const defaultDoors = [
    { kind: 'nose', enabled: true, side: 'L', anchor: { key: 'nose', markerStyle: 'vertical' } },
    { kind: 'main_side', enabled: true, side: 'L', anchor: { key: 'main_side_PL', slotId: 'PL', markerStyle: 'horizontal_under' } },
    { kind: 'lower_fwd', enabled: true, side: 'R', anchor: { key: 'lower_fwd', slotId: '21P', markerStyle: 'horizontal_beside' } },
    { kind: 'lower_aft', enabled: true, side: 'R', anchor: { key: 'lower_aft', slotId: '31P', markerStyle: 'horizontal_beside' } },
    { kind: 'bulk', enabled: true, side: 'R', anchor: { key: 'bulk', slotId: '52', markerStyle: 'horizontal_under' } },
  ];
  for (const aircraft of fleet) {
    const labelPreset =
      aircraft.type === 'B747-400F-UPS'
        ? 'ups'
        : aircraft.type === 'B747-400F-NUMERIC'
          ? 'numeric'
          : 'alphabetic';
    const doors =
      aircraft.type === 'B747-400F-UPS'
        ? defaultDoors.map((d) => (d.kind === 'bulk' ? { ...d, enabled: false } : d))
        : defaultDoors;
    const layoutJson = JSON.stringify({
      version: 1,
      locked: true,
      labelPreset,
      doors,
      oewKg: 165000,
    });
    database.run(
      `
      INSERT INTO airframe_layouts (
        id, operator_id, registration, aircraft_type, layout_json, version, locked,
        created_at, updated_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, 'synced')
      `,
      [generateId(), wgaId, aircraft.reg, aircraft.type, layoutJson, timestamp, timestamp]
    );
  }

  // NOTE: Aircraft type templates are now seeded via migration v3 (not here)
  // This ensures templates are seeded exactly once when the table is created

  debugLog('Initial data seeded');
}

