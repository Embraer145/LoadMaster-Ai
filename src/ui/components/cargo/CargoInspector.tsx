/**
 * CargoInspector Component
 * 
 * Detailed view and editor for a selected cargo item.
 */

import React from 'react';
import { Search, Scale, MapPin, Package, Barcode } from 'lucide-react';
import type { CargoItem } from '@core/types';

interface CargoInspectorProps {
  selectedContent: CargoItem | null;
  onWeightChange: (newWeight: number) => void;
}

export const CargoInspector: React.FC<CargoInspectorProps> = ({
  selectedContent,
  onWeightChange,
}) => {
  if (!selectedContent) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-8 min-h-[420px] flex flex-col items-center justify-center text-slate-600 shadow-inner">
        <Search size={32} className="mb-3 opacity-20" />
        <p className="text-xs font-medium uppercase tracking-wider">Cargo Inspector</p>
        <p className="text-[10px] opacity-70 mt-1">Select a ULD to view details</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-xl p-0 overflow-hidden shadow-2xl min-h-[420px] flex flex-col transition-all duration-300">
      <div className={`p-4 ${selectedContent.type.color.replace('bg-', 'bg-gradient-to-r from-slate-900 to-')} border-b border-white/10`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-white font-mono">{selectedContent.id}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${selectedContent.type.color}`}>
              {selectedContent.type.label}
            </span>
          </div>
          <div className="text-right">
            <span className="block text-2xl font-bold text-white leading-none">
              {(selectedContent.weight / 1000).toFixed(1)}t
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 shadow-inner">
          <div className="flex justify-between items-center mb-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Scale size={12} /> Adjust Weight
            </label>
            <span className="font-mono text-white text-sm font-bold">
              {selectedContent.weight} kg
            </span>
          </div>
          <input 
            type="range" 
            min="100" 
            max="8000" 
            step="10" 
            value={selectedContent.weight} 
            onChange={(e) => onWeightChange(parseInt(e.target.value))} 
            className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-blue-500 cursor-pointer" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <MapPin size={10} /> Origin
            </span>
            <div className="text-sm font-mono text-white">{selectedContent.origin}</div>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <MapPin size={10} /> Destination
            </span>
            <div className="text-sm font-mono text-white flex items-center gap-2">
              {selectedContent.dest.code} <span className="text-base">{selectedContent.dest.flag}</span>
            </div>
            <div className="text-[10px] text-slate-400">{selectedContent.dest.city}</div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700/50">
          <span className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-1">
            <Package size={10} /> Content
          </span>
          <div className="text-sm text-slate-200 font-medium">General Cargo</div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
            <span className="text-[9px] text-slate-500 block">AWB Number</span>
            <div className="text-xs font-mono text-slate-300 flex items-center gap-1">
              <Barcode size={10} /> {selectedContent.awb}
            </div>
          </div>
          <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
            <span className="text-[9px] text-slate-500 block">Handling</span>
            <div className="text-xs font-mono text-slate-300">{selectedContent.type.code} / SPL</div>
          </div>
        </div>
      </div>
    </div>
  );
};

