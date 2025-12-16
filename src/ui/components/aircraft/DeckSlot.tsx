/**
 * DeckSlot Component
 * 
 * Represents a single cargo position on the aircraft deck.
 * Shows destination code and weight when loaded.
 * Touch-friendly for iPad use.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { LoadedPosition, CargoItem } from '@core/types';

interface DeckSlotProps {
  position: LoadedPosition;
  isActive: boolean;
  isDragging: boolean;
  onClick: () => void;
  onDragStart: (item: CargoItem, positionId: string) => void;
  onDrop: (positionId: string) => void;
  /** Visual size variant (used to slim down special positions like B1/aisle) */
  sizeVariant?: 'normal' | 'compact';
  /** iPad-friendly long-press rearrange (pointer events) */
  onLongPressRearrangeStart?: (
    item: CargoItem,
    positionId: string,
    pointerId: number,
    clientX: number,
    clientY: number
  ) => void;
  isRearrangeSource?: boolean;
  isRearrangeOver?: boolean;
}

export const DeckSlot: React.FC<DeckSlotProps> = ({
  position,
  isActive,
  isDragging,
  onClick,
  onDragStart,
  onDrop,
  sizeVariant = 'normal',
  onLongPressRearrangeStart,
  isRearrangeSource = false,
  isRearrangeOver = false,
}) => {
  const [isOver, setIsOver] = useState(false);
  const content = position.content;
  const longPressTimer = useRef<number | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const didLongPress = useRef(false);
  const suppressClick = useRef(false);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        window.clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };
  }, []);

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

  const clearLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!content) return;
    if (!onLongPressRearrangeStart) return;
    // Long-press is primarily for touch/pen devices (iPad)
    if (e.pointerType === 'mouse') return;

    didLongPress.current = false;
    suppressClick.current = false;
    pointerStart.current = { x: e.clientX, y: e.clientY };

    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      didLongPress.current = true;
      suppressClick.current = true;
      onLongPressRearrangeStart(content, position.id, e.pointerId, e.clientX, e.clientY);
    }, 350);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStart.current) return;
    if (!longPressTimer.current) return;

    const dx = Math.abs(e.clientX - pointerStart.current.x);
    const dy = Math.abs(e.clientY - pointerStart.current.y);
    if (dx + dy > 10) {
      // treat as scroll/gesture -> cancel long press
      clearLongPress();
    }
  };

  const handlePointerUp = () => {
    clearLongPress();
    pointerStart.current = null;
    didLongPress.current = false;
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

  // Rearrange visuals (drag-over + wiggle)
  if (isRearrangeOver && !content) {
    bgClass = "bg-violet-500/20 border-violet-400 border-2 ring-4 ring-violet-500/30 z-50 scale-110 transition-all duration-150 shadow-[0_0_16px_rgba(139,92,246,0.6)]";
  }
  if (isRearrangeSource && content) {
    bgClass += " lm-wiggle ring-2 ring-violet-300/70";
  }
  
  if (isActive) {
    bgClass += " ring-2 ring-white ring-offset-1 ring-offset-slate-900 z-20 scale-105";
  }

  const heightClass =
    sizeVariant === 'compact'
      ? (position.deck === 'MAIN' ? 'h-10' : 'h-10')
      : (position.deck === 'MAIN' ? 'h-14' : 'h-12');

  return (
    <div 
      data-position-id={position.id}
      onClick={() => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        onClick();
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
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
