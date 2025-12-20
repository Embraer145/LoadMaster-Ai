/**
 * SimplePlanView
 * 
 * Simplified plan view (top-down) of aircraft for loadsheet display.
 * Shows main deck layout with positions placed by arm.
 */

import React, { useMemo } from 'react';
import type { AircraftConfig, LoadedPosition } from '@core/types';
import { useSettingsStore } from '@core/settings';
import { getCargoVisual, getHandlingBadges } from '@/ui/utils/cargoVisual';

const FUSELAGE_CANVAS_PX = 900;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

interface SimplePlanViewProps {
  aircraftConfig: AircraftConfig;
  positions: LoadedPosition[];
  widthPx?: number;
}

export const SimplePlanView: React.FC<SimplePlanViewProps> = ({
  aircraftConfig: _aircraftConfig,
  positions,
  widthPx = FUSELAGE_CANVAS_PX,
}) => {
  const cargoColorMode = useSettingsStore((s) => s.settings.display.cargoColorMode);

  // Calculate arm range
  const armRange = useMemo(() => {
    const arms = positions.map(p => p.arm).filter(a => typeof a === 'number' && Number.isFinite(a));
    const min = arms.length ? Math.min(...arms) : 0;
    const max = arms.length ? Math.max(...arms) : min + 1;
    return { min, max: max === min ? min + 1 : max };
  }, [positions]);

  const mainDeckArmX = useMemo(() => {
    const insetLeft = 0.08 * widthPx;
    const insetRight = 0.92 * widthPx;
    const min = armRange.min;
    const max = armRange.max;
    const span = max - min || 1;
    const toX = (armIn: number) => {
      const t = clamp01((armIn - min) / span);
      return insetLeft + (insetRight - insetLeft) * t;
    };
    return { toX, insetLeft, insetRight };
  }, [armRange, widthPx]);

  const mainDeckPositions = useMemo(
    () => positions.filter(p => p.deck === 'MAIN'),
    [positions]
  );

  const lowerDeckPositions = useMemo(
    () => positions.filter(p => p.deck === 'LOWER'),
    [positions]
  );

  // Group lower deck positions by compartment
  const lowerDeckGroups = useMemo(() => {
    const fwd: LoadedPosition[] = [];
    const aft: LoadedPosition[] = [];
    const bulk: LoadedPosition[] = [];

    lowerDeckPositions.forEach(p => {
      if (p.type === 'bulk') {
        bulk.push(p);
      } else if (p.group === 'AFT') {
        aft.push(p);
      } else {
        fwd.push(p);
      }
    });

    // Sort by ID
    fwd.sort((a, b) => a.id.localeCompare(b.id));
    aft.sort((a, b) => a.id.localeCompare(b.id));
    bulk.sort((a, b) => a.id.localeCompare(b.id));

    return { fwd, aft, bulk };
  }, [lowerDeckPositions]);

  const renderSlot = (p: LoadedPosition, compact?: boolean) => {
    if (!p.content) return null;
    
    const item = p.content;
    const visual = getCargoVisual(item, cargoColorMode);
    const baseClass = visual.bg ?? 'bg-slate-700/60';
    const badges = cargoColorMode === 'uld' ? getHandlingBadges(item) : [];

    return (
      <div
        key={p.id}
        className={`${baseClass} rounded border border-white/20 shadow-sm p-1 flex flex-col items-center justify-center relative min-w-0`}
        title={`${p.id} • ${item.dest.code} • ${(item.weight / 1000).toFixed(1)}t`}
        style={{ minHeight: compact ? '50px' : '56px' }}
      >
        {badges.length > 0 && (
          <div className="absolute top-0.5 left-0.5 flex gap-0.5">
            {badges.slice(0, 2).map((b) => (
              <span
                key={b}
                className="px-1 py-[1px] rounded bg-slate-950/60 border border-white/10 text-[7px] font-black text-white leading-none"
              >
                {b}
              </span>
            ))}
          </div>
        )}
        <div className="text-[9px] font-bold text-white/90 leading-none">{p.id}</div>
        <div className="text-[8px] font-mono text-white/80 leading-none mt-0.5">
          {item.dest.code}
        </div>
        <div className="text-[8px] font-bold text-white/90 leading-none mt-0.5">
          {(item.weight / 1000).toFixed(1)}t
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Deck Plan View */}
      <div>
        <div className="text-sm font-bold text-slate-700 mb-2">Main Deck (Plan View)</div>
        <div
          className="relative bg-slate-800/30 border-2 border-slate-700 rounded-l-[60px] rounded-r-[30px] p-4 pb-8"
          style={{ width: `${widthPx}px` }}
        >
          {/* Side labels */}
          <div className="flex justify-between text-[8px] text-slate-500 font-bold mb-2">
            <span>NOSE ←</span>
            <span className="text-slate-600">STARBOARD (R) - Top row</span>
            <span>→ TAIL</span>
          </div>

          {/* Main content area */}
          <div className="relative w-full" style={{ height: '220px' }}>
            {/* AISLE line */}
            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2">
              <div className="flex items-center justify-center">
                <div className="flex-1 border-t border-dashed border-slate-700/70" />
                <span className="px-2 text-[7px] text-slate-600 leading-none font-bold">AISLE</span>
                <div className="flex-1 border-t border-dashed border-slate-700/70" />
              </div>
            </div>

            {/* Loaded positions */}
            {mainDeckPositions.filter(p => p.content).map((p) => {
              const x = mainDeckArmX.toX(typeof p.arm === 'number' ? p.arm : 0);
              const slotW = 36;
              
              // Better Y positioning to keep inside fuselage
              let y = 86; // center (for centerline positions)
              if (p.id.endsWith('R')) y = 18; // top (starboard) - moved down
              else if (p.id.endsWith('L')) y = 152; // bottom (port) - moved up
              
              return (
                <div
                  key={p.id}
                  className="absolute -translate-x-1/2"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${slotW}px`,
                  }}
                >
                  {renderSlot(p)}
                </div>
              );
            })}
          </div>

          {/* Bottom side label */}
          <div className="text-[8px] text-slate-600 font-bold mt-2 text-center">
            PORT (L) - Bottom row
          </div>
        </div>
      </div>

      {/* Lower Deck - Matching app layout */}
      <div>
        <div className="text-sm font-bold text-slate-700 mb-2">Lower Deck (Belly)</div>
        <div
          className="bg-slate-800/30 border-2 border-slate-700 rounded-l-[40px] rounded-r-[20px] p-3"
          style={{ width: `${widthPx}px` }}
        >
          <div className="flex items-stretch gap-3 w-full">
            {/* Forward Hold */}
            <div className="relative flex flex-col min-w-0" style={{ flex: '7 1 0%' }}>
              <span className="text-[8px] text-slate-500 mb-1">FWD HOLD</span>
              {(() => {
                // Group by row (11P, 12P vs 21P, 22P, 23P)
                const row1 = lowerDeckGroups.fwd.filter(p => p.id.startsWith('1'));
                const row2 = lowerDeckGroups.fwd.filter(p => p.id.startsWith('2'));
                
                return (
                  <>
                    {row1.length > 0 && (
                      <div
                        className="grid gap-0.5 p-1 w-full bg-red-500/10 border border-red-500/30 rounded"
                        style={{ gridTemplateColumns: `repeat(${row1.length}, minmax(0, 1fr))` }}
                      >
                        {row1.map((p) => (
                          <div key={p.id} className="min-w-0">
                            {renderSlot(p, true)}
                          </div>
                        ))}
                      </div>
                    )}
                    {row2.length > 0 && (
                      <div
                        className="grid gap-0.5 p-1 w-full bg-red-500/10 border border-red-500/30 rounded mt-0.5"
                        style={{ gridTemplateColumns: `repeat(${row2.length}, minmax(0, 1fr))` }}
                      >
                        {row2.map((p) => (
                          <div key={p.id} className="min-w-0">
                            {renderSlot(p, true)}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Wing Box */}
            <div
              className="h-16 border border-slate-600 bg-slate-900/50 rounded flex items-center justify-center min-w-0"
              style={{ flex: '2 1 0%' }}
            >
              <span className="text-[8px] text-slate-600 font-bold text-center">WING<br/>BOX</span>
            </div>

            {/* Aft Hold */}
            <div className="relative flex flex-col min-w-0" style={{ flex: '7 1 0%' }}>
              <span className="text-[8px] text-slate-500 mb-1">AFT HOLD</span>
              {(() => {
                // Group by row (31P, 32P vs 41P, 42P)
                const row1 = lowerDeckGroups.aft.filter(p => p.id.startsWith('3'));
                const row2 = lowerDeckGroups.aft.filter(p => p.id.startsWith('4'));
                
                return (
                  <>
                    {row1.length > 0 && (
                      <div
                        className="grid gap-0.5 p-1 w-full bg-red-500/10 border border-red-500/30 rounded"
                        style={{ gridTemplateColumns: `repeat(${row1.length}, minmax(0, 1fr))` }}
                      >
                        {row1.map((p) => (
                          <div key={p.id} className="min-w-0">
                            {renderSlot(p, true)}
                          </div>
                        ))}
                      </div>
                    )}
                    {row2.length > 0 && (
                      <div
                        className="grid gap-0.5 p-1 w-full bg-red-500/10 border border-red-500/30 rounded mt-0.5"
                        style={{ gridTemplateColumns: `repeat(${row2.length}, minmax(0, 1fr))` }}
                      >
                        {row2.map((p) => (
                          <div key={p.id} className="min-w-0">
                            {renderSlot(p, true)}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Bulk */}
            {lowerDeckGroups.bulk.length > 0 && (
              <div className="relative flex flex-col min-w-0" style={{ flex: '2 1 0%' }}>
                <span className="text-[8px] text-slate-500 mb-1">BULK</span>
                <div
                  className="grid gap-0.5 p-1 w-full bg-red-500/10 border border-red-500/30 rounded"
                  style={{ gridTemplateColumns: `repeat(${lowerDeckGroups.bulk.length}, minmax(0, 1fr))` }}
                >
                  {lowerDeckGroups.bulk.map((p) => (
                    <div key={p.id} className="min-w-0">
                      {renderSlot(p, true)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

