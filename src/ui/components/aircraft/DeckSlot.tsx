/**
 * DeckSlot Component
 * 
 * Represents a single cargo position on the aircraft deck.
 * Shows destination code and weight when loaded.
 * Touch-friendly for iPad use.
 */

import React, { useState } from 'react';
import type { LoadedPosition, CargoItem } from '@core/types';

interface DeckSlotProps {
  position: LoadedPosition;
  isActive: boolean;
  isDragging: boolean;
  onClick: () => void;
  onDragStart: (item: CargoItem, positionId: string) => void;
  onDrop: (positionId: string) => void;
}

export const DeckSlot: React.FC<DeckSlotProps> = ({
  position,
  isActive,
  isDragging,
  onClick,
  onDragStart,
  onDrop,
}) => {
  const [isOver, setIsOver] = useState(false);
  const content = position.content;

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (isDragging && !content) setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent) => { 
    e.preventDefault(); 
    setIsOver(false);
    onDrop(position.id); 
  };

  const handleDragStart = () => {
    if (content) {
      onDragStart(content, position.id);
    }
  };
  
  // Build class names based on state
  let bgClass = "bg-slate-800/50 border-slate-700/50";
  
  if (isOver) {
    bgClass = "bg-emerald-900/80 border-emerald-400 border-2 ring-4 ring-emerald-500/50 z-50 scale-110 transition-all duration-150 shadow-[0_0_20px_rgba(16,185,129,0.8)]";
  } else if (isDragging && !content) {
    bgClass = "bg-blue-900/10 border-blue-500/30 border-dashed";
  }

  // When loaded, show destination color
  if (content) {
    bgClass = `${content.type.color} border-white/20 text-white shadow-lg border-solid`;
  }
  
  if (isActive) {
    bgClass += " ring-2 ring-white ring-offset-1 ring-offset-slate-900 z-20 scale-105";
  }

  const heightClass = position.deck === 'MAIN' ? 'h-14' : 'h-12';

  return (
    <div 
      onClick={onClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative w-full ${heightClass} rounded-md border flex flex-col items-center justify-center 
        transition-all cursor-pointer select-none touch-manipulation
        ${bgClass}
      `}
      style={{ touchAction: 'none' }}
    >
      {content ? (
        <div 
          draggable 
          onDragStart={handleDragStart}
          className="w-full h-full flex flex-col items-center justify-center p-0.5"
        >
          {/* Destination Code - Top */}
          <div className="flex items-center gap-0.5 leading-none">
            <span className="text-[9px]">{content.dest.flag}</span>
            <span className="text-[9px] font-bold tracking-wide opacity-90">
              {content.dest.code}
            </span>
          </div>
          
          {/* Weight - Center */}
          <span className="text-sm font-bold font-mono leading-tight">
            {(content.weight / 1000).toFixed(1)}
          </span>
          
          {/* Type Code - Bottom */}
          <span className="text-[7px] font-medium opacity-75 uppercase">
            {content.type.code}
          </span>
        </div>
      ) : (
        <span className="text-[9px] text-slate-600 font-mono font-medium">{position.id}</span>
      )}
    </div>
  );
};
