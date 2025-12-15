/**
 * DraggableCargo Component
 * 
 * A draggable cargo item displayed in the warehouse staging area.
 * Shows destination prominently for unload planning.
 * Touch-friendly for iPad use.
 */

import React from 'react';
import { Package } from 'lucide-react';
import type { CargoItem } from '@core/types';

interface DraggableCargoProps {
  item: CargoItem;
  isSelected: boolean;
  onSelect: (item: CargoItem) => void;
  onDragStart: (e: React.DragEvent, item: CargoItem) => void;
}

export const DraggableCargo: React.FC<DraggableCargoProps> = ({
  item,
  isSelected,
  onSelect,
  onDragStart,
}) => {
  return (
    <div 
      draggable 
      onDragStart={(e) => onDragStart(e, item)}
      onClick={() => onSelect(item)}
      className={`
        flex-shrink-0 w-28 rounded-lg border-2 cursor-grab active:cursor-grabbing 
        hover:scale-105 transition-all select-none shadow-lg
        bg-gradient-to-b from-slate-800 to-slate-900
        ${isSelected 
          ? 'ring-2 ring-blue-400 border-blue-500 shadow-blue-500/20' 
          : 'border-slate-700 hover:border-slate-500'
        }
      `}
      style={{ touchAction: 'none' }} // Better touch handling for iPad
    >
      {/* Destination Badge - Prominent at top */}
      <div className={`
        px-2 py-1.5 rounded-t-md text-center font-bold text-xs
        ${item.type.color} text-white
      `}>
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-base">{item.dest.flag}</span>
          <span className="tracking-wider">{item.dest.code}</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-2 pt-1.5">
        {/* ULD ID */}
        <div className="text-[9px] font-mono text-slate-500 text-center mb-1">
          {item.id}
        </div>
        
        {/* Weight - Large and centered */}
        <div className="flex flex-col items-center justify-center py-1">
          <Package className={`w-4 h-4 mb-0.5 ${item.type.color.replace('bg-', 'text-')}`} />
          <span className="font-mono font-bold text-white text-lg leading-none">
            {(item.weight / 1000).toFixed(1)}
          </span>
          <span className="text-[9px] text-slate-500 uppercase">tonnes</span>
        </div>
        
        {/* Type Badge */}
        <div className={`
          text-[8px] text-center uppercase font-bold mt-1 px-1.5 py-0.5 rounded
          ${item.type.color} text-white
        `}>
          {item.type.code}
        </div>
      </div>
    </div>
  );
};
