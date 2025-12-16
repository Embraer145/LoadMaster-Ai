import React from 'react';
import type { WarehouseSortMode } from '@core/warehouse';
import { WAREHOUSE_SORT_LABEL, WAREHOUSE_SORT_MODES } from '@core/warehouse';
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Barcode,
  Boxes,
  CircleSlash2,
  Hash,
  Layers,
  Route,
  Tags,
} from 'lucide-react';

function SortIcon({ mode, active }: { mode: WarehouseSortMode; active: boolean }) {
  const base =
    'w-5 h-5 transition-transform duration-200 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-1';
  const tone = active ? 'text-blue-300' : 'text-slate-300';

  switch (mode) {
    case 'none':
      return <CircleSlash2 className={`${base} ${tone} motion-safe:group-hover:rotate-0`} />;
    case 'weight_desc':
      return <ArrowDownWideNarrow className={`${base} ${tone} motion-safe:group-hover:translate-y-[-1px]`} />;
    case 'weight_asc':
      return <ArrowUpWideNarrow className={`${base} ${tone} motion-safe:group-hover:translate-y-[-1px]`} />;
    case 'dest_route_last_first':
      return <Route className={`${base} ${tone} motion-safe:group-hover:translate-x-[1px]`} />;
    case 'dest_route_first_first':
      return <Route className={`${base} ${tone} motion-safe:group-hover:-translate-x-[1px]`} />;
    case 'cargo_type':
      return <Tags className={`${base} ${tone} motion-safe:group-hover:rotate-1`} />;
    case 'uld_type':
      return <Boxes className={`${base} ${tone} motion-safe:group-hover:rotate-1`} />;
    case 'deck_pref':
      return <Layers className={`${base} ${tone} motion-safe:group-hover:translate-y-[-1px]`} />;
    case 'awb':
      return <Barcode className={`${base} ${tone} motion-safe:group-hover:scale-105`} />;
    case 'uld_id':
      return <Hash className={`${base} ${tone} motion-safe:group-hover:rotate-1`} />;
    default:
      return <Route className={`${base} ${tone}`} />;
  }
}

interface WarehouseSortModalProps {
  isOpen: boolean;
  value: WarehouseSortMode;
  onSelect: (mode: WarehouseSortMode) => void;
  onClose: () => void;
}

export const WarehouseSortModal: React.FC<WarehouseSortModalProps> = ({
  isOpen,
  value,
  onSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[210]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close sort picker"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40">
            <div className="text-sm font-bold text-white">Warehouse Sort</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Select how payload items are organized in the staging bar.
            </div>
          </div>

          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {WAREHOUSE_SORT_MODES.map((mode) => {
              const active = mode === value;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSelect(mode)}
                  className={`group text-left px-3 py-2 rounded-xl border transition-colors ${
                    active
                      ? 'bg-blue-600/15 border-blue-500/50 text-white'
                      : 'bg-slate-950/30 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 w-9 h-9 rounded-xl border flex items-center justify-center ${
                        active
                          ? 'bg-blue-600/10 border-blue-500/40'
                          : 'bg-slate-900/40 border-slate-800'
                      }`}
                    >
                      <SortIcon mode={mode} active={active} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold">{WAREHOUSE_SORT_LABEL[mode]}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                        {mode}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


