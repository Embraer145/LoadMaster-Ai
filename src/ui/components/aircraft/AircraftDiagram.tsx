/**
 * AircraftDiagram Component
 * 
 * Visual representation of B747-400F cargo positions with door labels.
 * 
 * ORIENTATION (Plan View - Looking Down):
 * - NOSE on LEFT, TAIL on RIGHT
 * - TOP row = RIGHT / STARBOARD side (R positions) when facing nose
 * - BOTTOM row = LEFT / PORT side (L positions) when facing nose
 * 
 * B747-400F CARGO DOORS:
 * - Nose Cargo Door: Front of aircraft, opens upward
 * - Main Deck Side Cargo Door: LEFT (Port) side, between positions G-H
 * - Lower Deck FWD Door: RIGHT (Starboard) side
 * - Lower Deck AFT Door: RIGHT (Starboard) side
 * - Bulk Cargo Door: RIGHT (Starboard) side, aft
 */

import React from 'react';
import { DoorOpen } from 'lucide-react';
import type { LoadedPosition, CargoItem, DragState, SelectionState } from '@core/types';
import { DeckSlot } from './DeckSlot';

// Door styling: use a single dedicated color that does NOT collide with cargo/material type colors.
// (Avoid blue/cyan/amber/red/green which are already used elsewhere.)
const DOOR = {
  bg: 'bg-violet-500/10',
  border: 'border-violet-500/30',
  text: 'text-violet-300',
  pillBg: 'bg-violet-500',
  line: 'bg-violet-500',
};

interface AircraftDiagramProps {
  positions: LoadedPosition[];
  selection: SelectionState;
  drag: DragState;
  flight: { registration: string; flightNumber: string } | null;
  onSelectPosition: (id: string) => void;
  onDragStart: (item: CargoItem, positionId: string) => void;
  onDrop: (positionId: string) => void;
}

export const AircraftDiagram: React.FC<AircraftDiagramProps> = ({
  positions,
  selection,
  drag,
  flight,
  onSelectPosition,
  onDragStart,
  onDrop,
}) => {
  const getPosition = (id: string) => positions.find(p => p.id === id)!;

  const renderSlot = (id: string) => (
    <DeckSlot 
      position={getPosition(id)} 
      isActive={selection.id === id && selection.source === 'slot'} 
      isDragging={!!drag.item}
      onClick={() => onSelectPosition(id)} 
      onDragStart={(item) => onDragStart(item, id)} 
      onDrop={onDrop} 
    />
  );

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 relative shadow-2xl overflow-x-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter text-slate-700">
            BOEING 747-400F
          </h2>
          <span className="text-xs font-mono text-slate-500">
            {flight ? `${flight.registration} • ${flight.flightNumber}` : 'NO FLIGHT SELECTED'}
          </span>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px]">
          <div className={`flex items-center gap-1.5 px-2 py-1 ${DOOR.bg} border ${DOOR.border} rounded`}>
            <DoorOpen size={12} className={DOOR.text} />
            <span className={`${DOOR.text} font-bold`}>CARGO DOOR</span>
          </div>
          <div className="text-slate-500">NOSE ← → TAIL</div>
        </div>
      </div>

      {/* ============ MAIN DECK ============ */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase">Main Deck</h3>
          <span className="text-[10px] text-slate-600">• 33 positions • PMC/P6P pallets</span>
        </div>
        
        <div className="relative inline-block">
          
          {/* Nose Door Label */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
            <div className={`px-2 py-0.5 ${DOOR.pillBg} text-white text-[8px] font-bold rounded whitespace-nowrap flex items-center gap-1`}>
              <DoorOpen size={10} /> NOSE
            </div>
            <div className={`w-3 h-0.5 ${DOOR.line}`}></div>
          </div>

          {/* Aircraft Outline */}
          <div className="bg-slate-800/30 border-2 border-slate-700 rounded-l-[60px] rounded-r-[30px] p-4 pb-10">
            {/* Side labels */}
            <div className="flex justify-between text-[8px] text-slate-500 font-bold mb-2">
              <span>NOSE ←</span>
              <span className="text-slate-600">STARBOARD (R) - Top row</span>
              <span>→ TAIL</span>
            </div>
            
            {/* Main Deck Layout - Two rows with nose section inline */}
            <div className="flex flex-col gap-1">
              {/* RIGHT (Starboard) Row - Top */}
              <div className="flex items-center gap-0.5">
                {/* Nose - A2 on starboard */}
                <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded`}>
                  <div className="w-9">{renderSlot('A2')}</div>
                </div>
                
                {/* Forward section C-F */}
                <div className="flex gap-0.5 p-1 bg-slate-800/50 rounded ml-1">
                  {['C', 'D', 'E', 'F'].map(row => (
                    <div key={row} className="w-9 relative">
                      {renderSlot(`${row}R`)}
                      <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[7px] text-slate-600">{row}</span>
                    </div>
                  ))}
                </div>
                
                {/* G-K section - NOT highlighted on starboard */}
                <div className="flex gap-0.5 p-1 bg-slate-800/50 rounded mx-1">
                  {['G', 'H', 'J', 'K'].map(row => (
                    <div key={row} className="w-9 relative">
                      {renderSlot(`${row}R`)}
                      <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[7px] text-slate-600">{row}</span>
                    </div>
                  ))}
                </div>
                
                {/* Aft section L-S */}
                <div className="flex gap-0.5 p-1 bg-slate-800/50 rounded">
                  {['L', 'M', 'P', 'Q', 'R', 'S'].map(row => (
                    <div key={row} className="w-9 relative">
                      {renderSlot(`${row}R`)}
                      <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[7px] text-slate-600">{row}</span>
                    </div>
                  ))}
                </div>
                
                {/* Tail spacer */}
                <div className="w-9 opacity-0 ml-1"></div>
              </div>
              
              {/* Center aisle with B1 position */}
              <div className="flex items-center">
                {/* B1 in the nose area (centered between rows) */}
                <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded`}>
                  <div className="w-9">{renderSlot('B1')}</div>
                </div>
                
                {/* Aisle indicator */}
                <div className="flex-1 flex items-center justify-center ml-1">
                  <div className="flex-1 border-t border-dashed border-slate-700"></div>
                  <span className="px-2 text-[7px] text-slate-600">AISLE</span>
                  <div className="flex-1 border-t border-dashed border-slate-700"></div>
                </div>
              </div>
              
              {/* LEFT (Port) Row - Bottom */}
              <div className="flex items-center gap-0.5">
                {/* Nose - A1 on port */}
                <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded`}>
                  <div className="w-9">{renderSlot('A1')}</div>
                </div>
                
                {/* Forward section C-F */}
                <div className="flex gap-0.5 p-1 bg-slate-800/50 rounded ml-1">
                  {['C', 'D', 'E', 'F'].map(row => (
                    <div key={row} className="w-9">
                      {renderSlot(`${row}L`)}
                    </div>
                  ))}
                </div>
                
                {/* Door zone G-K - highlighted on PORT side + anchored door label */}
                <div className="relative mx-1">
                  <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded`}>
                    {['G', 'H', 'J', 'K'].map(row => (
                      <div key={row} className="w-9">
                        {renderSlot(`${row}L`)}
                      </div>
                    ))}
                  </div>
                  <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1">
                    <div className={`w-0.5 h-4 ${DOOR.line}`}></div>
                    <div className={`px-2 py-0.5 ${DOOR.pillBg} text-white text-[8px] font-bold rounded whitespace-nowrap flex items-center gap-1`}>
                      <DoorOpen size={10} /> SIDE CARGO DOOR (L)
                    </div>
                  </div>
                </div>
                
                {/* Aft section L-S */}
                <div className="flex gap-0.5 p-1 bg-slate-800/50 rounded">
                  {['L', 'M', 'P', 'Q', 'R', 'S'].map(row => (
                    <div key={row} className="w-9">
                      {renderSlot(`${row}L`)}
                    </div>
                  ))}
                </div>
                
                {/* Tail */}
                <div className="flex gap-0.5 p-1 bg-slate-800/50 rounded ml-1">
                  <div className="w-9">{renderSlot('T')}</div>
                </div>
              </div>
            </div>
            
            {/* Bottom side label */}
            <div className="text-[8px] text-slate-600 font-bold mt-2 text-center">
              PORT (L) - Bottom row
            </div>
          </div>
        </div>
      </div>

      {/* ============ LOWER DECK ============ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase">Lower Deck (Belly)</h3>
          <span className="text-[10px] text-slate-600">• 11 positions • LD3/LD1 containers</span>
        </div>
        
        <div className="relative inline-block">

          {/* Aircraft Outline */}
          <div className="bg-slate-800/30 border-2 border-slate-700 rounded-l-[40px] rounded-r-[20px] p-3 pb-6">
            <div className="flex items-center gap-3">
              {/* Forward Hold - door on starboard */}
              <div className="relative flex flex-col">
                <span className="text-[8px] text-slate-500 mb-1">FWD HOLD</span>
                <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded`}>
                  {['11P', '12P'].map(id => (
                    <div key={id} className="w-9">
                      {renderSlot(id)}
                    </div>
                  ))}
                </div>
                <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded mt-0.5`}>
                  {['21P', '22P', '23P'].map(id => (
                    <div key={id} className="w-9">
                      {renderSlot(id)}
                    </div>
                  ))}
                </div>
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1">
                  <div className={`w-0.5 h-4 ${DOOR.line}`}></div>
                  <div className={`px-2 py-0.5 ${DOOR.pillBg} text-white text-[8px] font-bold rounded whitespace-nowrap flex items-center gap-1`}>
                    <DoorOpen size={10} /> FWD CARGO DOOR (R)
                  </div>
                </div>
              </div>

              {/* Wing Box - no cargo */}
              <div className="w-20 h-16 border border-slate-600 bg-slate-900/50 rounded flex items-center justify-center">
                <span className="text-[8px] text-slate-600 font-bold text-center">WING<br/>BOX</span>
              </div>

              {/* Aft Hold - door on starboard */}
              <div className="relative flex flex-col">
                <span className="text-[8px] text-slate-500 mb-1">AFT HOLD</span>
                <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded`}>
                  {['31P', '32P'].map(id => (
                    <div key={id} className="w-9">
                      {renderSlot(id)}
                    </div>
                  ))}
                </div>
                <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded mt-0.5`}>
                  {['41P', '42P'].map(id => (
                    <div key={id} className="w-9">
                      {renderSlot(id)}
                    </div>
                  ))}
                </div>
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1">
                  <div className={`w-0.5 h-4 ${DOOR.line}`}></div>
                  <div className={`px-2 py-0.5 ${DOOR.pillBg} text-white text-[8px] font-bold rounded whitespace-nowrap flex items-center gap-1`}>
                    <DoorOpen size={10} /> AFT CARGO DOOR (R)
                  </div>
                </div>
              </div>

              {/* Bulk Cargo */}
              <div className="relative flex flex-col">
                <span className="text-[8px] text-slate-500 mb-1">BULK</span>
                <div className={`flex gap-0.5 p-1 ${DOOR.bg} border ${DOOR.border} rounded`}>
                  {['52', '53'].map(id => (
                    <div key={id} className="w-8">
                      {renderSlot(id)}
                    </div>
                  ))}
                </div>
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1">
                  <div className={`w-0.5 h-4 ${DOOR.line}`}></div>
                  <div className={`px-2 py-0.5 ${DOOR.pillBg} text-white text-[8px] font-bold rounded whitespace-nowrap flex items-center gap-1`}>
                    <DoorOpen size={10} /> BULK (R)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Orientation Reference */}
      <div className="mt-4 p-2 bg-slate-800/30 rounded border border-slate-700 text-[9px] text-slate-500">
        <div className="flex items-center justify-between">
          <span><strong>View:</strong> Plan (looking down) | <strong>Nose:</strong> Left | <strong>Tail:</strong> Right</span>
          <span><strong>Top row (R):</strong> Starboard (right when facing nose) | <strong>Bottom row (L):</strong> Port (left when facing nose)</span>
        </div>
      </div>
    </div>
  );
};
