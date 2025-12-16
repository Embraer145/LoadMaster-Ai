/**
 * CargoInspector Component
 * 
 * Detailed view and editor for a selected cargo item.
 */

import React, { useState } from 'react';
import { Search, Scale, MapPin, Package, Barcode, Copy, Check } from 'lucide-react';
import type { CargoItem } from '@core/types';
import { getUldSpec } from '@core/uld';

interface CargoInspectorProps {
  selectedContent: CargoItem | null;
  onWeightChange: (newWeight: number) => void;
  /** When true, renders without its own card chrome (for embedding in tab panels) */
  embedded?: boolean;
}

export const CargoInspector: React.FC<CargoInspectorProps> = ({
  selectedContent,
  onWeightChange,
  embedded = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!selectedContent) {
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
      <div className={`p-4 ${selectedContent.type.color.replace('bg-', 'bg-gradient-to-r from-slate-900 to-')} border-b border-white/10`}>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white font-mono">{selectedContent.id}</h3>
              <button
                type="button"
                onClick={handleCopyUld}
                className="p-1 rounded bg-slate-950/40 border border-white/10 text-white/80 hover:text-white hover:bg-slate-950/60"
                title="Copy ULD ID"
              >
                {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
              </button>
            </div>
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

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Weight adjust (compact) */}
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 shadow-inner">
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Scale size={12} /> Adjust Weight
            </label>
            <span className="font-mono text-white text-xs font-bold tabular-nums">
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
            className="w-full h-1 bg-slate-700 rounded-full appearance-none accent-blue-500 cursor-pointer" 
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
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
              {selectedContent.dest.code} <span className="text-lg leading-none">{selectedContent.dest.flag}</span>
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
          const height = spec.maxHeightIn ? `${spec.maxHeightIn} in` : '—';
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

              <div className="grid grid-cols-2 gap-2">
                <SpecCell label="Type" value={selectedContent.uldType} />
                <SpecCell label="Base (W×L)" value={dim} />
                <SpecCell label="Max Height" value={height} />
                <SpecCell label="Tare" value={tare} />
                <SpecCell label="Max Gross" value={maxGross} />
                <SpecCell label="Doors" value={selectedContent.compatibleDoors.join(' / ')} />
                <SpecCell label="Flags" value={flags} />
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
          <span className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-1">
            <Package size={10} /> Content
          </span>
          <div className="text-sm text-slate-200 font-medium">General Cargo</div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
            <span className="text-[9px] text-slate-500 block">Handling</span>
            <div className="text-xs font-mono text-slate-300 flex items-center gap-1">
              <Barcode size={10} /> {selectedContent.type.code} / SPL
            </div>
          </div>
          <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
            <span className="text-[9px] text-slate-500 block">Offload</span>
            <div className="text-xs font-mono text-slate-300">{selectedContent.offloadPoint}</div>
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

