/**
 * DraggableCargo Component
 * 
 * A draggable cargo item displayed in the warehouse staging area.
 * Shows destination prominently for unload planning.
 * Touch-friendly for iPad use.
 */

import React, { useMemo, useState } from 'react';
import { Package, Copy, Check, Star } from 'lucide-react';
import type { CargoItem } from '@core/types';

interface DraggableCargoProps {
  item: CargoItem;
  isSelected: boolean;
  onSelect: (item: CargoItem) => void;
  onDragStart: (e: React.DragEvent, item: CargoItem) => void;
  onDragEnd?: (e: React.DragEvent, item: CargoItem) => void;
}

export const DraggableCargo: React.FC<DraggableCargoProps> = ({
  item,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
}) => {
  const [copied, setCopied] = useState(false);

  const uldMeta = useMemo(() => {
    const deck = item.preferredDeck;
    const doorShort =
      item.compatibleDoors.includes('NOSE') && item.compatibleDoors.includes('SIDE')
        ? 'N/S'
        : item.compatibleDoors.includes('LOWER_FWD') && item.compatibleDoors.includes('LOWER_AFT')
          ? 'F/A'
          : item.compatibleDoors.join('/');
    const flags = item.handlingFlags.length > 0 ? ` • ${item.handlingFlags.join(',')}` : '';
    return `${item.uldType} • ${deck} • Doors ${doorShort}${flags}`;
  }, [item.preferredDeck, item.uldType, item.compatibleDoors, item.handlingFlags]);

  const handleCopyId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      // no-op (clipboard may be blocked)
    }
  };

  return (
    <div 
      draggable 
      onDragStart={(e) => onDragStart(e, item)}
      onDragEnd={(e) => onDragEnd?.(e, item)}
      onClick={() => onSelect(item)}
      className={`
        relative flex-shrink-0 w-32 rounded-lg border-2 cursor-grab active:cursor-grabbing 
        hover:scale-[1.03] transition-all select-none shadow-lg overflow-hidden
        bg-gradient-to-b from-slate-800 to-slate-900
        ${isSelected 
          ? 'ring-2 ring-blue-400 border-blue-500 shadow-blue-500/20' 
          : 'border-slate-700 hover:border-slate-500'
        }
      `}
      style={{ touchAction: 'none' }} // Better touch handling for iPad
    >
      {/* MUST GO marker (set in Inspector) */}
      {item.mustFly && (
        <div className="absolute right-0 top-0 z-20">
          {/* corner flap */}
          <div className="w-0 h-0 border-t-[22px] border-t-red-500 border-l-[22px] border-l-transparent" />
          {/* star */}
          <Star
            size={12}
            className="absolute right-[3px] top-[3px] text-white"
            fill="currentColor"
          />
        </div>
      )}

      {/* Vertical material strip (color-coded, full label) */}
      <div className={`absolute left-0 top-0 bottom-0 w-6 ${item.type.color} border-r border-white/10`}>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90">
          <span className="text-[10px] font-black tracking-widest text-white whitespace-nowrap">
            {item.type.label.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div className="pl-7 pr-2 py-2">
        {/* Destination */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg leading-none">{item.dest.flag}</span>
          <span className="tracking-widest font-extrabold text-white text-[12px]">{item.dest.code}</span>
        </div>

        {/* ULD ID (click to copy) */}
        <button
          type="button"
          onClick={handleCopyId}
          className="w-full flex items-center justify-center gap-1 text-[9px] font-mono text-slate-400 hover:text-slate-200 mt-1"
          title="Click to copy ULD ID"
        >
          <span className="truncate max-w-[92px]">{item.id}</span>
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-slate-500" />}
        </button>

        {/* Weight row (icon beside tonnes) */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <Package className={`w-4 h-4 ${item.type.color.replace('bg-', 'text-')}`} />
          <div className="flex items-baseline gap-1">
            <span className="font-mono font-black text-white text-lg leading-none tabular-nums">
              {(item.weight / 1000).toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-500 font-bold">t</span>
          </div>
        </div>

        {/* Ops meta (two columns, compact) */}
        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-slate-400 font-mono">
          <div className="truncate">{item.uldType} • {item.preferredDeck}</div>
          <div className="truncate">{item.compatibleDoors.length ? item.compatibleDoors.join('/') : 'Doors —'}</div>
          <div className="truncate">{item.compatibleDoors.includes('NOSE') && item.compatibleDoors.includes('SIDE') ? 'N/S' : item.compatibleDoors.includes('LOWER_FWD') && item.compatibleDoors.includes('LOWER_AFT') ? 'F/A' : ''}</div>
          <div className="truncate">{item.handlingFlags.length ? item.handlingFlags.join(',') : '—'}</div>
        </div>

        {/* Optional one-line summary (kept short) */}
        <div className="mt-1 text-[9px] text-slate-500 font-bold text-center line-clamp-1">
          {uldMeta}
        </div>
      </div>
    </div>
  );
};
