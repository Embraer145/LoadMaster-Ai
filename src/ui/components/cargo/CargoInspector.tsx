/**
 * CargoInspector Component
 * 
 * Detailed view and editor for a selected cargo item.
 */

import React, { useMemo, useState } from 'react';
import { Search, MapPin, Package, Barcode, Copy, Check } from 'lucide-react';
import type { CargoItem, LoadedPosition } from '@core/types';
import { checkCargoPlacement, getUldSpec } from '@core/uld';
import { useSettingsStore } from '@core/settings';
import { getCargoVisual, getHandlingBadges } from '@/ui/utils/cargoVisual';
import { UldImage } from '@/ui/components/uld/UldImage';

interface CargoInspectorProps {
  selectedContent: CargoItem | null;
  /** When a slot is selected (even if empty), show slot limits here. */
  selectedPosition?: LoadedPosition | null;
  /** Live drag preview: the item currently being dragged. */
  dragItem?: CargoItem | null;
  /** Live drag preview: the slot currently under the pointer (best-effort; mainly for warehouse drags). */
  dragOverPosition?: LoadedPosition | null;
  onWeightChange: (newWeight: number) => void;
  /** Optional: set cargo/load height (inches) for slot max-height enforcement (especially pallets). */
  onHeightChange?: (heightIn: number | null) => void;
  onToggleMustFly?: (cargoId: string) => void;
  /** When true, renders without its own card chrome (for embedding in tab panels) */
  embedded?: boolean;
}

export const CargoInspector: React.FC<CargoInspectorProps> = ({
  selectedContent,
  selectedPosition,
  dragItem,
  dragOverPosition,
  onWeightChange,
  onHeightChange,
  onToggleMustFly,
  embedded = false,
}) => {
  const [copied, setCopied] = useState(false);
  const cargoColorMode = useSettingsStore((s) => s.settings.display.cargoColorMode);
  const visual = useMemo(
    () => (selectedContent ? getCargoVisual(selectedContent, cargoColorMode) : null),
    [selectedContent, cargoColorMode]
  );
  const badges = useMemo(() => (selectedContent ? getHandlingBadges(selectedContent) : []), [selectedContent]);

  if (!selectedContent) {
    // Slot selected (empty): show slot constraints/limits
    if (selectedPosition) {
      const previewPos = dragOverPosition ?? selectedPosition;
      const preview = dragItem ? checkCargoPlacement(dragItem, previewPos as any) : null;
      const c = (selectedPosition as any).constraints ?? {};
      const maxH = typeof c.maxHeightIn === 'number' ? `${c.maxHeightIn} in` : '—';
      const explicitUlds =
        Array.isArray(c.allowedUldCodes) && c.allowedUldCodes.length ? c.allowedUldCodes.join(', ') : null;
      const explicitContours =
        Array.isArray(c.allowedContourCodes) && c.allowedContourCodes.length ? c.allowedContourCodes.join(', ') : null;

      const derivedUlds = (() => {
        if (explicitUlds) return explicitUlds;
        if (selectedPosition.type === 'bulk' || selectedPosition.id === '52' || selectedPosition.id === '53') return 'BULK only';
        if (selectedPosition.deck === 'MAIN') {
          const h = typeof c.maxHeightIn === 'number' ? c.maxHeightIn : null;
          return `PMC, P6P (pallets${h ? `; Load Height ≤ ${h}in` : ''})`;
        }
        // LOWER
        const h = typeof c.maxHeightIn === 'number' ? c.maxHeightIn : null;
        return `LD1, LD3 (containers${h ? `; height ≤ ${h}in` : ''})`;
      })();

      const derivedContours = (() => {
        if (explicitContours) return explicitContours;
        return 'Not modeled yet (will be derived from contour catalog + envelope geometry)';
      })();
      return (
        <div
          className={
            embedded
              ? 'flex flex-col min-h-0'
              : 'bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-xl p-0 overflow-hidden shadow-2xl min-h-[420px] flex flex-col transition-all duration-300'
          }
        >
          <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white font-mono">{selectedPosition.id}</h3>
                <div className="text-[10px] text-slate-300 font-mono mt-0.5">
                  Slot Inspector • {selectedPosition.deck} • {selectedPosition.type}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Max Weight</div>
                <div className="text-lg font-black text-white font-mono tabular-nums">
                  {Math.round(selectedPosition.maxWeight)}kg
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Limits</div>
              <div className="grid grid-cols-2 gap-2">
                <SpecCell label="Deck" value={selectedPosition.deck} />
                <SpecCell label="Type" value={selectedPosition.type} />
                <SpecCell label="Arm (in)" value={Number.isFinite(selectedPosition.arm) ? String(Math.round(selectedPosition.arm)) : '—'} />
                <SpecCell label="Max Height" value={maxH} />
                <SpecCell label="ULDs (derived)" value={derivedUlds} />
                <SpecCell label="Contours" value={derivedContours} />
              </div>
            </div>

            {dragItem && previewPos && (
              <div className="mt-3 rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Drag Preview</div>
                <div className="text-[10px] text-slate-500 mb-2">
                  {dragOverPosition ? `Hovering ${previewPos.id}` : `Selected ${previewPos.id}`}
                </div>
                {preview?.ok ? (
                  <div className="text-[11px] text-emerald-300 font-bold">
                    OK to place {dragItem.uldType} here.
                  </div>
                ) : (
                  <div className="text-[11px] text-rose-300 font-bold">
                    Cannot place {dragItem.uldType}: {(preview as any)?.reason ?? 'Unknown reason'}
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 text-[10px] text-slate-500">
              Tip: slot height limits are enforced against the cargo item’s <span className="font-bold">Load Height (in)</span>.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={
        embedded
          ? 'p-6 flex flex-col items-center justify-center text-slate-600 min-h-[360px]'
          : 'bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-8 min-h-[420px] flex flex-col items-center justify-center text-slate-600 shadow-inner'
      }>
        <Search size={32} className="mb-3 opacity-20" />
        <p className="text-xs font-medium uppercase tracking-wider">Cargo Inspector</p>
        <p className="text-[10px] opacity-70 mt-1">Select a ULD to view details</p>
      </div>
    );
  }

  const handleCopyUld = async () => {
    try {
      await navigator.clipboard.writeText(selectedContent.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      // no-op (clipboard may be blocked)
    }
  };

  return (
    <div className={
      embedded
        ? 'flex flex-col min-h-0'
        : 'bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-xl p-0 overflow-hidden shadow-2xl min-h-[420px] flex flex-col transition-all duration-300'
    }>
      <div
        className={`p-3 ${
          (cargoColorMode === 'uld' ? (visual?.bg ?? selectedContent.type.color) : selectedContent.type.color).replace(
            'bg-',
            'bg-gradient-to-r from-slate-900 to-'
          )
        } border-b border-white/10`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-mono">{selectedContent.id}</h3>
              <button
                type="button"
                onClick={handleCopyUld}
                className="p-1 rounded bg-slate-950/40 border border-white/10 text-white/80 hover:text-white hover:bg-slate-950/60"
                title="Copy ULD ID"
              >
                {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
              </button>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${
                  cargoColorMode === 'uld' ? (visual?.bg ?? selectedContent.type.color) : selectedContent.type.color
                } border border-white/10`}
                title={cargoColorMode === 'uld' ? 'ULD / contour family' : 'Handling class'}
              >
                {cargoColorMode === 'uld' ? selectedContent.uldType : selectedContent.type.label}
              </span>
              {cargoColorMode === 'uld' && badges.length > 0 && (
                <div className="flex items-center gap-1">
                  {badges.map((b) => (
                    <span
                      key={b}
                      className="px-2 py-0.5 rounded bg-slate-950/50 border border-white/10 text-[10px] font-black text-white"
                      title="Handling flag"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}
              {onToggleMustFly && (
                <button
                  type="button"
                  onClick={() => onToggleMustFly(selectedContent.id)}
                  className={`ml-1 px-3 py-1 rounded-lg border text-[11px] font-black uppercase tracking-wider ${
                    selectedContent.mustFly
                      ? 'bg-red-500/20 text-red-100 border-red-500/40'
                      : 'bg-slate-950/40 text-white/80 border-white/10 hover:bg-slate-950/60'
                  }`}
                  title="MUST GO"
                >
                  MUST GO
                </button>
              )}
            </div>
          </div>

          {/* Weight + compact slider (iPad-friendly) */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="text-2xl font-bold text-white leading-none tabular-nums">
              {(selectedContent.weight / 1000).toFixed(1)}t
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/70 font-mono tabular-nums">
                {selectedContent.weight}kg
              </span>
              <input
                type="range"
                min="100"
                max="8000"
                step="10"
                value={selectedContent.weight}
                onChange={(e) => onWeightChange(parseInt(e.target.value))}
                className="w-40 h-1.5 bg-slate-700 rounded-full appearance-none accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 flex-1 overflow-y-auto">

        {/* Compact route + contents header (frees vertical space) */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <MapPin size={10} /> Route
            </div>
            <div className="mt-0.5 flex items-center gap-2 min-w-0">
              <div className="px-2 py-1 rounded bg-slate-900/50 border border-slate-700/50 text-sm font-mono text-white whitespace-nowrap">
                {selectedContent.origin}
              </div>
              <div className="text-slate-500 font-mono text-sm">→</div>
              <div className="px-2 py-1 rounded bg-slate-900/50 border border-slate-700/50 text-sm font-mono text-white whitespace-nowrap flex items-center gap-2">
                {selectedContent.dest.code}
                <span className="text-lg leading-none">{selectedContent.dest.flag}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 w-44">
            <div className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <Package size={10} /> Contents
            </div>
            <div className="mt-0.5 px-2 py-1 rounded bg-slate-900/50 border border-slate-700/50">
              <div className="text-sm text-slate-200 font-medium truncate">
                {selectedContent.type.label}
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                {selectedContent.uldType} • {selectedContent.handlingFlags.length ? selectedContent.handlingFlags.join(', ') : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* ULD / Container Specs */}
        {(() => {
          const spec = getUldSpec(selectedContent.uldType);
          const dim =
            spec.baseIn.length > 0 && spec.baseIn.width > 0
              ? `${spec.baseIn.width}×${spec.baseIn.length} in`
              : '—';
          const height =
            spec.maxHeightIn
              ? `${spec.maxHeightIn} in`
              : selectedContent.uldType === 'PMC' || selectedContent.uldType === 'P6P'
                ? 'Slot‑dependent'
                : '—';
          const tare = spec.tareKg ? `${spec.tareKg} kg` : '—';
          const maxGross = spec.maxGrossKg ? `${spec.maxGrossKg} kg` : '—';
          const flags = selectedContent.handlingFlags.length > 0 ? selectedContent.handlingFlags.join(', ') : '—';

          return (
            <div className="pt-3 border-t border-slate-700/50">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  ULD / Container
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  {spec.name}
                </div>
              </div>

              <div className="grid grid-cols-[240px_1fr] gap-3 items-start mb-3">
                <UldImage
                  uldCode={selectedContent.uldType}
                  className="w-[240px]"
                  alt={spec.name}
                  maxHeightPx={220}
                />

                <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Key Stats
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <SpecCell label="Type" value={selectedContent.uldType} />
                    <SpecCell label="Base (W×L)" value={dim} />
                    <SpecCell label="Max Height" value={height} />
                    <SpecCell label="Tare" value={tare} />
                    <SpecCell label="Max Gross" value={maxGross} />
                    <SpecCell label="Doors" value={selectedContent.compatibleDoors.join(' / ')} />
                  </div>

                  <div className="mt-3 grid grid-cols-[1fr,120px] items-start gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Load Height (in)
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Used for slot max-height limits (required for pallets when a slot has a height cap).
                      </div>
                    </div>
                    <input
                      type="number"
                      value={typeof selectedContent.heightIn === 'number' ? selectedContent.heightIn : ''}
                      placeholder={spec.maxHeightIn ? String(spec.maxHeightIn) : ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const n = raw === '' ? null : Number(raw);
                        if (!onHeightChange) return;
                        onHeightChange(Number.isFinite(n as number) ? (n as number) : null);
                      }}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white w-full text-right"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <SpecCell label="Flags" value={flags} />
                <SpecCell label="Handling" value={`${selectedContent.type.code} / SPL`} />
                <SpecCell label="AWB" value={selectedContent.awb} />
              </div>

              {spec.notes && (
                <div className="mt-2 text-[10px] text-slate-500">
                  Note: {spec.notes}
                </div>
              )}
            </div>
          );
        })()}

        <div className="pt-2 border-t border-slate-700/50">
          <div className="text-[10px] text-slate-500 flex items-center gap-2">
            <Barcode size={12} />
            <span className="font-mono">AWB {selectedContent.awb}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SpecCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50 min-w-0">
    <span className="text-[9px] text-slate-500 block uppercase font-bold">{label}</span>
    <div className="text-[11px] font-mono text-slate-200 truncate">{value}</div>
  </div>
);

