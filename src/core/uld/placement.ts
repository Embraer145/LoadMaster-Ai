import type { CargoItem, PositionDefinition } from '../types';
import { getUldSpec } from './specs';

export type PlacementRejectCode = 'overweight' | 'bulk_only' | 'bulk_required' | 'deck_mismatch' | 'envelope' | 'other';

export type PlacementCheck =
  | { ok: true }
  | {
      ok: false;
      code: PlacementRejectCode;
      reason: string;
    };

function isBulkPosition(pos: Pick<PositionDefinition, 'id' | 'type'>): boolean {
  return pos.type === 'bulk' || pos.id === '52' || pos.id === '53';
}

/**
 * Very simple ULD-vs-position compatibility checks (ops UI guardrails).
 *
 * NOTE: This is intentionally conservative and "family-based".
 * A future certified version should use:
 * - door dimensions
 * - ULD contour catalog (per operator/aircraft)
 * - position-level compatibility tables
 */
export function checkCargoPlacement(
  cargo: CargoItem,
  pos: Pick<PositionDefinition, 'id' | 'deck' | 'type' | 'group' | 'maxWeight'>
): PlacementCheck {
  if (cargo.weight > pos.maxWeight) {
    return { ok: false, code: 'overweight', reason: `Over max weight (${Math.round(cargo.weight)}kg > ${Math.round(pos.maxWeight)}kg)` };
  }

  // Bulk compartment is loose cargo only (in this simulator).
  if (isBulkPosition(pos)) {
    if (cargo.uldType !== 'BULK') {
      return { ok: false, code: 'bulk_only', reason: `Bulk positions accept BULK/loose cargo only (got ${cargo.uldType})` };
    }
    return { ok: true };
  }

  if (cargo.uldType === 'BULK') {
    return { ok: false, code: 'bulk_required', reason: `Bulk/loose cargo can only go in BULK positions (52/53)` };
  }

  // Deck family constraints (do NOT early-return OK; envelope checks apply on BOTH decks)
  if (pos.deck === 'MAIN') {
    if (cargo.uldType === 'LD1' || cargo.uldType === 'LD3') {
      return { ok: false, code: 'deck_mismatch', reason: `${cargo.uldType} containers belong on the LOWER deck` };
    }
  } else {
    // LOWER deck
    if (cargo.uldType === 'PMC' || cargo.uldType === 'P6P') {
      return { ok: false, code: 'deck_mismatch', reason: `${cargo.uldType} pallets belong on the MAIN deck` };
    }
  }

  // Optional geometric constraints (best-effort; intended to become certified later) – applies to both decks.
  const constraints = (pos as any).constraints as PositionDefinition['constraints'] | undefined;
  if (constraints?.maxHeightIn) {
    const specH = getUldSpec(cargo.uldType as any).maxHeightIn;
    const cargoH = typeof cargo.heightIn === 'number' && Number.isFinite(cargo.heightIn) ? cargo.heightIn : specH;
    if (typeof cargoH !== 'number' || !Number.isFinite(cargoH)) {
      return {
        ok: false,
        code: 'envelope',
        reason: `Missing load height for ${cargo.uldType}. Set "Load Height (in)" in the Inspector to use height-limited slots.`,
      };
    }
    if (typeof cargoH === 'number' && Number.isFinite(cargoH) && cargoH > constraints.maxHeightIn) {
      return {
        ok: false,
        code: 'envelope',
        reason: `Exceeds max height for ${pos.id} (${cargoH.toFixed(1)}in > ${constraints.maxHeightIn.toFixed(1)}in)`,
      };
    }
  }

  return { ok: true };
}


