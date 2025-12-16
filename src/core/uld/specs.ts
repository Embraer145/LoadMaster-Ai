/**
 * ULD Specs (Sample/Typical)
 *
 * NOTE:
 * These are typical industry dimensions and limits for common ULD families.
 * For FAA-acceptable behavior, these must be replaced by operator/aircraft-specific
 * data sourced from manuals and controlled documents.
 */
import type { UldType } from '../types/cargo';

export interface UldSpec {
  uldType: UldType;
  /** Human label */
  name: string;
  /** Base footprint (inches) */
  baseIn: { length: number; width: number };
  /** Max contour height (inches), if applicable */
  maxHeightIn?: number;
  /** Typical tare weight (kg), approximate */
  tareKg?: number;
  /** Typical maximum gross weight (kg), approximate */
  maxGrossKg?: number;
  /** Notes / assumptions */
  notes?: string;
}

const ULD_SPECS: Record<UldType, UldSpec> = {
  PMC: {
    uldType: 'PMC',
    name: 'PMC Pallet (96×125 in)',
    baseIn: { length: 125, width: 96 },
    tareKg: 110,
    maxGrossKg: 6800,
    notes: 'Typical main-deck pallet base size. Limits vary by aircraft/operator.',
  },
  P6P: {
    uldType: 'P6P',
    name: 'P6P Pallet (96×125 in)',
    baseIn: { length: 125, width: 96 },
    tareKg: 110,
    maxGrossKg: 6800,
    notes: 'Similar footprint to PMC; contour/lockdown differs by net/assembly.',
  },
  LD3: {
    uldType: 'LD3',
    name: 'LD3 Container (AKE)',
    baseIn: { length: 61.5, width: 60.4 },
    maxHeightIn: 64,
    tareKg: 80,
    maxGrossKg: 1600,
    notes: 'Typical belly container family; contour/height varies by variant.',
  },
  LD1: {
    uldType: 'LD1',
    name: 'LD1 Container (AKH)',
    baseIn: { length: 88, width: 60.4 },
    maxHeightIn: 64,
    tareKg: 95,
    maxGrossKg: 2000,
    notes: 'Typical longer belly container family; verify for 747/MD-11 profiles.',
  },
  BULK: {
    uldType: 'BULK',
    name: 'Bulk / Loose Cargo',
    baseIn: { length: 0, width: 0 },
    notes: 'No standardized ULD. Bulk door limits/volume are aircraft-specific.',
  },
  OTHER: {
    uldType: 'OTHER',
    name: 'Other / Unknown ULD',
    baseIn: { length: 0, width: 0 },
    notes: 'Placeholder until a ULD type catalog is provided.',
  },
};

export function getUldSpec(type: UldType): UldSpec {
  return ULD_SPECS[type] ?? ULD_SPECS.OTHER;
}


