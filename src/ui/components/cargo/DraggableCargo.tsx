/**
 * DraggableCargo Component
 * 
 * A draggable cargo item displayed in the warehouse staging area.
 * Shows destination prominently for unload planning.
 * Touch-friendly for iPad use.
 */

import React, { useMemo, useState } from 'react';
import { Copy, Check, Star } from 'lucide-react';
import type { CargoItem } from '@core/types';
import { useSettingsStore } from '@core/settings';
import { getCargoVisual, getHandlingBadges } from '@/ui/utils/cargoVisual';

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
  const cargoColorMode = useSettingsStore((s) => s.settings.display.cargoColorMode);
  const visual = useMemo(() => getCargoVisual(item, cargoColorMode), [item, cargoColorMode]);
  const badges = useMemo(() => getHandlingBadges(item), [item]);

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

  // Warehouse card height: keep labels readable but hint at real-world build height.
  // We clamp to a small range to avoid layout chaos.
  const cardHeightPx = useMemo(() => {
    const h = typeof item.heightIn === 'number' && Number.isFinite(item.heightIn) ? item.heightIn : null;
    // Baselines chosen to keep internal labels from getting cramped.
    if (item.uldType === 'PMC' || item.uldType === 'P6P') {
      if (h == null) return 168;
      if (h <= 96) return 160;
      if (h <= 118) return 176;
      return 190;
    }
    if (item.uldType === 'LD1' || item.uldType === 'LD3') {
      if (h == null) return 156;
      if (h <= 64) return 150;
      return 164;
    }
    return 160;
  }, [item.heightIn, item.uldType]);

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
      style={{ touchAction: 'none', height: cardHeightPx }} // Better touch handling for iPad
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
      <div className={`absolute left-0 top-0 bottom-0 w-6 ${visual.bg} border-r border-white/10`}>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90">
          <span className="text-[10px] font-black tracking-widest text-white whitespace-nowrap">
            {visual.stripLabel}
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div className="absolute inset-0 pl-7 pr-2 pt-2 pb-5 flex flex-col justify-end">
        {/* Destination */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg leading-none">{item.dest.flag}</span>
          <span className="tracking-widest font-extrabold text-white text-[12px]">{item.dest.code}</span>
        </div>

        {/* ULD ID (click to copy) */}
        <button
          type="button"
          onClick={handleCopyId}
          className="w-full flex items-center justify-center gap-1 text-[11px] font-mono font-black text-slate-200 hover:text-white mt-1"
          title="Click to copy ULD ID"
        >
          <span className="truncate max-w-[108px]">{item.id}</span>
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-slate-500" />}
        </button>

        {/* Weight row (kg, full value) */}
        <div className="mt-2 flex items-center justify-center">
          <div className="flex items-baseline gap-1">
            <span className="font-mono font-black text-white text-[16px] leading-none tabular-nums">
              {Math.round(item.weight).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 font-bold">kg</span>
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

      {/* Handling classifications (DG/PER/PRI/MAIL) – hug bottom-right corner */}
      {badges.length > 0 && (
        <div className="absolute bottom-0 right-0 flex items-end gap-1 pointer-events-none">
          {badges.map((b) => (
            <span
              key={b}
              className="px-1.5 py-0.5 bg-slate-950/70 border border-white/10 text-[9px] font-black text-white leading-none"
              title="Handling flag"
            >
              {b}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
