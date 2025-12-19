import React, { useMemo } from 'react';
import type { LoadedPosition, SelectionState } from '@core/types';
import { useSettingsStore } from '@core/settings';
import { getCargoVisual, getHandlingBadges } from '@/ui/utils/cargoVisual';
import { FuselageRuler } from './FuselageRuler';

function svgToDataUrl(svg: string): string {
  // CSS url() + SVG needs URI encoding (spaces, quotes, etc).
  // Keep it simple: encodeURIComponent and also preserve a few characters for readability.
  const encoded = encodeURIComponent(svg)
    .replace(/%0A/g, '')
    .replace(/%20/g, ' ')
    .replace(/%3D/g, '=')
    .replace(/%3A/g, ':')
    .replace(/%2F/g, '/')
    .replace(/%22/g, "'");
  return `url("data:image/svg+xml,${encoded}")`;
}

function getB747ProfileMaskUrl(): string {
  // Simple rounded rectangles: main fuselage + upper-deck hump (747 characteristic).
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 980 300" preserveAspectRatio="none">
      <rect x="60" y="96" width="880" height="124" rx="62" ry="62" fill="white"/>
      <rect x="160" y="62" width="300" height="56" rx="28" ry="28" fill="white"/>
    </svg>
  `;
  return svgToDataUrl(svg);
}

function getB747ProfileOutlineSvg(): string {
  // Simple rounded rectangles: main fuselage + upper-deck hump.
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 980 300" preserveAspectRatio="none">
      <rect 
        x="60" 
        y="96" 
        width="880" 
        height="124" 
        rx="62" 
        ry="62" 
        fill="rgba(15,23,42,0.08)" 
        stroke="rgba(148,163,184,0.65)" 
        stroke-width="2.5"
      />
      <rect 
        x="160" 
        y="62" 
        width="300" 
        height="56" 
        rx="28" 
        ry="28" 
        fill="rgba(15,23,42,0.12)" 
        stroke="rgba(148,163,184,0.60)" 
        stroke-width="2"
      />
    </svg>
  `;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function posBandY(p: LoadedPosition) {
  // New layout: make MAIN deck clearly inside the fuselage (below the upper-deck hump),
  // and make the deck split slightly BELOW center to imply the MAIN deck is taller.
  if (p.deck === 'LOWER') {
    // Belly band (lower, shorter)
    if (p.type === 'bulk') return 214;
    return p.group === 'AFT' ? 206 : 196;
  }
  // Main deck band (lowered)
  if (p.id.endsWith('R')) return 128;
  if (p.id.endsWith('L')) return 146;
  return 136;
}

function posBoxSize(p: LoadedPosition) {
  if (p.deck === 'LOWER') return { w: 42, h: 26 };
  // Main deck (pallets)
  return { w: 46, h: 30 };
}

export const AircraftProfile: React.FC<{
  widthPx: number;
  rulerRange: { minIn: number; maxIn: number };
  rulerStations: Array<{ id: string; label: string; armIn: number }>;
  positions: LoadedPosition[];
  selection: SelectionState;
  onSelectPosition: (id: string) => void;
}> = ({ widthPx, rulerRange, rulerStations, positions, selection, onSelectPosition }) => {
  const cargoColorMode = useSettingsStore((s) => s.settings.display.cargoColorMode);
  const maskUrl = useMemo(() => getB747ProfileMaskUrl(), []);
  const outlineSvg = useMemo(() => getB747ProfileOutlineSvg(), []);
  const armRange = useMemo(() => {
    // Use the same range as the plan view ruler so the scale aligns perfectly across views.
    const min = Number.isFinite(rulerRange.minIn) ? rulerRange.minIn : 0;
    const max = Number.isFinite(rulerRange.maxIn) ? rulerRange.maxIn : min + 1;
    return { min, max: max === min ? min + 1 : max };
  }, [rulerRange.minIn, rulerRange.maxIn]);

  const loaded = useMemo(() => positions.filter(p => !!p.content), [positions]);

  // For LOWER deck only: if multiple positions share the same arm (station),
  // fan them a bit so you can tell they're adjacent (e.g., 21P/22P/23P).
  const lowerStack = useMemo(() => {
    const byArm = new Map<number, LoadedPosition[]>();
    for (const p of loaded) {
      if (p.deck !== 'LOWER') continue;
      const k = p.arm;
      const arr = byArm.get(k) ?? [];
      arr.push(p);
      byArm.set(k, arr);
    }

    const out = new Map<string, { idx: number; count: number }>();
    for (const [arm, arr] of byArm.entries()) {
      arr.sort((a, b) => a.id.localeCompare(b.id));
      const count = arr.length;
      arr.forEach((p, idx) => out.set(`${arm}|${p.id}`, { idx, count }));
    }
    return out;
  }, [loaded]);

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Side Profile</div>
          <div className="text-[10px] text-slate-600">Boxes placed by station arm (in)</div>
        </div>
        <div className="text-[10px] text-slate-600 font-mono tabular-nums">
          Arm range: {Math.round(armRange.min)}–{Math.round(armRange.max)}
        </div>
      </div>

      <div
        className="relative h-[300px] bg-slate-800/30 border-2 border-slate-700 rounded-2xl overflow-hidden"
        style={{ width: `${widthPx}px` }}
      >
        {/* Silhouette outline (visual) */}
        <div
          className="absolute inset-0 pointer-events-none"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: outlineSvg }}
        />

        {/* Masked content layer (all cargo + deck hints clipped to silhouette) */}
        <div
          className="absolute inset-0"
          style={{
            // Safari/iPad needs the prefixed property.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            WebkitMaskImage: maskUrl as any,
            maskImage: maskUrl,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
        >
          {/* Deck bands (subtle, clipped) */}
          <div className="absolute left-[148px] right-[520px] top-[70px] h-[40px] border border-slate-700/50 bg-slate-900/10 rounded" />
          <div className="absolute left-8 right-8 top-[118px] h-[78px] border border-slate-700/50 bg-slate-900/10 rounded" />
          <div className="absolute left-8 right-8 top-[202px] h-[38px] border border-slate-700/50 bg-slate-900/10 rounded" />
          <div className="absolute left-10 top-[120px] text-[9px] font-bold text-slate-500">MAIN DECK</div>
          <div className="absolute left-10 top-[204px] text-[9px] font-bold text-slate-500">LOWER DECK</div>
          <div className="absolute left-[160px] top-[72px] text-[9px] font-bold text-slate-500">UPPER DECK</div>

          {/* Loaded boxes */}
          {loaded.map((p) => {
            const t = clamp01((p.arm - armRange.min) / (armRange.max - armRange.min));
            const leftPx = lerp(0.08 * widthPx, 0.92 * widthPx, t);
            const baseY = posBandY(p);
            const { w, h } = posBoxSize(p);
            const isActive = selection.id === p.id && selection.source === 'slot';
            const item = p.content!;
            const visual = getCargoVisual(item, cargoColorMode);
            const baseClass = visual.bg ?? 'bg-slate-700/60';
            const badges = cargoColorMode === 'uld' ? getHandlingBadges(item) : [];
            const stack = p.deck === 'LOWER' ? lowerStack.get(`${p.arm}|${p.id}`) : undefined;
            // Small vertical fan so boxes partially overlap but remain visible.
            const stackYOffsetPx =
              stack && stack.count > 1 ? (stack.idx - (stack.count - 1) / 2) * 10 : 0;

            return (
              <button
                key={p.id}
                type="button"
                title={`${p.id} • ${p.content?.dest.code ?? ''} • ${(p.content?.weight ?? 0) / 1000}t`}
                onClick={() => onSelectPosition(p.id)}
                className={[
                  'absolute -translate-x-1/2 rounded-md border border-white/15 shadow-lg',
                  baseClass,
                  cargoColorMode === 'uld' ? 'saturate-90' : '',
                  isActive ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 z-20' : 'hover:ring-2 hover:ring-slate-200/50',
                ].join(' ')}
                style={{
                  left: `${leftPx}px`,
                  top: `${baseY + stackYOffsetPx}px`,
                  width: `${w}px`,
                  height: `${h}px`,
                }}
              >
                <div className="w-full h-full px-1 py-0.5 flex flex-col items-center justify-center">
                  {badges.length > 0 && (
                    <div className="absolute top-0.5 left-0.5 flex gap-0.5">
                      {badges.map((b) => (
                        <span
                          key={b}
                          className="px-1 py-[1px] rounded bg-slate-950/55 border border-white/10 text-[7px] font-black text-white leading-none"
                          title="Handling flag"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-[9px] font-bold leading-none text-white/90">{p.content?.dest.code}</div>
                  <div className="text-[8px] font-mono leading-none text-white/80">
                    {p.id}{cargoColorMode === 'uld' ? ` • ${item.uldType}` : ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Nose/Tail labels (unmasked, to stay readable) */}
        <div className="absolute left-6 top-3 text-[10px] text-slate-500 font-bold">NOSE ←</div>
        <div className="absolute right-6 top-3 text-[10px] text-slate-500 font-bold">→ TAIL</div>

        {/* Pilot + jumpseat markers (unmasked, consistent visibility) */}
        <div className="absolute left-[120px] top-[58px] flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200/80 border border-slate-900" title="Captain" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200/80 border border-slate-900" title="First Officer" />
          <div className="w-2 h-2 rounded-full bg-slate-400/80 border border-slate-900" title="Jumpseater" />
          <div className="text-[9px] text-slate-500 font-bold ml-1">FLIGHT DECK</div>
        </div>

        {/* Longitudinal ruler (shared with plan view) */}
        <div className="absolute left-0 top-[254px] z-40">
          <FuselageRuler
            widthPx={widthPx}
            range={rulerRange}
            insetPct={{ left: 8, right: 8 }}
            majorTickIn={100}
            minorTickIn={20}
            stations={rulerStations}
            align="top"
          />
        </div>
      </div>

      <div className="mt-2 text-[10px] text-slate-500">
        Tip: use this view for a quick sense of <span className="text-slate-300 font-bold">fore/aft distribution</span>; lateral (L/R) is intentionally collapsed.
      </div>
    </div>
  );
};


