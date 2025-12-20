/**
 * Aircraft Type Template Repository
 *
 * Stores and retrieves master aircraft type templates (e.g., B747-400F, B747-400F-NUMERIC).
 * These templates are editable by super_admin only and serve as the base for new registrations.
 */

import { queryOne, query, execute, generateId, now } from '../database';
import type { SyncStatus } from '../types';
import type { AircraftConfig } from '@core/types';

export interface AircraftTypeTemplateRecord {
  id: string;
  type_code: string;
  display_name: string;
  template_json: string;
  version: number;
  is_system_default: number; // 0/1
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface AircraftTypeTemplate {
  typeCode: string;
  displayName: string;
  config: AircraftConfig;
  version: number;
  isSystemDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export function parseTemplate(record: AircraftTypeTemplateRecord): AircraftTypeTemplate {
  const config = JSON.parse(record.template_json) as AircraftConfig;
  return {
    typeCode: record.type_code,
    displayName: record.display_name,
    config,
    version: record.version,
    isSystemDefault: record.is_system_default === 1,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    createdBy: record.created_by ?? undefined,
    updatedBy: record.updated_by ?? undefined,
  };
}

export function getAircraftTypeTemplate(typeCode: string): AircraftTypeTemplate | null {
  const rec = queryOne<AircraftTypeTemplateRecord>(
    `SELECT * FROM aircraft_type_templates WHERE type_code = ?`,
    [typeCode]
  );
  return rec ? parseTemplate(rec) : null;
}

export function listAircraftTypeTemplates(): AircraftTypeTemplate[] {
  const recs = query<AircraftTypeTemplateRecord>(
    `SELECT * FROM aircraft_type_templates ORDER BY type_code`
  );
  return recs.map(parseTemplate);
}

export function upsertAircraftTypeTemplate(input: {
  typeCode: string;
  displayName: string;
  config: AircraftConfig;
  isSystemDefault?: boolean;
  userId?: string;
}): AircraftTypeTemplate {
  const timestamp = now();
  const id = generateId();
  const version = 1; // Increment in production for audit trail
  const isSystemDefault = input.isSystemDefault ? 1 : 0;
  const templateJson = JSON.stringify(input.config);

  // Check if we're updating an existing template
  const existing = queryOne<{ created_by: string | null; created_at: string }>(
    `SELECT created_by, created_at FROM aircraft_type_templates WHERE type_code = ?`,
    [input.typeCode]
  );

  execute(
    `
    INSERT INTO aircraft_type_templates (
      id, type_code, display_name, template_json, version, is_system_default,
      created_at, updated_at, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(type_code) DO UPDATE SET
      display_name = excluded.display_name,
      template_json = excluded.template_json,
      version = excluded.version,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by
    `,
    [
      id,
      input.typeCode,
      input.displayName,
      templateJson,
      version,
      isSystemDefault,
      existing?.created_at ?? timestamp,
      timestamp,
      existing?.created_by ?? input.userId ?? null,
      input.userId ?? null,
    ]
  );

  return {
    typeCode: input.typeCode,
    displayName: input.displayName,
    config: input.config,
    version,
    isSystemDefault: input.isSystemDefault ?? false,
    createdAt: existing?.created_at ?? timestamp,
    updatedAt: timestamp,
    createdBy: existing?.created_by ?? input.userId,
    updatedBy: input.userId,
  };
}

export function deleteAircraftTypeTemplate(typeCode: string): boolean {
  // Don't allow deletion of system defaults
  const existing = queryOne<{ is_system_default: number }>(
    `SELECT is_system_default FROM aircraft_type_templates WHERE type_code = ?`,
    [typeCode]
  );

  if (!existing) return false;
  if (existing.is_system_default === 1) {
    throw new Error('Cannot delete system default templates');
  }

  execute(`DELETE FROM aircraft_type_templates WHERE type_code = ?`, [typeCode]);
  return true;
}

