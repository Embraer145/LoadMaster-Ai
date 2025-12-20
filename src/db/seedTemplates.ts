/**
 * Seed Templates to Database
 * 
 * One-time migration: Takes templates from code files and saves them to database.
 * After this runs, templates are managed via UI and stored in aircraft_type_templates table.
 */

import { upsertAircraftTypeTemplate } from './repositories/aircraftTypeTemplateRepository';
import { B747_400F_ALPHABETIC_CONFIG } from '@data/aircraft/b747-400f-alphabetic';
import { B747_400F_NUMERIC_CONFIG } from '@data/aircraft/b747-400f-numeric';
import { B747_400F_UPS_CONFIG } from '@data/aircraft/b747-400f-ups';
import { B747_400F_CUSTOM_CONFIG } from '@data/aircraft/b747-400f-custom';
import { isDatabaseInitialized } from './database';

export function seedTemplatesFromCode(): void {
  if (!isDatabaseInitialized()) {
    console.warn('Database not initialized - cannot seed templates');
    return;
  }

  try {
    // Seed the 4 main templates
    console.log('Seeding aircraft type templates to database...');

    upsertAircraftTypeTemplate({
      typeCode: 'B747-400F-ALPHABETIC',
      displayName: 'B747-400F Alphabetic (A1, B1, CL, etc.)',
      config: B747_400F_ALPHABETIC_CONFIG,
      isSystemDefault: true,
      userId: 'SYSTEM_SEED',
    });

    upsertAircraftTypeTemplate({
      typeCode: 'B747-400F-NUMERIC',
      displayName: 'B747-400F Numeric (1, 2, 3A, 4B, etc.)',
      config: B747_400F_NUMERIC_CONFIG,
      isSystemDefault: true,
      userId: 'SYSTEM_SEED',
    });

    upsertAircraftTypeTemplate({
      typeCode: 'B747-400F-UPS',
      displayName: 'B747-400F UPS Layout',
      config: B747_400F_UPS_CONFIG,
      isSystemDefault: true,
      userId: 'SYSTEM_SEED',
    });

    upsertAircraftTypeTemplate({
      typeCode: 'B747-400F-CUSTOM',
      displayName: 'B747-400F Custom (Blank)',
      config: B747_400F_CUSTOM_CONFIG,
      isSystemDefault: false,
      userId: 'SYSTEM_SEED',
    });

    console.log('✅ Templates seeded successfully');
  } catch (err) {
    console.error('Failed to seed templates:', err);
  }
}

/**
 * Check if templates are already seeded
 */
export function areTemplatesSeeded(): boolean {
  try {
    const { listAircraftTypeTemplates } = require('./repositories/aircraftTypeTemplateRepository');
    const templates = listAircraftTypeTemplates();
    return templates.length >= 4;
  } catch {
    return false;
  }
}

