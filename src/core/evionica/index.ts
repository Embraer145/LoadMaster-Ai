/**
 * Evionica integration (placeholder).
 *
 * Once you have real exports, this module will:
 * - parse Evionica load sheet/exports
 * - map positions/weights/fuel and reference outputs
 * - generate tolerance diffs for ZFW/TOW/CG/envelope checks
 *
 * For now, it's an explicit stub so the codebase has a single integration point.
 */

export type EvionicaImportResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

export function importEvionicaFile(_fileName: string, _contents: string): EvionicaImportResult {
  return {
    ok: false,
    error: 'Evionica import is not implemented yet (waiting for sample exports / format).',
  };
}


