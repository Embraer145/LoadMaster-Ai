/**
 * AircraftDiagram Component
 * 
 * Visual representation of B747-400F cargo positions with door labels.
 * 
 * ORIENTATION (Plan View - Looking Down):
 * - NOSE on LEFT, TAIL on RIGHT
 * - TOP row = RIGHT / STARBOARD side (R positions) when facing nose
 * - BOTTOM row = LEFT / PORT side (L positions) when facing nose
 * 
 * B747-400F CARGO DOORS:
 * - Nose Cargo Door: Front of aircraft, opens upward
 * - Main Deck Side Cargo Door: LEFT (Port) side, between positions G-H
 * - Lower Deck FWD Door: RIGHT (Starboard) side
 * - Lower Deck AFT Door: RIGHT (Starboard) side
 * - Bulk Cargo Door: RIGHT (Starboard) side, aft
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DoorOpen, Info, RotateCw } from 'lucide-react';
import type { LoadedPosition, CargoItem, DragState, SelectionState, PhysicsResult, AirframeLayout, DoorKind, AircraftConfig } from '@core/types';
import { DeckSlot } from './DeckSlot';
import { AircraftProfile } from './AircraftProfile';
import { FuselageRuler } from './FuselageRuler';
import { useSettingsStore } from '@core/settings';
import { getCargoVisual, getHandlingBadges } from '@/ui/utils/cargoVisual';

// Door styling (operator request): RED.
const DOOR = {
  bg: 'bg-red-500/10',
  border: 'border-red-500/30',
  text: 'text-red-300',
  pillBg: 'bg-red-600',
  line: 'bg-red-500',
};

// All B747-400F variants share the same fuselage length in the diagram; slot widths should flex.
const FUSELAGE_CANVAS_PX = 980;
const LOWER_SEG_UNITS = {
  // Prioritize readable slots; wing/bulk placeholders should not consume a large share.
  fwd: 7,
  wing: 2,
  aft: 7,
  bulk: 2,
} as const;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

interface AircraftDiagramProps {
  aircraftType: string;
  aircraftConfig: AircraftConfig;
  positions: LoadedPosition[];
  selection: SelectionState;
  drag: DragState;
  toast: { tone: 'error' | 'info'; message: string; canOverride?: boolean } | null;
  onDismissToast: () => void;
  onOverrideToast: () => void;
  flight: { registration: string; flightNumber: string } | null;
  airframeLayout: AirframeLayout | null;
  mainDeckLateralDeltaKg: number;
  mainDeckLateralLimitKg: number;
  lateralCheckEnabled: boolean;
  optimizationMode: 'safety' | 'fuel_efficiency' | 'unload_efficiency';
  aiStatus:
    | null
    | {
        phase: 'thinking' | 'placing' | 'repacking' | 'failed' | 'cancelled';
        attempt: number;
        maxAttempts: number;
        message: string;
        canRetry?: boolean;
      };
  onSelectOptimizationMode: (mode: 'safety' | 'fuel_efficiency' | 'unload_efficiency') => void;
  onClearAll: () => void;
  physics: PhysicsResult;
  onOpenNotoc: () => void;
  onOpenFinalize: () => void;
  onOpenCaptainBrief: () => void;
  onOpenProofPack: () => void;
  onOpenAirframeInfo: () => void;
  onSelectPosition: (id: string) => void;
  onDragStart: (item: CargoItem, positionId: string) => void;
  onDragEnd: () => void;
  onDrop: (positionId: string) => void;
}

export const AircraftDiagram: React.FC<AircraftDiagramProps> = ({
  aircraftType,
  aircraftConfig,
  positions,
  selection,
  drag,
  toast,
  onDismissToast,
  onOverrideToast,
  flight,
  airframeLayout,
  mainDeckLateralDeltaKg,
  mainDeckLateralLimitKg,
  lateralCheckEnabled,
  optimizationMode,
  aiStatus,
  onSelectOptimizationMode,
  onClearAll,
  physics,
  onOpenNotoc,
  onOpenFinalize,
  onOpenCaptainBrief,
  onOpenProofPack,
  onOpenAirframeInfo,
  onSelectPosition,
  onDragStart,
  onDragEnd,
  onDrop,
}) => {
  const getPosition = (id: string) => positions.find(p => p.id === id)!;
  const [view, setView] = useState<'plan' | 'profile'>('plan');
  const cargoColorMode = useSettingsStore((s) => s.settings.display.cargoColorMode);
  const layoutKind = useMemo<'alphabetic' | 'numeric' | 'ups'>(() => {
    const t = (aircraftType ?? '').toUpperCase();
    if (t.includes('UPS')) return 'ups';
    if (t.includes('NUMERIC')) return 'numeric';
    return 'alphabetic';
  }, [aircraftType]);

  const numericMainPairs = useMemo(() => {
    // Assumption-based prototype: 4–14 and 18–19 are paired A/B; 1–3 and 20 are centerline.
    return [...Array.from({ length: 11 }, (_, i) => 4 + i), 18, 19];
  }, []);

  const numericLowerFwd = useMemo(() => Array.from({ length: 8 }, (_, i) => 11 + i), []);
  const numericLowerAft = useMemo(() => Array.from({ length: 7 }, (_, i) => 31 + i), []);

  const ruler = useMemo(() => {
    const posArms = positions.map((p) => p.arm).filter((a) => typeof a === 'number' && Number.isFinite(a));
    const st = aircraftConfig.stations ?? [];
    const stEnabled = (id: string) => airframeLayout?.stationOverrides?.[id]?.enabled ?? true;
    const stationArms = st
      .filter((s) => stEnabled(s.id))
      .map((s) => s.arm)
      .filter((a) => typeof a === 'number' && Number.isFinite(a));

    const all = [...posArms, ...stationArms];
    const min = all.length ? Math.min(...all) : 0;
    const max = all.length ? Math.max(...all) : min + 1;

    // UI request: ruler should be a clean longitudinal reference only (no station labels).
    const stations: Array<{ id: string; label: string; armIn: number }> = [];

    return {
      range: { minIn: min, maxIn: max === min ? min + 1 : max },
      stations,
    };
  }, [positions, aircraftConfig.stations, airframeLayout?.stationLabels, airframeLayout?.stationOverrides]);

  const getDisplayLabel = (id: string) => {
    return airframeLayout?.positionLabels?.[id] ?? id;
  };

  const hasDoor = useMemo(() => {
    const doors = airframeLayout?.doors ?? [];
    const byKind = new Map<DoorKind, boolean>();
    for (const d of doors) byKind.set(d.kind, !!d.enabled);
    // Default behavior (until configured): show doors.
    return (kind: DoorKind) => byKind.get(kind) ?? true;
  }, [airframeLayout]);

  // Note: for now, lower deck door tags are always rendered as starboard/right per template requirement.

  const doorByKind = useMemo(() => {
    const doors = airframeLayout?.doors ?? [];
    const byKind = new Map<DoorKind, (AirframeLayout['doors'][number])>();
    for (const d of doors) byKind.set(d.kind, d as any);
    return (kind: DoorKind) => byKind.get(kind);
  }, [airframeLayout]);

  const doorSlotAnchor = (kind: DoorKind): { slotId: string | null; markerStyle: 'horizontal_under' | 'horizontal_beside' | 'vertical' } => {
    const d = doorByKind(kind);
    const style = (d?.anchor?.markerStyle ??
      (kind === 'nose' ? 'vertical' : kind === 'main_side' || kind === 'bulk' ? 'horizontal_under' : 'horizontal_beside')) as
      | 'horizontal_under'
      | 'horizontal_beside'
      | 'vertical';

    const configured = (d?.anchor?.slotId ?? null) as string | null;
    if (configured) return { slotId: configured, markerStyle: style };

    // Fallbacks by layout kind (so prototypes look right even before admin config is set)
    if (kind === 'main_side') {
      return { slotId: layoutKind === 'numeric' || layoutKind === 'ups' ? '8A' : 'PL', markerStyle: 'horizontal_under' };
    }
    if (kind === 'lower_fwd') {
      return { slotId: layoutKind === 'numeric' ? '14R' : layoutKind === 'ups' ? 'P5' : '21P', markerStyle: 'horizontal_beside' };
    }
    if (kind === 'lower_aft') {
      return { slotId: layoutKind === 'numeric' ? '34R' : layoutKind === 'ups' ? 'P9' : '31P', markerStyle: 'horizontal_beside' };
    }
    if (kind === 'bulk') {
      // UPS template: no bulk, so this anchor won't be used.
      return { slotId: '52', markerStyle: 'horizontal_under' };
    }
    return { slotId: null, markerStyle: style };
  };

  const doorAnchorsBySlot = useMemo(() => {
    const out = new Map<string, Array<{ kind: DoorKind; markerStyle: 'horizontal_under' | 'horizontal_beside' | 'vertical'; label: string }>>();
    const add = (kind: DoorKind, label: string) => {
      if (!hasDoor(kind)) return;
      const { slotId, markerStyle } = doorSlotAnchor(kind);
      if (!slotId) return;
      const arr = out.get(slotId) ?? [];
      arr.push({ kind, markerStyle, label });
      out.set(slotId, arr);
    };
    add('main_side', layoutKind === 'numeric' ? 'MAIN CARGO DOOR (L)' : 'SIDE CARGO DOOR (L)');
    add('lower_fwd', 'FWD CARGO DOOR (R)');
    add('lower_aft', 'AFT CARGO DOOR (R)');
    add('bulk', 'BULK (R)');
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKind, airframeLayout, hasDoor]);

  const [rearrangePointer, setRearrangePointer] = useState<{
    pointerId: number;
    x: number;
    y: number;
    sourceId: string;
  } | null>(null);
  const [rearrangeOverId, setRearrangeOverId] = useState<string | null>(null);

  const isRearranging = useMemo(() => {
    return !!rearrangePointer && !!drag.item && drag.source === rearrangePointer.sourceId;
  }, [rearrangePointer, drag.item, drag.source]);

  useEffect(() => {
    if (!rearrangePointer) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== rearrangePointer.pointerId) return;
      setRearrangePointer(prev => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev));

      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const slotEl = el?.closest?.('[data-position-id]') as HTMLElement | null;
      const over = slotEl?.dataset?.positionId ?? null;
      setRearrangeOverId(over);
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== rearrangePointer.pointerId) return;
      const target = rearrangeOverId ?? rearrangePointer.sourceId;
      if (target) {
        onDrop(target); // store logic will auto-swap if occupied
      }
      setRearrangePointer(null);
      setRearrangeOverId(null);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rearrangePointer, rearrangeOverId]);

  const renderSlot = (id: string, opts?: { sizeVariant?: 'normal' | 'compact' }) => {
    const marks = doorAnchorsBySlot.get(id) ?? [];
    const primary = marks[0];
    const besideBarTopClass =
      primary?.kind === 'lower_fwd' || primary?.kind === 'lower_aft'
        ? // Korean/alphabetic: nudge down so the marker + pill sit inside the encapsulating outline.
          (layoutKind === 'alphabetic' ? 'top-[-2px]' : 'top-[-6px]')
        : 'top-[-6px]';
    const besideLabelTopClass =
      primary?.kind === 'lower_fwd' || primary?.kind === 'lower_aft'
        ? (layoutKind === 'alphabetic' ? '-top-7' : '-top-9')
        : '-top-9';
    return (
      <div className="relative w-full">
    <DeckSlot 
      position={getPosition(id)} 
          displayLabel={getDisplayLabel(id)}
      isActive={selection.id === id && selection.source === 'slot'} 
      isDragging={!!drag.item}
          dragItem={drag.item}
          onDragEnd={onDragEnd}
      onClick={() => onSelectPosition(id)} 
      onDragStart={(item) => onDragStart(item, id)} 
      onDrop={onDrop} 
      sizeVariant={opts?.sizeVariant ?? 'normal'}
      onLongPressRearrangeStart={(item, positionId, pointerId, x, y) => {
        // Keep the current "tap slot -> envelope" behavior.
        // Long-press is a separate gesture that starts rearrange mode.
        onSelectPosition(positionId);
        onDragStart(item, positionId);
        setRearrangePointer({ pointerId, x, y, sourceId: positionId });
        setRearrangeOverId(positionId);
      }}
      isRearrangeSource={isRearranging && rearrangePointer?.sourceId === id}
      isRearrangeOver={isRearranging && rearrangeOverId === id}
    />

        {primary?.markerStyle === 'horizontal_under' && (
          <div className={`absolute -bottom-1 left-0 right-0 h-2 ${DOOR.line} rounded z-40`} />
        )}
        {primary?.markerStyle === 'horizontal_beside' && (
          // Lower-deck door markers: place on the TOP edge of the slot (not vertically centered),
          // just outside the right edge, with the same width as the slot.
          <div className={`absolute ${besideBarTopClass} left-[calc(100%+4px)] w-full h-2 ${DOOR.line} rounded z-40`} />
        )}

        {primary && primary.markerStyle === 'horizontal_under' && (
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1">
            <div className={`px-2 py-0.5 ${DOOR.pillBg} text-white text-[8px] font-black rounded whitespace-nowrap flex items-center gap-1 shadow`}>
              <DoorOpen size={10} /> {primary.label}
            </div>
          </div>
        )}
        {primary && primary.markerStyle === 'horizontal_beside' && (
          <div className={`absolute ${besideLabelTopClass} left-[calc(100%+4px)] z-50 w-full flex justify-center`}>
            <div className={`px-2 py-0.5 ${DOOR.pillBg} text-white text-[8px] font-black rounded whitespace-nowrap flex items-center gap-1 shadow`}>
              <DoorOpen size={10} /> {primary.label}
            </div>
          </div>
        )}
      </div>
    );
  };

  const mainDeckArmX = useMemo(() => {
    const insetLeft = 0.08 * FUSELAGE_CANVAS_PX;
    const insetRight = 0.92 * FUSELAGE_CANVAS_PX;
    const min = ruler.range.minIn;
    const max = ruler.range.maxIn;
    const span = max - min || 1;
    const toX = (armIn: number) => {
      const t = clamp01((armIn - min) / span);
      return insetLeft + (insetRight - insetLeft) * t;
    };
    return { toX, insetLeft, insetRight };
  }, [ruler.range.minIn, ruler.range.maxIn]);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 relative shadow-2xl overflow-x-auto">
      {/* In-card warning (anchored to aircraft area for better visibility while loading) */}
      {toast && (
        <div className="absolute left-1/2 top-[64px] -translate-x-1/2 z-[9999] px-3" data-lm-toast>
          <div
            className={`max-w-[720px] px-4 py-3 rounded-xl border shadow-2xl backdrop-blur text-left ${
              toast.tone === 'error'
                ? 'bg-red-950/75 border-red-500/30 text-red-100'
                : 'bg-slate-950/75 border-slate-700 text-slate-100'
            }`}
          >
            <div className="text-[12px] font-black tracking-wide">Action blocked</div>
            <div className="mt-1 text-[12px] font-bold">{toast.message}</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="text-[10px] text-white/60 font-mono">Tap anywhere to dismiss</div>
              <div className="flex items-center gap-2">
                {toast.tone === 'error' && toast.canOverride && (
                  <button
                    type="button"
                    onClick={() => {
                      onOverrideToast();
                      onDismissToast();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-100 text-[11px] font-black uppercase tracking-wider hover:bg-amber-500/30"
                    title="Force place (bypass compatibility checks)"
                  >
                    Override
                  </button>
                )}
                <button
                  type="button"
                  onClick={onDismissToast}
                  className="px-3 py-1.5 rounded-lg bg-slate-950/40 border border-white/10 text-white/80 text-[11px] font-black uppercase tracking-wider hover:bg-slate-950/60"
                  title="Dismiss"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-black italic tracking-tighter text-slate-700 leading-none">
            BOEING 747-400F
          </h2>
          <span className="text-xs font-mono text-slate-500 whitespace-nowrap">
            {flight ? `${flight.registration} • ${flight.flightNumber}` : 'NO FLIGHT SELECTED'}
          </span>
        </div>
        
        {/* Legend + Info */}
        <div className="flex items-center gap-3 text-[10px]">
          <button
            type="button"
            onClick={() => setView(v => (v === 'plan' ? 'profile' : 'plan'))}
            className="flex items-center gap-1 px-2 py-1 rounded border border-slate-800 bg-slate-950/30 text-slate-300 hover:text-white hover:border-slate-700"
            title={view === 'plan' ? 'Flip to side profile' : 'Flip to plan view'}
          >
            <RotateCw size={12} className="text-slate-400" />
            <span className="font-bold">{view === 'plan' ? 'Profile' : 'Plan'}</span>
          </button>
          <div className={`flex items-center gap-1.5 px-2 py-1 ${DOOR.bg} border ${DOOR.border} rounded`}>
            <DoorOpen size={12} className={DOOR.text} />
            <span className={`${DOOR.text} font-bold`}>CARGO DOOR</span>
          </div>
          <div className="text-slate-500">NOSE ← → TAIL</div>
          <button
            type="button"
            onClick={onOpenAirframeInfo}
            className="flex items-center gap-1 px-2 py-1 rounded border border-slate-800 bg-slate-950/30 text-slate-300 hover:text-white hover:border-slate-700"
            title="Airframe / door reference"
          >
            <Info size={12} className="text-slate-400" />
            <span className="font-bold">Info</span>
          </button>
        </div>
      </div>

      {/* Flip container (Plan ↔ Profile) */}
      <div className="relative min-h-[680px] [perspective:1200px]">
        <div
          className={[
            'relative transition-transform duration-700 ease-in-out',
            '[transform-style:preserve-3d]',
            view === 'profile' ? '[transform:rotateY(180deg)]' : '',
          ].join(' ')}
        >
          {/* FRONT: existing plan view */}
          <div className="[backface-visibility:hidden]">
      {/* ============ MAIN DECK ============ */}
            {layoutKind === 'alphabetic' && (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase">Main Deck</h3>
          <span className="text-[10px] text-slate-600">• 33 positions • PMC/P6P pallets</span>
        </div>
        
        <ScaleToFit min={0.75} max={1.6}>
                <div className="relative inline-block" style={{ width: `${FUSELAGE_CANVAS_PX}px` }}>
          
          {/* Nose Door Label */}
          {hasDoor('nose') && (
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1">
              <div
                className={`px-2 py-2 ${DOOR.pillBg} text-white text-[8px] font-black rounded flex flex-col items-center gap-1 shadow`}
              >
                <DoorOpen size={10} />
                <div className="flex flex-col items-center leading-[0.85]">
                  {['N', 'O', 'S', 'E'].map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
              </div>
              {/* Thick vertical door marker */}
              <div className={`h-8 w-2 ${DOOR.line} rounded`}></div>
            </div>
          )}

          {/* Aircraft Outline */}
                <div className="relative bg-slate-800/30 border-2 border-slate-700 rounded-l-[60px] rounded-r-[30px] p-4 pb-8 overflow-visible">
                  {/* Longitudinal ruler: centered (AISLE band) so it doesn't obscure door pills */}
                  <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-0 opacity-60 pointer-events-none">
                    <FuselageRuler
                      widthPx={FUSELAGE_CANVAS_PX}
                      range={ruler.range}
                      insetPct={{ left: 8, right: 8 }}
                      majorTickIn={100}
                      minorTickIn={20}
                      stations={ruler.stations}
                      align="top"
                    />
                  </div>
            {/* Side labels */}
            <div className="flex justify-between text-[8px] text-slate-500 font-bold mb-2">
              <span>NOSE ←</span>
              <span className="text-slate-600">STARBOARD (R) - Top row</span>
              <span>→ TAIL</span>
            </div>
                  {/* Arm-positioned main deck slots (truthful): boxes centered at their arm location */}
                  <div className="relative w-full h-[220px]">
                    {/* AISLE line */}
                    <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2">
                      <div className="flex items-center justify-center">
                        <div className="flex-1 border-t border-dashed border-slate-700/70" />
                        <span className="px-2 text-[7px] text-slate-600 leading-none font-bold">AISLE</span>
                        <div className="flex-1 border-t border-dashed border-slate-700/70" />
                </div>
                </div>
                
                    {(() => {
                      const slotW = 36;
                      const compactW = 30;
                      const labelH = 16;
                      const mk = (id: string, y: number, w: number, opts?: { sizeVariant?: 'normal' | 'compact' }) => {
                        const p = getPosition(id);
                        const arm = Number.isFinite(p.arm) ? Math.round(p.arm) : null;
                        const x = mainDeckArmX.toX(typeof p.arm === 'number' ? p.arm : 0);
                        return (
                          <div
                            key={id}
                            className="absolute -translate-x-1/2"
                            style={{ left: `${x}px`, top: `${y}px`, width: `${w}px` }}
                          >
                            {renderSlot(id, opts)}
                            <div
                              className="mt-[2px] w-full text-center text-[9px] font-black font-mono tabular-nums text-slate-200/90"
                              style={{ height: `${labelH}px` }}
                            >
                              {arm != null ? arm : ''}
                    </div>
                </div>
                        );
                      };

                      const out: React.ReactNode[] = [];
                      // Top row (STARBOARD/R): C..S
                      for (const row of ['C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'P', 'Q', 'R', 'S']) {
                        out.push(mk(`${row}R`, 18, slotW));
                      }
                      // Centerline: A2, B1, A1, T
                      out.push(mk('A2', 86, slotW));
                      out.push(mk('B1', 86, compactW, { sizeVariant: 'compact' }));
                      out.push(mk('A1', 86, slotW));
                      out.push(mk('T', 86, slotW));
                      // Bottom row (PORT/L): C..S
                      for (const row of ['C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'P', 'Q', 'R', 'S']) {
                        out.push(mk(`${row}L`, 152, slotW));
                      }
                      return out;
                    })()}
                </div>
                
                  {/* Bottom side label */}
                  <div className="text-[8px] text-slate-600 font-bold mt-2 text-center">
                    PORT (L) - Bottom row
              </div>
                </div>
                </div>
              </ScaleToFit>
                </div>
            )}

            {layoutKind !== 'alphabetic' && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase">Main Deck</h3>
                  <span className="text-[10px] text-slate-600">• 30 positions • Numeric prototype</span>
                </div>
                
                <ScaleToFit min={0.75} max={1.6}>
                  <div className="relative inline-block" style={{ width: `${FUSELAGE_CANVAS_PX}px` }}>
                    {/* Nose door label */}
                    {hasDoor('nose') && (
                      <div className="absolute -left-10 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1">
                        <div
                          className={`px-2 py-2 ${DOOR.pillBg} text-white text-[8px] font-black rounded flex flex-col items-center gap-1 shadow`}
                        >
                          <DoorOpen size={10} />
                          <div className="flex flex-col items-center leading-[0.85]">
                            {['N', 'O', 'S', 'E'].map((c) => (
                              <span key={c}>{c}</span>
                    ))}
                  </div>
                      </div>
                        <div className={`h-8 w-2 ${DOOR.line} rounded`}></div>
                    </div>
                  )}

                    <div className="relative bg-slate-800/30 border-2 border-slate-700 rounded-l-[60px] rounded-r-[30px] p-4 pb-8 overflow-visible">
                      {/* Longitudinal ruler: centered (AISLE band) so it doesn't obscure door pills */}
                      <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-0 opacity-60 pointer-events-none">
                        <FuselageRuler
                          widthPx={FUSELAGE_CANVAS_PX}
                          range={ruler.range}
                          insetPct={{ left: 8, right: 8 }}
                          majorTickIn={100}
                          minorTickIn={20}
                          stations={ruler.stations}
                          align="top"
                        />
                          </div>
                      <div className="flex justify-between text-[8px] text-slate-500 font-bold mb-2">
                        <span>NOSE ←</span>
                        <span className="text-slate-600">B = Top row • A = Bottom row</span>
                        <span>→ TAIL</span>
                        </div>

                      {/* Arm-positioned numeric main deck slots (truthful) */}
                      <div className="relative w-full h-[220px]">
                        {/* AISLE line */}
                        <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2">
                          <div className="flex items-center justify-center">
                            <div className="flex-1 border-t border-dashed border-slate-700/70" />
                            <span className="px-2 text-[7px] text-slate-600 leading-none font-bold">AISLE</span>
                            <div className="flex-1 border-t border-dashed border-slate-700/70" />
                    </div>
                </div>

                        {(() => {
                          const slotW = 36;
                          const labelH = 16;
                          const mk = (id: string, y: number) => {
                            const p = getPosition(id);
                            const arm = Number.isFinite(p.arm) ? Math.round(p.arm) : null;
                            const x = mainDeckArmX.toX(typeof p.arm === 'number' ? p.arm : 0);
                            return (
                              <div key={id} className="absolute -translate-x-1/2" style={{ left: `${x}px`, top: `${y}px`, width: `${slotW}px` }}>
                                {renderSlot(id)}
                                <div className="mt-[2px] w-full text-center text-[9px] font-black font-mono tabular-nums text-slate-200/90" style={{ height: `${labelH}px` }}>
                                  {arm != null ? arm : ''}
              </div>
            </div>
                            );
                          };

                          const out: React.ReactNode[] = [];
                          // Row B (top)
                          for (const n of numericMainPairs) out.push(mk(`${n}B`, 18));
                          // Centerline (1,2,3,20)
                          for (const id of ['1', '2', '3', '20']) out.push(mk(id, 86));
                          // Row A (bottom)
                          for (const n of numericMainPairs) out.push(mk(`${n}A`, 152));
                          return out;
                        })()}
            </div>

                      {/* Note: door is anchored on 8A for numeric layout (see above). */}
          </div>
          </div>
        </ScaleToFit>
      </div>
            )}

      {/* Rearrange drag "ghost" (iPad long-press) */}
      {isRearranging && drag.item && rearrangePointer && typeof document !== 'undefined'
        ? createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: rearrangePointer.x,
            top: rearrangePointer.y,
                // Align the ghost directly under the pointer.
                transform: 'translate(-50%, -50%)',
              }}
            >
              {(() => {
                const visual = getCargoVisual(drag.item, cargoColorMode);
                const badges = getHandlingBadges(drag.item).slice(0, 3);
                return (
                  <div
                    className={`
                      relative w-24 rounded-lg border shadow-2xl overflow-hidden opacity-90
                      bg-gradient-to-b from-slate-800 to-slate-900
                      border-violet-300/70 ring-2 ring-violet-500/25
                    `}
                  >
                    {/* Left strip */}
                    <div className={`absolute left-0 top-0 bottom-0 w-4 ${visual.bg} border-r border-white/10`} />

                    <div className="pl-5 pr-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base leading-none">{drag.item.dest.flag}</span>
              <div className="min-w-0">
                          <div className="text-[10px] font-black tracking-widest text-white leading-none">
                            {drag.item.dest.code}
                </div>
                </div>
              </div>

                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="font-mono font-black text-white text-[12px] leading-none tabular-nums">
                          {(drag.item.weight / 1000).toFixed(1)}
                        </span>
                        <span className="text-[9px] text-slate-300 font-bold">t</span>
            </div>

                      {badges.length > 0 && (
                        <div className="mt-1 flex items-center gap-1">
                          {badges.map((b) => (
                            <span
                              key={b}
                              className="px-1 py-0.5 rounded bg-slate-950/60 border border-white/10 text-[8px] font-black text-white leading-none"
                            >
                              {b}
                            </span>
                          ))}
        </div>
      )}
                    </div>
                  </div>
                );
              })()}
            </div>,
            document.body
          )
        : null}

      {/* ============ LOWER DECK ============ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase">Lower Deck (Belly)</h3>
          <span className="text-[10px] text-slate-600">
            {layoutKind === 'alphabetic'
              ? '• 11 positions • LD3/LD1 containers'
              : layoutKind === 'numeric'
                ? '• 30 positions • Numeric prototype'
                : '• 9 positions • UPS prototype (P1–P9)'}
          </span>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="w-full">
            <ScaleToFit min={0.75} max={2.0}>
              <div className="relative inline-block" style={{ width: `${FUSELAGE_CANVAS_PX}px` }}>

            {/* Aircraft Outline */}
            <div className="bg-slate-800/30 border-2 border-slate-700 rounded-l-[40px] rounded-r-[20px] p-3 pb-6">
              <div className="flex items-stretch gap-3 w-full">
                {layoutKind === 'alphabetic' && (
                  <>
              {/* Forward Hold - door on starboard */}
                    <div className="relative flex flex-col min-w-0" style={{ flex: `${LOWER_SEG_UNITS.fwd} 1 0%` }}>
                <span className="text-[8px] text-slate-500 mb-1">FWD HOLD</span>
                      {(() => {
                        const row1 = ['11P', '12P'];
                        const row2 = ['21P', '22P', '23P'];
                        return (
                          <>
                            <div
                              className={`grid gap-0.5 p-1 w-full ${DOOR.bg} border ${DOOR.border} rounded`}
                              style={{ gridTemplateColumns: `repeat(${row1.length}, minmax(0, 1fr))` }}
                            >
                              {row1.map((id) => (
                                <div key={id} className="min-w-0">
                      {renderSlot(id)}
                    </div>
                  ))}
                </div>
                            <div
                              className={`grid gap-0.5 p-1 w-full ${DOOR.bg} border ${DOOR.border} rounded mt-0.5`}
                              style={{ gridTemplateColumns: `repeat(${row2.length}, minmax(0, 1fr))` }}
                            >
                              {row2.map((id) => (
                                <div key={id} className="min-w-0">
                      {renderSlot(id)}
                    </div>
                  ))}
                </div>
                          </>
                        );
                      })()}
              </div>

              {/* Wing Box - no cargo */}
                    <div
                      className="h-16 border border-slate-600 bg-slate-900/50 rounded flex items-center justify-center min-w-0"
                      style={{ flex: `${LOWER_SEG_UNITS.wing} 1 0%` }}
                    >
                <span className="text-[8px] text-slate-600 font-bold text-center">WING<br/>BOX</span>
              </div>

              {/* Aft Hold - door on starboard */}
                    <div className="relative flex flex-col min-w-0" style={{ flex: `${LOWER_SEG_UNITS.aft} 1 0%` }}>
                <span className="text-[8px] text-slate-500 mb-1">AFT HOLD</span>
                      {(() => {
                        const row1 = ['31P', '32P'];
                        const row2 = ['41P', '42P'];
                        return (
                          <>
                            <div
                              className={`grid gap-0.5 p-1 w-full ${DOOR.bg} border ${DOOR.border} rounded`}
                              style={{ gridTemplateColumns: `repeat(${row1.length}, minmax(0, 1fr))` }}
                            >
                              {row1.map((id) => (
                                <div key={id} className="min-w-0">
                      {renderSlot(id)}
                    </div>
                  ))}
                </div>
                            <div
                              className={`grid gap-0.5 p-1 w-full ${DOOR.bg} border ${DOOR.border} rounded mt-0.5`}
                              style={{ gridTemplateColumns: `repeat(${row2.length}, minmax(0, 1fr))` }}
                            >
                              {row2.map((id) => (
                                <div key={id} className="min-w-0">
                      {renderSlot(id)}
                    </div>
                  ))}
                </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Bulk Cargo */}
                    <div className="relative flex flex-col min-w-0" style={{ flex: `${LOWER_SEG_UNITS.bulk} 1 0%` }}>
                      <span className="text-[8px] text-slate-500 mb-1">BULK</span>
                      {(() => {
                        const row = ['52', '53'];
                        return (
                          <div
                            className={`grid gap-0.5 p-1 w-full ${DOOR.bg} border ${DOOR.border} rounded`}
                            style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
                          >
                            {row.map((id) => (
                              <div key={id} className="min-w-0 relative">
                                {renderSlot(id)}
                  </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}

                {layoutKind === 'numeric' && (
                  <>
                    <div className="relative flex flex-col min-w-0" style={{ flex: `${LOWER_SEG_UNITS.fwd} 1 0%` }}>
                      <span className="text-[8px] text-slate-500 mb-1">FWD HOLD</span>
                      <div
                        className={`grid gap-0.5 p-1 w-full ${DOOR.bg} border ${DOOR.border} rounded`}
                        style={{ gridTemplateColumns: `repeat(${numericLowerFwd.length}, minmax(0, 1fr))` }}
                      >
                        {numericLowerFwd.map((bay) => (
                          <div key={`fwd-r-${bay}`} className="min-w-0">
                            {renderSlot(`${bay}R`)}
                          </div>
                        ))}
                      </div>
                      <div
                        className={`grid gap-0.5 p-1 w-full ${DOOR.bg} border ${DOOR.border} rounded mt-0.5`}
                        style={{ gridTemplateColumns: `repeat(${numericLowerFwd.length}, minmax(0, 1fr))` }}
                      >
                        {numericLowerFwd.map((bay) => (
                          <div key={`fwd-l-${bay}`} className="min-w-0">
                            {renderSlot(`${bay}L`)}
                          </div>
                        ))}
                      </div>
              </div>

                    <div
                      className="h-16 border border-slate-600 bg-slate-900/50 rounded flex items-center justify-center min-w-0"
                      style={{ flex: `${LOWER_SEG_UNITS.wing} 1 0%` }}
                    >
                      <span className="text-[8px] text-slate-600 font-bold text-center">WING<br/>BOX</span>
                    </div>

                    <div className="relative flex flex-col min-w-0" style={{ flex: `${LOWER_SEG_UNITS.aft} 1 0%` }}>
                      <span className="text-[8px] text-slate-500 mb-1">AFT HOLD</span>
                      <div
                        className={`grid gap-0.5 p-1 w-full ${DOOR.bg} border ${DOOR.border} rounded`}
                        style={{ gridTemplateColumns: `repeat(${numericLowerAft.length}, minmax(0, 1fr))` }}
                      >
                        {numericLowerAft.map((bay) => (
                          <div key={`aft-r-${bay}`} className="min-w-0">
                            {renderSlot(`${bay}R`)}
                          </div>
                        ))}
                      </div>
                      <div
                        className={`grid gap-0.5 p-1 w-full ${DOOR.bg} border ${DOOR.border} rounded mt-0.5`}
                        style={{ gridTemplateColumns: `repeat(${numericLowerAft.length}, minmax(0, 1fr))` }}
                      >
                        {numericLowerAft.map((bay) => (
                          <div key={`aft-l-${bay}`} className="min-w-0">
                            {renderSlot(`${bay}L`)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bulk compartment (no numbered ULD positions for numeric prototype) */}
                    <div className="relative flex flex-col min-w-0" style={{ flex: `${LOWER_SEG_UNITS.bulk} 1 0%` }}>
                <span className="text-[8px] text-slate-500 mb-1">BULK</span>
                      <div className={`w-full h-full min-h-[56px] ${DOOR.bg} border ${DOOR.border} rounded`} />
                    </div>
                  </>
                )}

                {layoutKind === 'ups' && (
                  <>
                    <div className="relative flex flex-col min-w-0" style={{ flex: `${LOWER_SEG_UNITS.fwd} 1 0%` }}>
                      <span className="text-[8px] text-slate-500 mb-1">FWD HOLD</span>
                      {(() => {
                        const row = [1, 2, 3, 4, 5].map((n) => `P${n}`);
                        return (
                          <div
                            className={`grid gap-0.5 p-1 w-full ${DOOR.bg} border ${DOOR.border} rounded`}
                            style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
                          >
                            {row.map((id) => (
                              <div key={id} className="min-w-0">
                      {renderSlot(id)}
                    </div>
                  ))}
                </div>
                        );
                      })()}
                    </div>

                    <div
                      className="h-16 border border-slate-600 bg-slate-900/50 rounded flex items-center justify-center min-w-0"
                      style={{ flex: `${LOWER_SEG_UNITS.wing} 1 0%` }}
                    >
                      <span className="text-[8px] text-slate-600 font-bold text-center">WING<br/>BOX</span>
                  </div>

                    <div className="relative flex flex-col min-w-0" style={{ flex: `${LOWER_SEG_UNITS.aft} 1 0%` }}>
                      <span className="text-[8px] text-slate-500 mb-1">AFT HOLD</span>
                      {(() => {
                        const row = [6, 7, 8, 9].map((n) => `P${n}`);
                        return (
                          <div
                            className={`grid gap-0.5 p-1 w-full ${DOOR.bg} border ${DOOR.border} rounded`}
                            style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
                          >
                            {row.map((id) => (
                              <div key={id} className="min-w-0">
                                {renderSlot(id)}
              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Bulk compartment placeholder (UPS template: no bulk label/door markers) */}
                    <div className="relative flex flex-col min-w-0" style={{ flex: `${LOWER_SEG_UNITS.bulk} 1 0%` }}>
                      <span className="text-[8px] text-transparent mb-1">.</span>
                      <div className={`w-full h-full min-h-[56px] bg-slate-900/20 border border-slate-700/40 rounded`} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Optimization mode buttons (separate dark panel under lower deck) */}
            <div className="mt-5 bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 shadow-inner">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  AI Auto-Load
                </div>
                {aiStatus && (
                  <div className="text-[10px] text-slate-400 font-mono">
                    {aiStatus.phase === 'repacking'
                      ? `Repacking ${aiStatus.attempt}/${aiStatus.maxAttempts}…`
                      : aiStatus.phase === 'placing'
                        ? `Placing (attempt ${aiStatus.attempt}/${aiStatus.maxAttempts})…`
                        : aiStatus.phase === 'thinking'
                          ? 'Thinking…'
                          : aiStatus.phase === 'failed'
                            ? 'Failed'
                            : 'Cancelled'}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ModePill
                    label="SAFETY"
                    active={optimizationMode === 'safety'}
                    disabled={!!aiStatus}
                    onClick={() => onSelectOptimizationMode('safety')}
                  />
                  <ModePill
                    label="FUEL EFF"
                    active={optimizationMode === 'fuel_efficiency'}
                    disabled={!!aiStatus}
                    onClick={() => onSelectOptimizationMode('fuel_efficiency')}
                  />
                  <ModePill
                    label="UNLOAD"
                    active={optimizationMode === 'unload_efficiency'}
                    disabled={!!aiStatus}
                    onClick={() => onSelectOptimizationMode('unload_efficiency')}
                  />
                </div>
                <button
                  type="button"
                  onClick={onClearAll}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/40 text-slate-200 text-[10px] font-bold uppercase tracking-wider hover:bg-red-900/20 hover:text-red-200"
                >
                  Clear
                </button>
              </div>
            </div>
              </div>
            </ScaleToFit>
          </div>
        </div>
      </div>
          </div>

          {/* BACK: side profile */}
          <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <div className="bg-slate-900">
              <ScaleToFit min={0.75} max={1.6}>
                <div className="relative inline-block" style={{ width: `${FUSELAGE_CANVAS_PX}px` }}>
                  <AircraftProfile
                    widthPx={FUSELAGE_CANVAS_PX}
                    rulerRange={ruler.range}
                    rulerStations={ruler.stations}
                    positions={positions}
                    selection={selection}
                    onSelectPosition={onSelectPosition}
                  />
                </div>
              </ScaleToFit>
            </div>
          </div>
        </div>
      </div>
      
      {/* Compact L/R balance summary (small screens) */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* L/R */}
            <div className="p-3 bg-slate-800/30 rounded border border-slate-700 text-[10px] text-slate-400">
              <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-2">
                Main Deck L/R Balance
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-slate-500">Δ(L−R)</div>
                <div className={`px-2 py-1 rounded-lg border text-[11px] font-bold whitespace-nowrap tabular-nums ${
                  !lateralCheckEnabled
                    ? 'bg-slate-800/40 text-slate-200 border-slate-700'
                    : (mainDeckLateralDeltaKg <= mainDeckLateralLimitKg
                        ? 'bg-slate-800/40 text-slate-200 border-slate-700'
                        : 'bg-amber-500/15 text-amber-200 border-amber-500/30')
                }`}>
                  {(mainDeckLateralDeltaKg / 1000).toFixed(1)}t
                </div>
              </div>
              {lateralCheckEnabled && (
                <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                  <div className="text-slate-500">
                    Limit: {(mainDeckLateralLimitKg / 1000).toFixed(1)}t
                  </div>
                  {mainDeckLateralDeltaKg > mainDeckLateralLimitKg && (
                    <div className="text-amber-300 font-bold whitespace-nowrap">
                      Caution
                    </div>
                  )}
                </div>
              )}
              <div className="mt-2 text-[9px] text-slate-500">
                L/R modeled on MAIN deck only (LOWER treated as centerline).
              </div>
            </div>

            {/* Dispatch + actions */}
            <div className={`p-3 rounded border text-[10px] ${
              physics.isOverweight || physics.isUnbalanced
                ? 'bg-red-900/20 border-red-900/50 text-red-300'
                : 'bg-emerald-900/20 border-emerald-900/50 text-emerald-300'
            }`}>
              <div className="font-bold text-[12px] uppercase tracking-wider">
                {physics.isOverweight || physics.isUnbalanced ? 'Restricted' : 'Ready for Dispatch'}
              </div>
              <div className="mt-1 text-[10px] opacity-80">
                ZFW: {(physics.zfw / 1000).toFixed(1)}t
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={onOpenNotoc}
                  className="flex-1 bg-slate-900/40 border border-slate-700 text-slate-200 py-2 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-slate-900/60"
                >
                  NOTOC
                </button>
                <button
                  type="button"
                  onClick={onOpenFinalize}
                  disabled={physics.isOverweight || physics.isUnbalanced}
                  className="flex-1 bg-emerald-600 disabled:opacity-50 text-white py-2 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500"
                >
                  Finalize
                </button>
              </div>

              <button
                type="button"
                onClick={onOpenProofPack}
                className="mt-2 w-full bg-slate-900/40 border border-slate-700 text-slate-200 py-2 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-slate-900/60"
              >
                Proof / Audit Pack (PDF)
              </button>

              <button
                type="button"
                onClick={onOpenCaptainBrief}
                className="mt-2 w-full bg-slate-900/20 border border-slate-800 text-slate-300 py-2 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-slate-900/40"
              >
                Captain Brief
              </button>
            </div>
          </div>
        </div>
  );
};

const ScaleToFit: React.FC<{ children: React.ReactNode; min?: number; max?: number }> = ({ children, min = 0.75, max = 1.5 }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [heightPx, setHeightPx] = useState<number | null>(null);
  const last = useRef<{ scale: number; height: number | null }>({ scale: 1, height: null });
  const lastHostW = useRef<number>(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const content = contentRef.current;
    if (!host || !content) return;

    const clamp = (v: number) => Math.max(min, Math.min(max, v));
    const recompute = () => {
      if (!hostRef.current || !contentRef.current) return;
      const hostW = hostRef.current.clientWidth;
      lastHostW.current = hostW;
      // Use offsetWidth/Height (unaffected by CSS transforms) to avoid resize-feedback loops.
      const contentW = contentRef.current.offsetWidth;
      const contentH = contentRef.current.offsetHeight;
      if (!hostW || !contentW || !contentH) return;

      const nextScale = clamp(hostW / contentW);
      const nextHeight = Math.round(contentH * nextScale);

      // Avoid setting state unless it materially changed.
      const sPrev = last.current.scale;
      const hPrev = last.current.height;
      const sChanged = Math.abs(nextScale - sPrev) > 0.001;
      const hChanged = hPrev == null || Math.abs(nextHeight - hPrev) > 0.5;
      if (!sChanged && !hChanged) return;

      last.current = { scale: nextScale, height: nextHeight };
      setScale(nextScale);
      setHeightPx(nextHeight);
    };

    const schedule = () => {
      if (raf.current != null) return;
      raf.current = window.requestAnimationFrame(() => {
        raf.current = null;
        recompute();
      });
    };

    schedule();
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0;
      // Ignore height-only changes (our own heightPx updates can trigger those).
      if (Math.abs(w - lastHostW.current) < 1) return;
      schedule();
    });
    ro.observe(host);
    // IMPORTANT: do NOT observe the scaled content element (can create feedback loops).

    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      window.removeEventListener('resize', schedule as any);
      ro.disconnect();
      if (raf.current != null) {
        window.cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };
  }, [min, max]);

  return (
    // Important: allow overflow so door labels (which use negative offsets) aren't clipped.
    <div ref={hostRef} className="w-full overflow-visible">
      <div style={heightPx != null ? { height: `${heightPx}px` } : undefined}>
        <div ref={contentRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const ModePill: React.FC<{
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}> = ({ label, active, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-colors ${
      active
        ? 'bg-blue-600 text-white border-blue-500'
        : 'bg-slate-900/40 text-slate-300 border-slate-700 hover:bg-slate-900/60'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {label}
  </button>
);

