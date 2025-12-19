/**
 * Airframe Layout Repository
 *
 * Stores and retrieves per-registration layout data (doors/diagram anchors/etc).
 */

import { queryOne, execute, generateId, now } from '../database';
import type { SyncStatus } from '../types';
import type { AirframeLayout } from '@core/types';

export interface AirframeLayoutRecord {
  id: string;
  operator_id: string | null;
  registration: string;
  aircraft_type: string;
  layout_json: string;
  version: number;
  locked: number; // 0/1
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export function parseAirframeLayout(record: AirframeLayoutRecord): AirframeLayout {
  const parsed = JSON.parse(record.layout_json) as Partial<
    Omit<AirframeLayout, 'registration' | 'aircraftType' | 'locked' | 'updatedAtUtc'>
  >;
  const doorsRaw = (parsed.doors ?? []) as AirframeLayout['doors'];
  // Defensive: ensure at most one entry per kind (DB may contain duplicates from older prototypes).
  const doorsByKind = new Map<string, AirframeLayout['doors'][number]>();
  for (const d of doorsRaw) {
    if (!d || typeof (d as any).kind !== 'string') continue;
    // Keep the first occurrence (Admin UI edits the first match); ignore later duplicates.
    if (!doorsByKind.has((d as any).kind)) doorsByKind.set((d as any).kind, d);
  }
  return {
    registration: record.registration,
    aircraftType: record.aircraft_type,
    version: record.version,
    locked: record.locked === 1,
    doors: Array.from(doorsByKind.values()),
    oewKg: typeof parsed.oewKg === 'number' ? parsed.oewKg : undefined,
    positionArms: parsed.positionArms && typeof parsed.positionArms === 'object' ? (parsed.positionArms as Record<string, number>) : undefined,
    stationArms: parsed.stationArms && typeof parsed.stationArms === 'object' ? (parsed.stationArms as Record<string, number>) : undefined,
    labelPreset: parsed.labelPreset,
    positionLabels:
      parsed.positionLabels && typeof parsed.positionLabels === 'object'
        ? (parsed.positionLabels as Record<string, string>)
        : undefined,
    stationLabels:
      parsed.stationLabels && typeof parsed.stationLabels === 'object'
        ? (parsed.stationLabels as Record<string, string>)
        : undefined,
    stationOverrides:
      parsed.stationOverrides && typeof parsed.stationOverrides === 'object'
        ? (parsed.stationOverrides as Record<string, any>)
        : undefined,
    positionConstraints:
      (parsed as any).positionConstraints && typeof (parsed as any).positionConstraints === 'object'
        ? ((parsed as any).positionConstraints as Record<string, any>)
        : undefined,
    positionMaxWeights:
      (parsed as any).positionMaxWeights && typeof (parsed as any).positionMaxWeights === 'object'
        ? ((parsed as any).positionMaxWeights as Record<string, number>)
        : undefined,
    limits: (parsed as any).limits,
    cgLimits: (parsed as any).cgLimits,
    mac: (parsed as any).mac,
    fuelArm: typeof (parsed as any).fuelArm === 'number' ? (parsed as any).fuelArm : undefined,
    isSampleData: typeof (parsed as any).isSampleData === 'boolean' ? (parsed as any).isSampleData : undefined,
    dataProvenance: (parsed as any).dataProvenance,
    status: (parsed as any).status,
    revisionNumber: typeof (parsed as any).revisionNumber === 'number' ? (parsed as any).revisionNumber : undefined,
    effectiveFromUtc: typeof (parsed as any).effectiveFromUtc === 'string' ? (parsed as any).effectiveFromUtc : undefined,
    weighReportDateUtc: typeof (parsed as any).weighReportDateUtc === 'string' ? (parsed as any).weighReportDateUtc : undefined,
    nextWeighDueUtc: typeof (parsed as any).nextWeighDueUtc === 'string' ? (parsed as any).nextWeighDueUtc : undefined,
    changeReason: typeof (parsed as any).changeReason === 'string' ? (parsed as any).changeReason : undefined,
    updatedAtUtc: record.updated_at,
  };
}

export function getAirframeLayoutByRegistration(registration: string): AirframeLayout | null {
  const rec = queryOne<AirframeLayoutRecord>(
    `SELECT * FROM airframe_layouts WHERE registration = ?`,
    [registration]
  );
  return rec ? parseAirframeLayout(rec) : null;
}

export function upsertAirframeLayout(input: {
  operatorId?: string;
  registration: string;
  aircraftType: string;
  layout: Omit<AirframeLayout, 'registration' | 'aircraftType' | 'updatedAtUtc'>;
}): AirframeLayout {
  const timestamp = now();
  const id = generateId();
  const locked = input.layout.locked ? 1 : 0;
  const version = input.layout.version ?? 1;
  const doorsByKind = new Map<string, AirframeLayout['doors'][number]>();
  for (const d of input.layout.doors ?? []) {
    if (!d || typeof (d as any).kind !== 'string') continue;
    // Keep the first occurrence (Admin UI edits the first match); ignore later duplicates.
    if (!doorsByKind.has((d as any).kind)) doorsByKind.set((d as any).kind, d);
  }
  const doors = Array.from(doorsByKind.values());
  const layoutJson = JSON.stringify({
    version,
    locked: input.layout.locked,
    doors,
    oewKg: input.layout.oewKg,
    positionArms: input.layout.positionArms,
    stationArms: input.layout.stationArms,
    labelPreset: input.layout.labelPreset,
    positionLabels: input.layout.positionLabels,
    stationLabels: input.layout.stationLabels,
    stationOverrides: input.layout.stationOverrides,
    positionConstraints: (input.layout as any).positionConstraints,
    positionMaxWeights: (input.layout as any).positionMaxWeights,
    limits: (input.layout as any).limits,
    cgLimits: (input.layout as any).cgLimits,
    mac: (input.layout as any).mac,
    fuelArm: (input.layout as any).fuelArm,
    isSampleData: (input.layout as any).isSampleData,
    dataProvenance: (input.layout as any).dataProvenance,
    status: (input.layout as any).status,
    revisionNumber: (input.layout as any).revisionNumber,
    effectiveFromUtc: (input.layout as any).effectiveFromUtc,
    weighReportDateUtc: (input.layout as any).weighReportDateUtc,
    nextWeighDueUtc: (input.layout as any).nextWeighDueUtc,
    changeReason: (input.layout as any).changeReason,
  });

  execute(
    `
    INSERT INTO airframe_layouts (
      id, operator_id, registration, aircraft_type, layout_json, version, locked,
      created_at, updated_at, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    ON CONFLICT(registration) DO UPDATE SET
      operator_id = excluded.operator_id,
      aircraft_type = excluded.aircraft_type,
      layout_json = excluded.layout_json,
      version = excluded.version,
      locked = excluded.locked,
      updated_at = excluded.updated_at,
      sync_status = 'pending'
    `,
    [
      id,
      input.operatorId ?? null,
      input.registration,
      input.aircraftType,
      layoutJson,
      version,
      locked,
      timestamp,
      timestamp,
    ]
  );

  // Notify UI that a layout has changed so callers can refresh their cached reads.
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lm:airframeLayoutUpdated', { detail: { registration: input.registration } }));
    }
  } catch {
    // ignore
  }

  return {
    registration: input.registration,
    aircraftType: input.aircraftType,
    version,
    locked: input.layout.locked,
    doors,
    oewKg: input.layout.oewKg,
    positionArms: input.layout.positionArms,
    stationArms: input.layout.stationArms,
    labelPreset: input.layout.labelPreset,
    positionLabels: input.layout.positionLabels,
    stationLabels: input.layout.stationLabels,
    stationOverrides: input.layout.stationOverrides,
    positionConstraints: (input.layout as any).positionConstraints,
    positionMaxWeights: (input.layout as any).positionMaxWeights,
    limits: (input.layout as any).limits,
    cgLimits: (input.layout as any).cgLimits,
    mac: (input.layout as any).mac,
    fuelArm: (input.layout as any).fuelArm,
    isSampleData: (input.layout as any).isSampleData,
    dataProvenance: (input.layout as any).dataProvenance,
    status: (input.layout as any).status,
    revisionNumber: (input.layout as any).revisionNumber,
    effectiveFromUtc: (input.layout as any).effectiveFromUtc,
    weighReportDateUtc: (input.layout as any).weighReportDateUtc,
    nextWeighDueUtc: (input.layout as any).nextWeighDueUtc,
    changeReason: (input.layout as any).changeReason,
    updatedAtUtc: timestamp,
  };
}


