/**
 * FlightEnvelope Component
 * 
 * Professional weight & balance envelope chart for B747-400F.
 * Designed to match industry-standard loadsheet diagrams.
 * 
 * Features:
 * - Index units on X-axis (0-100 scale)
 * - %MAC reference scale along top
 * - Weight limit lines (MTOW, MLW, MZFW)
 * - CG travel path from ZFW to TOW
 * - Target CG indicator
 * - Fuel burn CG variation
 * - iPad-friendly touch targets
 */

import React from 'react';
import { getB747Envelope, validateAgainstEnvelope } from '@core/envelope';

interface FlightEnvelopeProps {
  currentWeight: number;  // TOW in kg
  currentCG: number;      // %MAC
  zfw: number;            // Zero Fuel Weight
  zfwCG: number;          // ZFW CG %MAC
  fwdLimit: number;       // Forward CG limit
  aftLimit: number;       // Aft CG limit
  fuel: number;           // Fuel weight
}

// B747-400F Limits
const LIMITS = {
  MTOW: 396890,  // kg
  MLW: 302090,   // kg
  MZFW: 288000,  // kg
  MIN_WEIGHT: 150000, // Display minimum
  MAX_WEIGHT: 420000, // Display maximum
};

// Convert %MAC to Index units (0-100 scale)
// This is a simplified linear conversion; real aircraft use specific formulas
const macToIndex = (mac: number): number => {
  // Approximate: %MAC 10-40 maps to Index 10-90
  return 10 + (mac - 10) * (80 / 30);
};

// Chart dimensions
const CHART = {
  width: 500,
  height: 350,
  margin: { top: 40, right: 80, bottom: 50, left: 70 },
};

const plotWidth = CHART.width - CHART.margin.left - CHART.margin.right;
const plotHeight = CHART.height - CHART.margin.top - CHART.margin.bottom;

// Scale functions
const xScale = (index: number): number => {
  return CHART.margin.left + (index / 100) * plotWidth;
};

const yScale = (weight: number): number => {
  const range = LIMITS.MAX_WEIGHT - LIMITS.MIN_WEIGHT;
  return CHART.margin.top + plotHeight - ((weight - LIMITS.MIN_WEIGHT) / range) * plotHeight;
};

export const FlightEnvelope: React.FC<FlightEnvelopeProps> = ({
  currentWeight,
  currentCG,
  zfw,
  zfwCG,
  fwdLimit,
  aftLimit,
  fuel,
}) => {
  // Convert to index units
  const towIndex = macToIndex(currentCG);
  const zfwIndex = macToIndex(zfwCG);
  const fwdIndex = macToIndex(fwdLimit);
  const aftIndex = macToIndex(aftLimit);
  const targetIndex = macToIndex(27); // Target CG around 27% MAC
  
  // Envelope definitions (sample today; will be replaced by real aircraft tables)
  const takeoffEnvelope = getB747Envelope('takeoff');
  const zfwEnvelope = getB747Envelope('zero_fuel');
  const landingEnvelope = getB747Envelope('landing');

  // Validate points against the correct envelope (this avoids ZFW being judged against takeoff)
  const towValidation = validateAgainstEnvelope(currentWeight, currentCG, takeoffEnvelope);
  const zfwValidation = validateAgainstEnvelope(zfw, zfwCG, zfwEnvelope);

  // Check if within limits (primary status based on takeoff point)
  const isWithinLimits = towValidation.isValid;
  
  // Build envelope polygons from envelope boundaries (forward + aft reversed)
  const envelopeToPolygon = (env: typeof takeoffEnvelope): string => {
    const fwd = env.forwardLimit.points.map(p => ({ x: macToIndex(p.cgPercent), y: p.weight }));
    const aft = [...env.aftLimit.points].reverse().map(p => ({ x: macToIndex(p.cgPercent), y: p.weight }));
    const poly = [...fwd, ...aft];
    return poly.map(p => `${xScale(p.x)},${yScale(p.y)}`).join(' ');
  };

  const takeoffEnvelopePath = envelopeToPolygon(takeoffEnvelope);
  const zfwEnvelopePath = envelopeToPolygon(zfwEnvelope);
  const landingEnvelopePath = envelopeToPolygon(landingEnvelope);

  // Y-axis ticks
  const yTicks = [150000, 200000, 250000, 300000, 350000, 400000];
  
  // X-axis ticks (Index)
  const xTicks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  
  // %MAC reference scale
  const macTicks = [10, 14, 18, 22, 26, 30, 34, 38, 42];

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-lg min-h-[420px] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">
            Weight & Balance Envelope
          </h3>
          <p className="text-[10px] text-slate-500">B747-400F • Takeoff/Landing</p>
        </div>
        
        {/* Status Badge */}
        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
          isWithinLimits 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isWithinLimits ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {isWithinLimits ? 'IN LIMITS' : 'OUT OF LIMITS'}
        </div>
      </div>
      
      {/* SVG Chart */}
      <div className="flex-1 min-h-0">
        <svg 
          viewBox={`0 0 ${CHART.width} ${CHART.height}`} 
          className="w-full h-full"
          style={{ fontFamily: 'ui-monospace, monospace' }}
        >
          {/* Background */}
          <rect x={CHART.margin.left} y={CHART.margin.top} width={plotWidth} height={plotHeight} fill="#1e293b" />
          
          {/* Grid lines */}
          {yTicks.map(tick => (
            <g key={`y-${tick}`}>
              <line 
                x1={CHART.margin.left} 
                y1={yScale(tick)} 
                x2={CHART.width - CHART.margin.right} 
                y2={yScale(tick)} 
                stroke="#334155" 
                strokeWidth="0.5"
              />
              <text 
                x={CHART.margin.left - 8} 
                y={yScale(tick)} 
                textAnchor="end" 
                dominantBaseline="middle"
                fill="#94a3b8" 
                fontSize="9"
              >
                {(tick / 1000).toFixed(0)}
              </text>
            </g>
          ))}
          
          {xTicks.map(tick => (
            <g key={`x-${tick}`}>
              <line 
                x1={xScale(tick)} 
                y1={CHART.margin.top} 
                x2={xScale(tick)} 
                y2={CHART.height - CHART.margin.bottom} 
                stroke="#334155" 
                strokeWidth="0.5"
              />
              <text 
                x={xScale(tick)} 
                y={CHART.height - CHART.margin.bottom + 15} 
                textAnchor="middle"
                fill="#94a3b8" 
                fontSize="9"
              >
                {tick}
              </text>
            </g>
          ))}
          
          {/* %MAC scale at top */}
          <g>
            <rect 
              x={CHART.margin.left} 
              y={CHART.margin.top - 25} 
              width={plotWidth} 
              height="18" 
              fill="#0f172a" 
              stroke="#475569"
            />
            <text 
              x={CHART.margin.left - 5} 
              y={CHART.margin.top - 14} 
              textAnchor="end" 
              fill="#94a3b8" 
              fontSize="8"
            >
              %MAC
            </text>
            {macTicks.map(mac => (
              <g key={`mac-${mac}`}>
                <text 
                  x={xScale(macToIndex(mac))} 
                  y={CHART.margin.top - 14} 
                  textAnchor="middle" 
                  fill="#e2e8f0" 
                  fontSize="8"
                  fontWeight="bold"
                >
                  {mac}
                </text>
              </g>
            ))}
          </g>
          
          {/* Axis labels */}
          <text 
            x={CHART.width / 2} 
            y={CHART.height - 8} 
            textAnchor="middle" 
            fill="#94a3b8" 
            fontSize="10" 
            fontWeight="bold"
          >
            INDEX
          </text>
          
          <text 
            x={15} 
            y={CHART.height / 2} 
            textAnchor="middle" 
            fill="#94a3b8" 
            fontSize="10" 
            fontWeight="bold"
            transform={`rotate(-90, 15, ${CHART.height / 2})`}
          >
            WEIGHT (× 1000 kg)
          </text>
          
          {/* Takeoff envelope */}
          <polygon 
            points={takeoffEnvelopePath}
            fill="rgba(34, 197, 94, 0.10)"
            stroke="#22c55e"
            strokeWidth="2"
          />

          {/* ZFW envelope (separate from takeoff) */}
          <polygon
            points={zfwEnvelopePath}
            fill="rgba(34, 211, 238, 0.08)"
            stroke="#22d3ee"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          
          {/* Landing envelope (inner) */}
          <polygon 
            points={landingEnvelopePath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          
          {/* MTOW Line */}
          <line 
            x1={CHART.margin.left} 
            y1={yScale(LIMITS.MTOW)} 
            x2={CHART.width - CHART.margin.right} 
            y2={yScale(LIMITS.MTOW)} 
            stroke="#ef4444" 
            strokeWidth="2"
          />
          <rect x={CHART.width - CHART.margin.right + 5} y={yScale(LIMITS.MTOW) - 8} width="70" height="16" fill="#0f172a" stroke="#ef4444" strokeWidth="1" rx="2" />
          <text 
            x={CHART.width - CHART.margin.right + 10} 
            y={yScale(LIMITS.MTOW) + 4} 
            fill="#ef4444" 
            fontSize="9"
            fontWeight="bold"
          >
            MTOW {(LIMITS.MTOW/1000).toFixed(0)}t
          </text>
          
          {/* MLW Line */}
          <line 
            x1={CHART.margin.left} 
            y1={yScale(LIMITS.MLW)} 
            x2={CHART.width - CHART.margin.right} 
            y2={yScale(LIMITS.MLW)} 
            stroke="#f59e0b" 
            strokeWidth="1.5"
            strokeDasharray="5 3"
          />
          <text 
            x={CHART.width - CHART.margin.right + 10} 
            y={yScale(LIMITS.MLW) + 4} 
            fill="#f59e0b" 
            fontSize="8"
          >
            MLW {(LIMITS.MLW/1000).toFixed(0)}t
          </text>
          
          {/* MZFW Line */}
          <line 
            x1={CHART.margin.left} 
            y1={yScale(LIMITS.MZFW)} 
            x2={CHART.width - CHART.margin.right} 
            y2={yScale(LIMITS.MZFW)} 
            stroke="#3b82f6" 
            strokeWidth="1.5"
            strokeDasharray="5 3"
          />
          <text 
            x={CHART.width - CHART.margin.right + 10} 
            y={yScale(LIMITS.MZFW) + 4} 
            fill="#3b82f6" 
            fontSize="8"
          >
            MZFW {(LIMITS.MZFW/1000).toFixed(0)}t
          </text>
          
          {/* Target CG Line (vertical dashed) */}
          <line 
            x1={xScale(targetIndex)} 
            y1={CHART.margin.top} 
            x2={xScale(targetIndex)} 
            y2={CHART.height - CHART.margin.bottom} 
            stroke="#10b981" 
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text 
            x={xScale(targetIndex)} 
            y={CHART.margin.top - 2} 
            textAnchor="middle" 
            fill="#10b981" 
            fontSize="8"
          >
            Target CG
          </text>
          
          {/* Forward Limit Line */}
          <line 
            x1={xScale(fwdIndex)} 
            y1={yScale(200000)} 
            x2={xScale(fwdIndex)} 
            y2={yScale(400000)} 
            stroke="#f97316" 
            strokeWidth="2"
          />
          
          {/* Aft Limit Line */}
          <line 
            x1={xScale(aftIndex)} 
            y1={yScale(160000)} 
            x2={xScale(aftIndex)} 
            y2={yScale(400000)} 
            stroke="#f97316" 
            strokeWidth="2"
          />
          
          {/* CG Travel Path (ZFW to TOW) */}
          <line 
            x1={xScale(zfwIndex)} 
            y1={yScale(zfw)} 
            x2={xScale(towIndex)} 
            y2={yScale(currentWeight)} 
            stroke="#94a3b8" 
            strokeWidth="2"
            strokeDasharray="6 3"
          />
          
          {/* Fuel Burn Path Annotation */}
          {fuel > 0 && (
            <g>
              <path 
                d={`M ${xScale(towIndex)} ${yScale(currentWeight)} 
                    Q ${xScale(towIndex + 5)} ${yScale(currentWeight - fuel/2)} 
                    ${xScale(zfwIndex + 2)} ${yScale(zfw + 5000)}`}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                opacity="0.6"
              />
              <text 
                x={xScale(towIndex + 8)} 
                y={yScale(currentWeight - fuel/3)} 
                fill="#60a5fa" 
                fontSize="7"
              >
                CG Variation
              </text>
              <text 
                x={xScale(towIndex + 8)} 
                y={yScale(currentWeight - fuel/3) + 9} 
                fill="#60a5fa" 
                fontSize="7"
              >
                with fuel burn
              </text>
            </g>
          )}
          
          {/* ZFW Point */}
          <circle 
            cx={xScale(zfwIndex)} 
            cy={yScale(zfw)} 
            r="6" 
            fill="#3b82f6" 
            stroke="white" 
            strokeWidth="2"
          />
          <text 
            x={xScale(zfwIndex) - 10} 
            y={yScale(zfw) - 10} 
            fill="#3b82f6" 
            fontSize="9"
            fontWeight="bold"
          >
            ZFW
          </text>
          
          {/* TOW Point */}
          <circle 
            cx={xScale(towIndex)} 
            cy={yScale(currentWeight)} 
            r="7" 
            fill="#10b981" 
            stroke="white" 
            strokeWidth="2"
          />
          <text 
            x={xScale(towIndex) + 10} 
            y={yScale(currentWeight) - 10} 
            fill="#10b981" 
            fontSize="9"
            fontWeight="bold"
          >
            TOW
          </text>
          
          {/* Legend */}
          <g transform={`translate(${CHART.margin.left + 10}, ${CHART.height - CHART.margin.bottom - 72})`}>
            <rect x="0" y="0" width="110" height="67" fill="#0f172a" stroke="#475569" rx="3" />
            
            <circle cx="10" cy="12" r="4" fill="#3b82f6" />
            <text x="18" y="15" fill="#94a3b8" fontSize="8">ZFW Point</text>
            
            <circle cx="10" cy="26" r="4" fill="#10b981" />
            <text x="18" y="29" fill="#94a3b8" fontSize="8">TOW Point</text>
            
            <line x1="5" y1="40" x2="15" y2="40" stroke="#22c55e" strokeWidth="2" />
            <text x="18" y="43" fill="#94a3b8" fontSize="8">Takeoff Env.</text>

            <line x1="5" y1="52" x2="15" y2="52" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3 2" />
            <text x="18" y="55" fill="#94a3b8" fontSize="8">ZFW Env.</text>

            <line x1="5" y1="64" x2="15" y2="64" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" />
            <text x="18" y="67" fill="#94a3b8" fontSize="8">Landing Env.</text>
          </g>
        </svg>
      </div>
      
      {/* Data Summary Footer */}
      <div className="grid grid-cols-4 gap-1 mt-2 bg-slate-800/50 rounded-lg p-2">
        <DataCell label="ZFW" value={`${(zfw/1000).toFixed(1)}t`} subValue={`${zfwCG.toFixed(1)}%`} color="blue" />
        <DataCell label="FUEL" value={`${(fuel/1000).toFixed(1)}t`} color="slate" />
        <DataCell label="TOW" value={`${(currentWeight/1000).toFixed(1)}t`} subValue={`${currentCG.toFixed(1)}%`} color="emerald" />
        <DataCell 
          label="CG MARGIN" 
          value={`${Math.min(currentCG - fwdLimit, aftLimit - currentCG).toFixed(1)}%`} 
          color={Math.min(currentCG - fwdLimit, aftLimit - currentCG) < 3 ? 'amber' : 'slate'}
        />
      </div>

      {/* Validation note (high-signal for debugging test cases) */}
      <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
        <span>
          ZFW: <span className={zfwValidation.isValid ? 'text-slate-300' : 'text-amber-300'}>{zfwValidation.isValid ? 'IN ZFW ENVELOPE' : 'OUT OF ZFW ENVELOPE'}</span>
        </span>
        <span>
          TOW: <span className={towValidation.isValid ? 'text-slate-300' : 'text-amber-300'}>{towValidation.isValid ? 'IN TAKEOFF ENVELOPE' : 'OUT OF TAKEOFF ENVELOPE'}</span>
        </span>
      </div>
    </div>
  );
};

// Data cell component for footer
const DataCell: React.FC<{ 
  label: string; 
  value: string; 
  subValue?: string;
  color: 'blue' | 'emerald' | 'amber' | 'slate';
}> = ({ label, value, subValue, color }) => {
  const colorClasses = {
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    slate: 'text-slate-300',
  };
  
  return (
    <div className="text-center">
      <div className="text-[9px] text-slate-500 font-bold uppercase">{label}</div>
      <div className={`text-sm font-mono font-bold ${colorClasses[color]}`}>{value}</div>
      {subValue && (
        <div className="text-[10px] text-slate-500 font-mono">{subValue}</div>
      )}
    </div>
  );
};
