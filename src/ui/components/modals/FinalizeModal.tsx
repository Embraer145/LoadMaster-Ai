/**
 * FinalizeModal Component
 * 
 * Flight release confirmation modal.
 */

import React from 'react';
import { CheckSquare, Wind, X } from 'lucide-react';
import type { PhysicsResult } from '@core/types';

interface FinalizeModalProps {
  physics: PhysicsResult;
  onFinalize: () => void;
  onClose: () => void;
}

export const FinalizeModal: React.FC<FinalizeModalProps> = ({ physics, onFinalize, onClose }) => {
  const handleFinalize = () => {
    onFinalize();
    onClose();
  };

  const handleTransmit = () => {
    alert("Transmitted to ACARS");
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-8 shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-500 hover:text-white"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <CheckSquare className="text-emerald-500 w-8 h-8" />
          <h2 className="text-2xl font-bold text-white">Finalize Load Plan</h2>
        </div>

        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 p-3 rounded">
              <span className="text-xs text-slate-500 block mb-1">ZERO FUEL WEIGHT</span>
              <span className="text-xl font-mono text-white font-bold">
                {physics.zfw.toLocaleString()} kg
              </span>
            </div>
            <div className="bg-slate-800 p-3 rounded">
              <span className="text-xs text-slate-500 block mb-1">TAKEOFF WEIGHT</span>
              <span className="text-xl font-mono text-white font-bold">
                {physics.weight.toLocaleString()} kg
              </span>
            </div>
            <div className="bg-slate-800 p-3 rounded">
              <span className="text-xs text-slate-500 block mb-1">TAKEOFF CG</span>
              <span className="text-xl font-mono text-emerald-400 font-bold">
                {physics.towCG}% MAC
              </span>
            </div>
            <div className="bg-slate-800 p-3 rounded">
              <span className="text-xs text-slate-500 block mb-1">TRIM SETTING</span>
              <span className="text-xl font-mono text-white font-bold">4.2 ANU</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={handleFinalize}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            <CheckSquare size={18} /> FINALIZE &amp; LOCK
          </button>
          <button
            onClick={handleTransmit}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg border border-slate-700"
          >
            <Wind size={18} /> TRANSMIT (PROTOTYPE)
          </button>
        </div>
      </div>
    </div>
  );
};

