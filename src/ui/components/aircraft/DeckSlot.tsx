/**
 * DeckSlot Component
 * 
 * Represents a single cargo position on the aircraft deck.
 * Shows destination code and weight when loaded.
 * Touch-friendly for iPad use.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { LoadedPosition, CargoItem } from '@core/types';
import { useSettingsStore } from '@core/settings';
import { getCargoVisual, getHandlingBadges } from '@/ui/utils/cargoVisual';
import { checkCargoPlacement } from '@core/uld';

interface DeckSlotProps {
  position: LoadedPosition;
  /** Optional UI label override (per tail / per operator convention) */
  displayLabel?: string;
  isActive: boolean;
  isDragging: boolean;
  dragItem?: CargoItem | null;
  onDragEnd?: () => void;
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
  displayLabel,
  isActive,
  isDragging,
  dragItem = null,
  onDragEnd,
  onClick,
  onDragStart,
  onDrop,
  sizeVariant = 'normal',
  onLongPressRearrangeStart,
  isRearrangeSource = false,
  isRearrangeOver = false,
}) => {
  const [hoverDrop, setHoverDrop] = useState<'valid' | 'invalid' | null>(null);
  const hoverRef = useRef<'valid' | 'invalid' | null>(null);
  const dragEnterDepth = useRef(0);
  const content = position.content;
  const cargoColorMode = useSettingsStore((s) => s.settings.display.cargoColorMode);
  const visual = content ? getCargoVisual(content, cargoColorMode) : null;
  const badges = content ? getHandlingBadges(content) : [];
  const longPressTimer = useRef<number | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const didLongPress = useRef(false);
  const suppressClick = useRef(false);
  const isFinePointer = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(pointer: fine)').matches;

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        window.clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };
  }, []);

  const setHoverStable = (next: 'valid' | 'invalid' | null) => {
    if (hoverRef.current === next) return;
    hoverRef.current = next;
    setHoverDrop(next);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragging || !dragItem) return;
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch {
      // no-op
    }
    dragEnterDepth.current += 1;
    const chk = checkCargoPlacement(dragItem, position);
    setHoverStable(chk.ok ? 'valid' : 'invalid');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Robust flicker prevention: dragleave can fire when moving over children; use depth counter.
    dragEnterDepth.current = Math.max(0, dragEnterDepth.current - 1);
    if (dragEnterDepth.current === 0) setHoverStable(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Some browsers fire dragenter/dragleave in a noisy way; keep the hover state stable here too.
    if (!isDragging || !dragItem) return;
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch {
      // no-op
    }
    const chk = checkCargoPlacement(dragItem, position);
    setHoverStable(chk.ok ? 'valid' : 'invalid');
  };
  
  const handleDrop = (e: React.DragEvent) => { 
    e.preventDefault(); 
    dragEnterDepth.current = 0;
    setHoverStable(null);
    onDrop(position.id); 
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!content) return;
    // Ensure cross-browser DnD works (some browsers require dataTransfer payload).
    try {
      const img = new Image();
      img.src =
        'data:image/svg+xml;base64,' +
        btoa('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>');
      e.dataTransfer.setDragImage(img, 0, 0);
      e.dataTransfer.setData('text/plain', content.id);
      e.dataTransfer.effectAllowed = 'move';
    } catch {
      // no-op
    }
    onDragStart(content, position.id);
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

    // Prevent native iOS/Safari “drag”/callout behavior from stealing the gesture.
    // Our rearrange is pointer-driven (not HTML5 DnD).
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // no-op
    }

    didLongPress.current = false;
    suppressClick.current = false;
    pointerStart.current = { x: e.clientX, y: e.clientY };

    clearLongPress();
    const delayMs = e.pointerType === 'mouse' ? 180 : 350;
    longPressTimer.current = window.setTimeout(() => {
      didLongPress.current = true;
      suppressClick.current = true;
      onLongPressRearrangeStart(content, position.id, e.pointerId, e.clientX, e.clientY);
    }, delayMs);
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
  let hoverClass = "";

  if (hoverDrop === 'valid') {
    // Show hover glow even if the slot is already loaded (swap target).
    hoverClass = "ring-4 ring-emerald-500/45 outline outline-2 outline-emerald-200/50 border-emerald-400 border-2 z-50 scale-110 shadow-[0_0_20px_rgba(16,185,129,0.75)]";
    if (!content) bgClass = "bg-emerald-900/70 border-emerald-400 border-2";
  } else if (hoverDrop === 'invalid') {
    hoverClass = "ring-4 ring-red-500/35 outline outline-2 outline-red-200/40 border-red-400 border-2 z-50 scale-110 shadow-[0_0_18px_rgba(239,68,68,0.65)]";
    if (!content) bgClass = "bg-red-900/60 border-red-400 border-2";
  } else if (isDragging && !content) {
    bgClass = "bg-blue-900/10 border-blue-500/30 border-dashed";
  }

  // When loaded, show destination color
  if (content) {
    bgClass = `${visual?.bg ?? content.type.color} border-white/20 text-white shadow-lg border-solid`;
  }

  // Rearrange visuals (drag-over + wiggle)
  if (isRearrangeOver && !content) {
    bgClass = "bg-violet-500/20 border-violet-400 border-2 ring-4 ring-violet-500/30 z-50 scale-110 transition-all duration-150 shadow-[0_0_16px_rgba(139,92,246,0.6)]";
  }
  if (isRearrangeSource && content) {
    bgClass += " lm-wiggle ring-2 ring-violet-300/70 opacity-60";
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
      // On coarse pointers (iPad/touch), HTML5 drag causes the “vibrate + fist” native drag mode
      // but doesn't reliably move between slots. We disable native DnD and use long-press rearrange.
      draggable={!!content && isFinePointer}
      onDragStart={handleDragStart}
      onDragEnd={() => onDragEnd?.()}
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
      onContextMenu={(e) => {
        // Avoid long-press context menu interfering with rearrange on touch devices.
        e.preventDefault();
      }}
      className={`
        relative w-full ${heightClass} rounded-md border flex flex-col items-center justify-center 
        transition-all select-none touch-manipulation
        ${content ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        ${bgClass} ${hoverClass}
      `}
      style={{
        touchAction: 'none',
        // Safari: helps make DIV dragging reliable.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...( { WebkitUserDrag: content ? 'element' : 'none' } as any ),
      }}
    >
      {content ? (
        <div className="relative w-full h-full pointer-events-none">
          {/* Destination (move higher) */}
          <div className="absolute top-0 left-0 right-0 flex justify-center leading-none">
            <span className="mt-[0px] text-[10px] font-black tracking-wider text-white/95">
              {content.dest.code}
            </span>
          </div>

          {/* Weight (move higher) */}
          <div className="absolute top-[12px] left-0 right-0 flex flex-col items-center leading-none">
            <span className="text-[10px] font-black font-mono tabular-nums whitespace-nowrap text-white">
              {Math.round(content.weight)}
            </span>
            <span className="mt-[0px] text-[7px] font-black opacity-85 leading-none text-white/80">kg</span>
          </div>

          {/* Bottom strip: Type (left) | Flags (right) — no padding/margins */}
          <div className="absolute bottom-[-1px] left-0 right-0 h-[12px] flex items-stretch">
            <div className="w-1/2 flex items-center justify-start overflow-hidden">
              <span className="text-[6px] font-black opacity-95 uppercase leading-none text-white/90 truncate">
                {cargoColorMode === 'uld' ? content.uldType : content.type.code}
              </span>
            </div>
            <div className="w-px bg-white/15" />
            <div className="w-1/2 flex items-center justify-end overflow-hidden">
              <span className="text-[6px] font-black text-white/95 leading-none uppercase truncate">
                {badges.length
                  ? badges
                      .slice(0, 2)
                      .map((b) => (b === 'MAIL' ? 'MAI' : b))
                      .join('')
                  : ''}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <span className="text-[9px] text-slate-400 font-mono font-bold -mt-[2px]">
          {displayLabel ?? position.id}
        </span>
      )}
    </div>
  );
};
