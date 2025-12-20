/**
 * Airframe Layout (per registration)
 *
 * Represents aircraft-specific layout/door configuration. This will expand over time
 * to include datum/arms/position limits overrides per tail.
 */

import type { AircraftConfig, AircraftLimits, CGLimits, MACData, PositionConstraint } from './aircraft';

export type DoorKind = 'nose' | 'main_side' | 'lower_fwd' | 'lower_aft' | 'bulk';
export type DoorSide = 'L' | 'R';

export type AirframeLabelPreset = 'alphabetic' | 'numeric' | 'ups' | 'blank';

export interface AirframeStationOverride {
  /** Optional: override the user-facing label for this station */
  label?: string;
  /** Optional: enable/disable the station for this tail (UI + future W&B modeling) */
  enabled?: boolean;
  /** Optional: override the max count (e.g., jumpseat availability varies per aircraft) */
  maxCount?: number;
}

export interface AirframeDoor {
  kind: DoorKind;
  /** Door is present / enabled for this registration */
  enabled: boolean;
  /** Which side the door is on (Port=L / Starboard=R) */
  side: DoorSide;
  /**
   * Optional anchor for UI label placement.
   * Preferred: anchor to a position slot id + marker style (so super_admin can control door placement per tail).
   * Backwards-compatible: `key` may still be used by older records.
   */
  anchor?: {
    /** Optional legacy semantic anchor (e.g., 'nose', 'main_side_PL', ...) */
    key?: string;
    /** Anchor to an internal slot id (e.g., 'PL', '8A', '14R', '34R') */
    slotId?: string;
    /** Marker style for UI rendering */
    markerStyle?: 'horizontal_under' | 'horizontal_beside' | 'vertical';
    /** Optional pixel offsets for fine placement */
    offsetX?: number;
    offsetY?: number;
  };
}

export interface AirframeLayout {
  registration: string;
  aircraftType: string;
  /**
   * Whether this per-tail dataset is still SAMPLE/simplified.
   * When you enter real manual/weighing report data, set this to false.
   */
  isSampleData?: boolean;
  /**
   * Provenance references for FAA-style traceability (manual rev/table refs, weighing report IDs, etc).
   * Stored per tail because each registration is re-weighed / updated over time.
   */
  dataProvenance?: AircraftConfig['dataProvenance'];
  /**
   * Optional full aircraft limitation blocks per tail.
   * If omitted, the aircraft type defaults are used.
   */
  limits?: AircraftLimits;
  cgLimits?: CGLimits;
  mac?: MACData;
  fuelArm?: number;
  /**
   * Operating Empty Weight (kg) for this specific registration.
   * This can change over time due to maintenance/mods and should be editable by super_admin.
   *
   * NOTE: Prefer populating `limits.OEW` going forward; `oewKg` remains for backward compatibility.
   */
  oewKg?: number;
  /**
   * Per-registration moment arm overrides (inches from datum).
   * These are critical for per-tail accuracy and can evolve over the aircraft's lifetime.
   *
   * - `positionArms`: cargo position arms (A1, CL, 11P, etc)
   * - `stationArms`: non-cargo station arms (crew/items/riders)
   */
  positionArms?: Record<string, number>;
  stationArms?: Record<string, number>;
  /**
   * Optional label preset applied for this registration (convenience only).
   * Super admin can still manually override any individual position/station label.
   */
  labelPreset?: AirframeLabelPreset;
  /**
   * Per-registration display labels for cargo positions (UI only).
   * Keys are the internal position IDs used for W&B math/storage.
   */
  positionLabels?: Record<string, string>;
  /**
   * Per-registration display labels for non-cargo W&B stations (UI only).
   * Keys are station IDs.
   */
  stationLabels?: Record<string, string>;
  /**
   * Per-registration station overrides (jumpseat availability, enable/disable, etc.)
   * Keys are station IDs.
   */
  stationOverrides?: Record<string, AirframeStationOverride>;
  /**
   * Per-registration per-position constraints (geometry/contours).
   * Keys are internal position IDs (A1, CL, 11P, etc).
   */
  positionConstraints?: Record<string, PositionConstraint>;
  /**
   * Optional per-position max weight overrides (kg) per tail.
   * Keys are internal position IDs.
   */
  positionMaxWeights?: Record<string, number>;
  /**
   * Revision metadata for annual re-weigh / audit trail.
   * This is separate from `version` (schema) and is intended to be edited by super_admin.
   */
  status?: 'draft' | 'active' | 'retired';
  revisionNumber?: number;
  effectiveFromUtc?: string;
  weighReportDateUtc?: string;
  nextWeighDueUtc?: string;
  changeReason?: string;
  /** Layout schema version (payload) */
  version: number;
  /** Whether the record is intended to be immutable after setup (still editable by super_admin). */
  locked: boolean;
  /**
   * If true, this registration always uses the current template (no persistent overrides).
   * Used for DEMO/test registrations that should reflect template changes.
   * Real aircraft should have this set to false.
   */
  alwaysUseTemplate?: boolean;
  doors: AirframeDoor[];
  updatedAtUtc: string;
  /** User who last updated this layout (mechanic name, emp#, or super_admin username) */
  updatedBy?: string;
}


