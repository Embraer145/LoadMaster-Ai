/**
 * Aircraft Configurations - Registry
 * 
 * This file serves as the central registry for all aircraft configurations.
 * To add a new aircraft type, create a new config file and register it here.
 */

import type { AircraftConfig } from '@core/types';
import { B747_400F_CONFIG } from './b747-400f';
import { B747_400F_NUMERIC_CONFIG } from './b747-400f-numeric';
import { B747_400F_UPS_CONFIG } from './b747-400f-ups';

// Re-export all aircraft configs
export * from './b747-400f';
export * from './b747-400f-numeric';
export * from './b747-400f-ups';

/**
 * Aircraft Configuration Registry
 * Maps aircraft type codes to their configurations
 */
export const AIRCRAFT_REGISTRY: Record<string, AircraftConfig> = {
  'B747-400F': B747_400F_CONFIG,
  'B747-400BCF': B747_400F_CONFIG,   // Same config for BCF variant
  'B747-400BDSF': B747_400F_CONFIG,  // Same config for BDSF variant
  'B747-400F-NUMERIC': B747_400F_NUMERIC_CONFIG,
  'B747-400F-UPS': B747_400F_UPS_CONFIG,
};

/**
 * Get aircraft configuration by type code
 */
export function getAircraftConfig(typeCode: string): AircraftConfig | undefined {
  return AIRCRAFT_REGISTRY[typeCode];
}

/**
 * Get all available aircraft types
 */
export function getAvailableAircraftTypes(): string[] {
  return Object.keys(AIRCRAFT_REGISTRY);
}

/**
 * Check if an aircraft type is supported
 */
export function isAircraftTypeSupported(typeCode: string): boolean {
  return typeCode in AIRCRAFT_REGISTRY;
}

