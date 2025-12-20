/**
 * Aircraft Configurations - Registry
 * 
 * This file serves as the central registry for all aircraft configurations.
 * To add a new aircraft type, create a new config file and register it here.
 */

import type { AircraftConfig } from '@core/types';
import { B747_400F_ALPHABETIC_CONFIG } from './b747-400f-alphabetic';
import { B747_400F_CONFIG } from './b747-400f';
import { B747_400F_NUMERIC_CONFIG } from './b747-400f-numeric';
import { B747_400F_UPS_CONFIG } from './b747-400f-ups';
import { B747_400F_CUSTOM_CONFIG } from './b747-400f-custom';

// Re-export all aircraft configs
export * from './b747-400f';
export * from './b747-400f-alphabetic';
export * from './b747-400f-numeric';
export * from './b747-400f-ups';
export * from './b747-400f-custom';

/**
 * Aircraft Configuration Registry
 * Maps aircraft type codes to their configurations
 * 
 * TEMPLATE TYPES (Editable via Type Templates tab):
 * - B747-400F-ALPHABETIC: Standard alphabetic position layout (A1, B1, CL, etc.)
 * - B747-400F-NUMERIC: Numeric position layout (1, 2, 3A, 4B, etc.)
 * - B747-400F-UPS: UPS-specific layout
 * - B747-400F-CUSTOM: Blank starting point for custom configs
 * 
 * VARIANT ALIASES (For future use with different OEWs/limits):
 * - B747-400F: Generic 400F (currently points to ALPHABETIC)
 * - B747-400BCF: Boeing Converted Freighter (passenger→cargo conversion)
 * - B747-400BDSF: Boeing Derived Special Freighter (another conversion type)
 */
export const AIRCRAFT_REGISTRY: Record<string, AircraftConfig> = {
  // Primary templates (shown in Template Editor)
  'B747-400F-ALPHABETIC': B747_400F_ALPHABETIC_CONFIG,
  'B747-400F-NUMERIC': B747_400F_NUMERIC_CONFIG,
  'B747-400F-UPS': B747_400F_UPS_CONFIG,
  'B747-400F-CUSTOM': B747_400F_CUSTOM_CONFIG,
  
  // Generic/legacy reference (uses alphabetic)
  'B747-400F': B747_400F_CONFIG,
  
  // Conversion variants (future: may have different OEWs)
  // For now, these use the same template as factory freighter
  'B747-400BCF': B747_400F_CONFIG,
  'B747-400BDSF': B747_400F_CONFIG,
};

/**
 * Get aircraft configuration by type code
 */
export function getAircraftConfig(typeCode: string): AircraftConfig | undefined {
  return AIRCRAFT_REGISTRY[typeCode];
}

/**
 * Get all available aircraft types (includes aliases)
 */
export function getAvailableAircraftTypes(): string[] {
  return Object.keys(AIRCRAFT_REGISTRY);
}

/**
 * Get only the primary editable templates (excludes aliases)
 * Use this for the Template Editor dropdown
 */
export function getEditableTemplateTypes(): string[] {
  return [
    'B747-400F-ALPHABETIC',
    'B747-400F-NUMERIC',
    'B747-400F-UPS',
    'B747-400F-CUSTOM',
  ];
}

/**
 * Get display name for template with description
 */
export function getTemplateDisplayName(typeCode: string): string {
  const descriptions: Record<string, string> = {
    'B747-400F-ALPHABETIC': 'B747-400F Alphabetic (A1, B1, CL, etc.)',
    'B747-400F-NUMERIC': 'B747-400F Numeric (1, 2, 3A, 4B, etc.)',
    'B747-400F-UPS': 'B747-400F UPS Layout',
    'B747-400F-CUSTOM': 'B747-400F Custom (Blank)',
  };
  return descriptions[typeCode] ?? typeCode;
}

/**
 * Check if an aircraft type is supported
 */
export function isAircraftTypeSupported(typeCode: string): boolean {
  return typeCode in AIRCRAFT_REGISTRY;
}

