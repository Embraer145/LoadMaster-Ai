import React, { useMemo } from 'react';

type RulerStation = {
  id: string;
  label: string;
  armIn: number;
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function fmtIn(x: number) {
  return `${Math.round(x)}`;
}

export const FuselageRuler: React.FC<{
  /** Total pixel width of the fuselage canvas this ruler overlays */
  widthPx: number;
  /** Arm range in inches to map to the ruler */
  range: { minIn: number; maxIn: number };
  /** Optional left/right inset as a percentage of width (e.g., {left: 8, right: 8}) */
  insetPct?: { left: number; right: number };
  /** Major tick increment (inches) */
  majorTickIn?: number;
  /** Minor tick increment (inches) */
  minorTickIn?: number;
  /** Optional station markers placed by arm */
  stations?: RulerStation[];
  /** Where to render the ruler inside its own box */
  align?: 'top' | 'bottom';
}> = ({ widthPx, range, insetPct = { left: 0, right: 0 }, majorTickIn = 100, minorTickIn = 20, stations = [], align = 'top' }) => {
  const safe = useMemo(() => {
    const minIn = Number.isFinite(range.minIn) ? range.minIn : 0;
    const maxIn = Number.isFinite(range.maxIn) ? range.maxIn : minIn + 1;
    const min = Math.min(minIn, maxIn);
    const max = Math.max(minIn, maxIn);
    const span = max - min || 1;
    const major = Math.max(1, Math.round(majorTickIn));
    const minor = Math.max(1, Math.round(minorTickIn));
    const start = Math.floor(min / major) * major;
    const end = Math.ceil(max / major) * major;
    return { min, max, span, major, minor, start, end };
  }, [range.minIn, range.maxIn, majorTickIn, minorTickIn]);

  const toX = (armIn: number) => {
    const t = clamp01((armIn - safe.min) / safe.span);
    const left = (insetPct.left / 100) * widthPx;
    const right = widthPx - (insetPct.right / 100) * widthPx;
    return left + (right - left) * t;
  };

  const majors = useMemo(() => {
    const out: number[] = [];
    for (let a = safe.start; a <= safe.end + 0.0001; a += safe.major) out.push(a);
    return out;
  }, [safe.start, safe.end, safe.major]);

  const minors = useMemo(() => {
    // Guard against generating thousands of ticks (prototype safety).
    const out: number[] = [];
    const maxTicks = 500;
    const step = safe.minor;
    if (step <= 0) return out;
    for (let a = safe.start; a <= safe.end + 0.0001; a += step) {
      if (out.length > maxTicks) break;
      if (Math.abs(a % safe.major) < 0.0001) continue; // skip majors
      out.push(a);
    }
    return out;
  }, [safe.start, safe.end, safe.minor, safe.major]);

  const stationMarks = useMemo(() => {
    return (stations ?? [])
      .filter((s) => s && Number.isFinite(s.armIn))
      .map((s, idx) => ({ ...s, idx }))
      .sort((a, b) => a.armIn - b.armIn);
  }, [stations]);

  const topLine = align === 'top' ? 'top-0' : 'bottom-0';
  const labelRow = align === 'top' ? 'top-0' : 'bottom-0';
  const tickDown = align === 'top';

  return (
    <div className="relative pointer-events-none select-none" style={{ width: `${widthPx}px`, height: '34px' }}>
      {/* Base line */}
      <div
        className={`absolute ${topLine} h-px bg-slate-700/70`}
        style={{
          left: `${(insetPct.left / 100) * widthPx}px`,
          right: `${(insetPct.right / 100) * widthPx}px`,
        }}
      />

      {/* Minor ticks */}
      {minors.map((arm) => {
        const x = toX(arm);
        return (
          <div key={`m-${arm}`} className="absolute" style={{ left: `${x}px`, top: 0 }}>
            <div
              className="w-px bg-slate-700/60"
              style={{ height: tickDown ? '6px' : '6px', marginTop: tickDown ? '0px' : undefined, marginBottom: !tickDown ? '0px' : undefined }}
            />
          </div>
        );
      })}

      {/* Major ticks + labels */}
      {majors.map((arm) => {
        const x = toX(arm);
        return (
          <div key={`M-${arm}`} className="absolute" style={{ left: `${x}px`, top: 0 }}>
            <div className="w-px h-[10px] bg-slate-600/90" />
            <div className={`absolute ${labelRow} mt-[12px] -translate-x-1/2 text-[9px] text-slate-500 font-mono tabular-nums`}>
              {fmtIn(arm)}
            </div>
          </div>
        );
      })}

      {/* Station labels (operator labels) */}
      {stationMarks.map((s) => {
        const x = toX(s.armIn);
        // Stagger vertically to reduce collisions.
        const lane = s.idx % 3;
        const y = 18 + lane * 10;
        return (
          <div key={`S-${s.id}`} className="absolute" style={{ left: `${x}px`, top: 0 }}>
            <div className="w-px h-[14px] bg-amber-500/35" />
            <div
              className="absolute left-0 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-amber-200/80"
              style={{ top: `${y}px` }}
              title={`${s.label} @ ${fmtIn(s.armIn)} in`}
            >
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};


