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
    
    // Run schema creation
    db.run(SCHEMA_SQL);
    
    // Seed initial data
    await seedInitialData(db);
    
    // Persist to storage
    saveToStorage(db);
  }

  debugLog(`Database initialized (schema v${SCHEMA_VERSION})`);
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
    const base64 = btoa(String.fromCharCode(...data));
    localStorage.setItem(DB_STORAGE_KEY, base64);
    debugLog('Database saved to storage');
  } catch (error) {
    console.error('Failed to save database to storage:', error);
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
  debugLog('Database cleared');
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

  // Insert B747-400F config (simplified - full config in JSON)
  const configId = generateId();
  const configJson = JSON.stringify({
    type: 'B747-400F',
    limits: { OEW: 165000, MZFW: 288000, MTOW: 396890, MLW: 302090 },
    cgLimits: { forward: 11, aft: 33 },
    mac: { refChord: 327.8, leMAC: 1150 },
    fuelArm: 1300,
  });

  database.run(`
    INSERT INTO aircraft_configs (id, operator_id, type, display_name, config_json, version, created_at, updated_at, sync_status)
    VALUES (?, ?, 'B747-400F', 'Boeing 747-400 Freighter', ?, 1, ?, ?, 'synced')
  `, [configId, wgaId, configJson, timestamp, timestamp]);

  // Insert fleet aircraft
  const fleet = [
    { reg: 'N344KD', type: 'B747-400BCF' },
    { reg: 'N356KD', type: 'B747-400BDSF' },
    { reg: 'N404KZ', type: 'B747-400BCF' },
    { reg: 'N545KD', type: 'B747-400F' },
  ];

  for (const aircraft of fleet) {
    database.run(`
      INSERT INTO fleet_aircraft (id, operator_id, registration, aircraft_type, config_id, active, created_at, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, 'synced')
    `, [generateId(), wgaId, aircraft.reg, aircraft.type, configId, timestamp, timestamp]);
  }

  debugLog('Initial data seeded');
}

