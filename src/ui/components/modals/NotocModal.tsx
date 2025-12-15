/**
 * NotocModal Component
 * 
 * NOTOC (Notification to Captain) modal for special cargo.
 */

import React from 'react';
import { FileWarning, X } from 'lucide-react';
import type { LoadedPosition } from '@core/types';

interface NotocModalProps {
  positions: LoadedPosition[];
  onClose: () => void;
}

export const NotocModal: React.FC<NotocModalProps> = ({ positions, onClose }) => {
  // Filter for special cargo (DG and Perishable)
  const specials = positions
    .filter(p => p.content && (p.content.type.code === 'DG' || p.content.type.code === 'PER'))
    .map(p => ({
      pos: p.id,
      id: p.content!.id,
      type: p.content!.type.label,
      weight: p.content!.weight,
      code: p.content!.type.code,
    }));

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-500 hover:text-white"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
          <FileWarning className="text-amber-500 w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold text-white">NOTOC</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest">
              Notification to Captain - Special Loads
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto">
          {specials.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No Special Cargo (DG/PER) loaded.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-700">
                <tr>
                  <th className="pb-2">POS</th>
                  <th className="pb-2">ULD ID</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Code</th>
                  <th className="pb-2 text-right">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {specials.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50">
                    <td className="py-3 font-mono text-white font-bold">{item.pos}</td>
                    <td className="py-3 font-mono">{item.id}</td>
                    <td className="py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        item.code === 'DG' 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 font-mono">{item.code}</td>
                    <td className="py-3 text-right font-mono">{item.weight} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-slate-800 p-4 rounded-lg flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Total Special Load Items: {specials.length}
          </span>
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs"
          >
            ACKNOWLEDGE & PRINT
          </button>
        </div>
      </div>
    </div>
  );
};

