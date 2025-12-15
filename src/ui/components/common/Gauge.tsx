/**
 * Gauge Component
 * 
 * A semi-circular gauge for displaying values like weight and CG.
 */

import React from 'react';

interface GaugeProps {
  label: string;
  value: number | string;
  unit: string;
  max: number;
  danger?: boolean;
}

export const Gauge: React.FC<GaugeProps> = ({ 
  label, 
  value, 
  unit, 
  max, 
  danger = false 
}) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const percent = Math.min(Math.max(numericValue / max, 0), 1);
  const rotation = -90 + (percent * 180);
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-12 overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-8 border-slate-800 box-border"></div>
        <div 
          className={`absolute top-0 left-0 w-24 h-24 rounded-full border-8 border-transparent box-border transition-all duration-700 ${danger ? 'border-t-red-500' : 'border-t-blue-500'}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        ></div>
      </div>
      <div className="text-center -mt-1">
        <div className="text-[10px] text-slate-500 font-bold tracking-wider">{label}</div>
        <div className={`text-sm font-mono font-bold ${danger ? 'text-red-400' : 'text-white'}`}>
          {typeof value === 'number' ? value.toLocaleString() : value} 
          <span className="text-[9px] text-slate-500 ml-1">{unit}</span>
        </div>
      </div>
    </div>
  );
};

