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

import React, { useEffect, useMemo, useState } from 'react';
import { DoorOpen } from 'lucide-react';
import type { LoadedPosition, CargoItem, DragState, SelectionState, PhysicsResult } from '@core/types';
import { DeckSlot } from './DeckSlot';

// Door styling: use a single dedicated color that does NOT collide with cargo/material type colors.
// (Avoid blue/cyan/amber/red/green which are already used elsewhere.)
const DOOR = {
  bg: 'bg-violet-500/10',
  border: 'border-violet-500/30',
  text: 'text-violet-300',
  pillBg: 'bg-violet-500',
  line: 'bg-violet-500',
};

interface AircraftDiagramProps {
  positions: LoadedPosition[];
  selection: SelectionState;
  drag: DragState;
  flight: { registration: string; flightNumber: string } | null;
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
  onSelectPosition: (id: string) => void;
  onDragStart: (item: CargoItem, positionId: string) => void;
  onDrop: (positionId: string) => void;
}

export const AircraftDiagram: React.FC<AircraftDiagramProps> = ({
  positions,
  selection,
  drag,
  flight,
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
  onSelectPosition,
  onDragStart,
  onDrop,
}) => {
  const getPosition = (id: string) => positions.find(p => p.id === id)!;

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

  const renderSlot = (id: string, opts?: { sizeVariant?: 'normal' | 'compact' }) => (
    <DeckSlot 
      position={getPosition(id)} 
      isActive={selection.id === id && selection.source === 'slot'} 
      isDragging={!!drag.item}
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
  );

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 relative shadow-2xl overflow-x-auto">
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
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px]">
          <div className={`flex items-center gap-1.5 px-2 py-1 ${DOOR.bg} border ${DOOR.border} rounded`}>
            <DoorOpen size={12} className={DOOR.text} />
            <span className={`${DOOR.text} font-bold`}>CARGO DOOR</span>
          </div>
          <div className="text-slate-500">NOSE ← → TAIL</div>
        </div>
      </div>

      {/* ============ MAIN DECK ============ */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase">Main Deck</h3>
          <span className="text-[10px] text-slate-600">• 33 positions • PMC/P6P pallets</span>
        </div>
        
        <div className="relative inline-block">
          
          {/* Nose Door Label */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
            <div className={`px-2 py-0.5 ${DOOR.pillBg} text-white text-[8px] font-bold rounded whitespace-nowrap flex items-center gap-1`}>
              <DoorOpen size={10} /> NOSE
            </div>
            <div className={`w-3 h-0.5 ${DOOR.line}`}></div>
          </div>

          {/* Aircraft Outline */}
          <div className="bg-slate-800/30 border-2 border-slate-700 rounded-l-[60px] rounded-r-[30px] p-4 pb-8">
            {/* Side labels */}
            <div className="flex justify-between text-[8px] text-slate-500 font-bold mb-2">
              <span>NOSE ←</span>
              <span className="text-slate-600">STARBOARD (R) - Top row</span>
              <span>→ TAIL</span>
            </div>
            
            {/* Main Deck Layout - Two rows with nose section inline */}
            <div className="flex flex-col gap-0.5">
              {/* RIGHT (Starboard) Row - Top */}
              <div className="flex items-center gap-0.5">
                {/* Nose - A2 on starboard */}
                <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded`}>
                  <div className="w-9">{renderSlot('A2')}</div>
                </div>
                
                {/* Forward section C-F */}
                <div className="flex gap-0.5 p-1 bg-slate-800/50 rounded ml-1">
                  {['C', 'D', 'E', 'F'].map(row => (
                    <div key={row} className="w-9 relative">
                      {renderSlot(`${row}R`)}
                      <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[7px] text-slate-600">{row}</span>
                    </div>
                  ))}
                </div>
                
                {/* G-K section - NOT highlighted on starboard */}
                <div className="flex gap-0.5 p-1 bg-slate-800/50 rounded mx-1">
                  {['G', 'H', 'J', 'K'].map(row => (
                    <div key={row} className="w-9 relative">
                      {renderSlot(`${row}R`)}
                      <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[7px] text-slate-600">{row}</span>
                    </div>
                  ))}
                </div>
                
                {/* Aft section L-S */}
                <div className="flex gap-0.5 p-1 bg-slate-800/50 rounded">
                  {['L', 'M', 'P', 'Q', 'R', 'S'].map(row => (
                    <div key={row} className="w-9 relative">
                      {renderSlot(`${row}R`)}
                      <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[7px] text-slate-600">{row}</span>
                    </div>
                  ))}
                </div>
                
                {/* Tail spacer */}
                <div className="w-9 opacity-0 ml-1"></div>
              </div>
              
              {/* Center aisle with B1 position */}
              <div className="flex items-center">
                {/* B1 in the nose area (centered between rows) */}
                <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded`}>
                  <div className="w-9">{renderSlot('B1', { sizeVariant: 'compact' })}</div>
                </div>
                
                {/* Aisle indicator */}
                <div className="flex-1 flex items-center justify-center ml-1 h-4">
                  <div className="flex-1 border-t border-dashed border-slate-700"></div>
                  <span className="px-2 text-[7px] text-slate-600 leading-none">AISLE</span>
                  <div className="flex-1 border-t border-dashed border-slate-700"></div>
                </div>
              </div>
              
              {/* LEFT (Port) Row - Bottom */}
              <div className="flex items-center gap-0.5">
                {/* Nose - A1 on port */}
                <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded`}>
                  <div className="w-9">{renderSlot('A1')}</div>
                </div>
                
                {/* Forward section C-F */}
                <div className="flex gap-0.5 p-1 bg-slate-800/50 rounded ml-1">
                  {['C', 'D', 'E', 'F'].map(row => (
                    <div key={row} className="w-9">
                      {renderSlot(`${row}L`)}
                    </div>
                  ))}
                </div>
                
                {/* Door zone G-K - highlighted on PORT side + anchored door label */}
                <div className="relative mx-1">
                  <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded`}>
                    {['G', 'H', 'J', 'K'].map(row => (
                      <div key={row} className="w-9">
                        {renderSlot(`${row}L`)}
                      </div>
                    ))}
                  </div>
                  <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1">
                    <div className={`w-0.5 h-4 ${DOOR.line}`}></div>
                    <div className={`px-2 py-0.5 ${DOOR.pillBg} text-white text-[8px] font-bold rounded whitespace-nowrap flex items-center gap-1`}>
                      <DoorOpen size={10} /> SIDE CARGO DOOR (L)
                    </div>
                  </div>
                </div>
                
                {/* Aft section L-S */}
                <div className="flex gap-0.5 p-1 bg-slate-800/50 rounded">
                  {['L', 'M', 'P', 'Q', 'R', 'S'].map(row => (
                    <div key={row} className="w-9">
                      {renderSlot(`${row}L`)}
                    </div>
                  ))}
                </div>
                
                {/* Tail */}
                <div className="flex gap-0.5 p-1 bg-slate-800/50 rounded ml-1">
                  <div className="w-9">{renderSlot('T')}</div>
                </div>
              </div>
            </div>
            
            {/* Bottom side label */}
            <div className="text-[8px] text-slate-600 font-bold mt-2 text-center">
              PORT (L) - Bottom row
            </div>
          </div>
        </div>
      </div>

      {/* Rearrange drag "ghost" (iPad long-press) */}
      {isRearranging && drag.item && rearrangePointer && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: rearrangePointer.x,
            top: rearrangePointer.y,
            transform: 'translate(-50%, -70%)',
          }}
        >
          <div className="px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-700 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{drag.item.dest.flag}</span>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-white tracking-wider">
                  {drag.item.dest.code} • {(drag.item.weight / 1000).toFixed(1)}t
                </div>
                <div className="text-[9px] text-slate-400 font-mono truncate max-w-[200px]">
                  Hold & drag to swap
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ LOWER DECK ============ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase">Lower Deck (Belly)</h3>
          <span className="text-[10px] text-slate-600">• 11 positions • LD3/LD1 containers</span>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="relative inline-block">

            {/* Aircraft Outline */}
            <div className="bg-slate-800/30 border-2 border-slate-700 rounded-l-[40px] rounded-r-[20px] p-3 pb-6">
              <div className="flex items-center gap-3">
              {/* Forward Hold - door on starboard */}
              <div className="relative flex flex-col">
                <span className="text-[8px] text-slate-500 mb-1">FWD HOLD</span>
                <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded`}>
                  {['11P', '12P'].map(id => (
                    <div key={id} className="w-9">
                      {renderSlot(id)}
                    </div>
                  ))}
                </div>
                <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded mt-0.5`}>
                  {['21P', '22P', '23P'].map(id => (
                    <div key={id} className="w-9">
                      {renderSlot(id)}
                    </div>
                  ))}
                </div>
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1">
                  <div className={`w-0.5 h-4 ${DOOR.line}`}></div>
                  <div className={`px-2 py-0.5 ${DOOR.pillBg} text-white text-[8px] font-bold rounded whitespace-nowrap flex items-center gap-1`}>
                    <DoorOpen size={10} /> FWD CARGO DOOR (R)
                  </div>
                </div>
              </div>

              {/* Wing Box - no cargo */}
              <div className="w-20 h-16 border border-slate-600 bg-slate-900/50 rounded flex items-center justify-center">
                <span className="text-[8px] text-slate-600 font-bold text-center">WING<br/>BOX</span>
              </div>

              {/* Aft Hold - door on starboard */}
              <div className="relative flex flex-col">
                <span className="text-[8px] text-slate-500 mb-1">AFT HOLD</span>
                <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded`}>
                  {['31P', '32P'].map(id => (
                    <div key={id} className="w-9">
                      {renderSlot(id)}
                    </div>
                  ))}
                </div>
                <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded mt-0.5`}>
                  {['41P', '42P'].map(id => (
                    <div key={id} className="w-9">
                      {renderSlot(id)}
                    </div>
                  ))}
                </div>
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1">
                  <div className={`w-0.5 h-4 ${DOOR.line}`}></div>
                  <div className={`px-2 py-0.5 ${DOOR.pillBg} text-white text-[8px] font-bold rounded whitespace-nowrap flex items-center gap-1`}>
                    <DoorOpen size={10} /> AFT CARGO DOOR (R)
                  </div>
                </div>
              </div>

              {/* Bulk Cargo */}
              <div className="relative flex flex-col">
                <span className="text-[8px] text-slate-500 mb-1">BULK</span>
                <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded`}>
                  {['52', '53'].map(id => (
                    <div key={id} className="w-8">
                      {renderSlot(id)}
                    </div>
                  ))}
                </div>
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1">
                  <div className={`w-0.5 h-4 ${DOOR.line}`}></div>
                  <div className={`px-2 py-0.5 ${DOOR.pillBg} text-white text-[8px] font-bold rounded whitespace-nowrap flex items-center gap-1`}>
                    <DoorOpen size={10} /> BULK (R)
                  </div>
                </div>
              </div>
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

          {/* Right-side corner stack (L/R + Dispatch/Actions) */}
          <div className="hidden sm:flex min-w-[240px] max-w-[280px] flex-col gap-3">
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
                onClick={onOpenCaptainBrief}
                className="mt-2 w-full bg-slate-900/40 border border-slate-700 text-slate-200 py-2 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-slate-900/60"
              >
                W&amp;B PDF
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Compact L/R balance summary (small screens) */}
      <div className="mt-3 sm:hidden p-2 bg-slate-800/30 rounded border border-slate-700 text-[9px] text-slate-500">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-slate-300 uppercase tracking-wider">Δ(L−R)</span>
          <span className="font-mono tabular-nums text-slate-200">{(mainDeckLateralDeltaKg / 1000).toFixed(1)}t</span>
        </div>
        {lateralCheckEnabled && (
          <div className="mt-1 flex items-center justify-between gap-2">
            <span>Limit {(mainDeckLateralLimitKg / 1000).toFixed(1)}t</span>
            {mainDeckLateralDeltaKg > mainDeckLateralLimitKg && <span className="text-amber-300 font-bold">Caution</span>}
          </div>
        )}
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
