/**
 * Environment Configuration
 * 
 * Type-safe access to environment variables.
 * All VITE_ prefixed variables are available at runtime.
 */

/**
 * Application environment
 */
export type AppEnvironment = 'development' | 'staging' | 'production';

/**
 * Environment configuration interface
 */
export interface EnvConfig {
  // App
  appEnv: AppEnvironment;
  debugMode: boolean;
  appVersion: string;
  
  // API
  apiBaseUrl: string;
  apiTimeout: number;
  offlineEnabled: boolean;
  
  // Sync
  syncIntervalMinutes: number;
  autoSyncOnStart: boolean;
  syncMaxRetries: number;
  
  // Database
  dbName: string;
  dbLogging: boolean;
  
  // Features
  features: {
    aiAutoload: boolean;
    notoc: boolean;
    transmit: boolean;
    dgHandling: boolean;
  };
  
  // Operator
  defaultOperator: string;
  multiTenant: boolean;
  
  // Compliance
  auditLogging: boolean;
  auditRetentionDays: number;
  calculationVerification: boolean;
}

/**
 * Parse boolean from environment variable
 */
function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Parse integer from environment variable
 */
function parseInt(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get environment configuration
 * Validates and provides type-safe access to all env variables
 */
export function getEnvConfig(): EnvConfig {
  return {
    // App
    appEnv: (import.meta.env.VITE_APP_ENV as AppEnvironment) || 'development',
    debugMode: parseBool(import.meta.env.VITE_DEBUG_MODE, true),
    appVersion: import.meta.env.VITE_APP_VERSION || '0.0.0',
    
    // API
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT, 30000),
    offlineEnabled: parseBool(import.meta.env.VITE_OFFLINE_ENABLED, true),
    
    // Sync
    syncIntervalMinutes: parseInt(import.meta.env.VITE_SYNC_INTERVAL_MINUTES, 15),
    autoSyncOnStart: parseBool(import.meta.env.VITE_AUTO_SYNC_ON_START, true),
    syncMaxRetries: parseInt(import.meta.env.VITE_SYNC_MAX_RETRIES, 3),
    
    // Database
    dbName: import.meta.env.VITE_DB_NAME || 'loadmaster',
    dbLogging: parseBool(import.meta.env.VITE_DB_LOGGING, false),
    
    // Features
    features: {
      aiAutoload: parseBool(import.meta.env.VITE_FEATURE_AI_AUTOLOAD, true),
      notoc: parseBool(import.meta.env.VITE_FEATURE_NOTOC, true),
      transmit: parseBool(import.meta.env.VITE_FEATURE_TRANSMIT, true),
      dgHandling: parseBool(import.meta.env.VITE_FEATURE_DG_HANDLING, true),
    },
    
    // Operator
    defaultOperator: import.meta.env.VITE_DEFAULT_OPERATOR || 'WGA',
    multiTenant: parseBool(import.meta.env.VITE_MULTI_TENANT, false),
    
    // Compliance
    auditLogging: parseBool(import.meta.env.VITE_AUDIT_LOGGING, true),
    auditRetentionDays: parseInt(import.meta.env.VITE_AUDIT_RETENTION_DAYS, 365),
    calculationVerification: parseBool(import.meta.env.VITE_CALCULATION_VERIFICATION, true),
  };
}

/**
 * Singleton instance of environment config
 */
export const env = getEnvConfig();

/**
 * Check if running in development mode
 */
export const isDev = env.appEnv === 'development';

/**
 * Check if running in production mode
 */
export const isProd = env.appEnv === 'production';

/**
 * Debug logger that only logs in development or when debug mode is enabled
 */
export function debugLog(message: string, ...args: unknown[]): void {
  if (env.debugMode) {
    console.log(`[LoadMaster] ${message}`, ...args);
  }
}

