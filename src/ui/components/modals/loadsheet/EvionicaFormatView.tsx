/**
 * EvionicaFormatView
 * 
 * Traditional text-based loadsheet format matching Evionica output.
 * Designed for easy transition and pilot familiarity.
 */

import React from 'react';
import type { AircraftConfig, LoadedPosition, PhysicsResult, FlightInfo } from '@core/types';
import { env } from '@/config/env';

interface EvionicaFormatViewProps {
  flight: FlightInfo | null;
  aircraftConfig: AircraftConfig;
  positions: LoadedPosition[];
  physics: PhysicsResult;
  blockFuelKg: number;
  taxiFuelKg: number;
  tripBurnKg: number;
  ballastFuelKg: number;
  crewCount: number;
  crewWeightKg: number;
  serviceAdjustmentsKg: number;
  operatorCode?: string;
}

export const EvionicaFormatView: React.FC<EvionicaFormatViewProps> = ({
  flight,
  aircraftConfig,
  positions,
  physics,
  blockFuelKg,
  taxiFuelKg,
  tripBurnKg,
  ballastFuelKg,
  crewCount,
  crewWeightKg,
  serviceAdjustmentsKg,
  operatorCode: _operatorCode = 'WGA',
}) => {
  // Calculate cargo totals
  const cargoWeight = positions.reduce((sum, p) => sum + (p.content?.weight ?? 0), 0);
  
  // Calculate weights for Evionica format
  const basicOperationalWeight = aircraftConfig.limits.OEW;
  const additionalCrewWeight = crewWeightKg; // Already calculated in parent
  const dryOperatingWeight = basicOperationalWeight + additionalCrewWeight + serviceAdjustmentsKg + ballastFuelKg;
  const totalTrafficLoad = cargoWeight;
  const zeroFuelWeightActual = physics.zfw;
  const taxiFuel = taxiFuelKg;
  const takeoffFuel = Math.max(0, blockFuelKg - taxiFuelKg);
  const taxiWeightActual = zeroFuelWeightActual + blockFuelKg;
  const takeoffWeightActual = physics.weight;
  const tripFuel = tripBurnKg;
  const landingWeightActual = physics.lw;
  
  // Balance indices (simplified - would need proper calculation in production)
  const balanceIndex = parseFloat((physics.towCG - 25).toFixed(2)); // BI relative to 25% MAC
  const lateralImbalance = physics.lateralImbalanceKg;
  const adjustment = 0; // ADJ - typically for manual corrections
  
  // Get max weights
  const maxZFW = aircraftConfig.limits.MZFW;
  const maxTOW = aircraftConfig.limits.MTOW;
  const maxLW = aircraftConfig.limits.MLW;
  
  // Calculate DOI (Dry Operating Index) - simplified
  const doi = parseFloat((dryOperatingWeight / 1000 - 160).toFixed(2));
  
  // Split positions into main deck and lower deck
  const mainDeckPositions = positions.filter(p => p.deck === 'MAIN').sort((a, b) => {
    const order = ['A1', 'A2', 'B1', 'CL', 'CR', 'DL', 'DR', 'EL', 'ER', 'FL', 'FR', 'GL', 'GR', 'HL', 'HR', 'JL', 'JR', 'KL', 'KR', 'LL', 'LR', 'ML', 'MR', 'PL', 'PR', 'QL', 'QR', 'RL', 'RR', 'SL', 'SR', 'T'];
    return order.indexOf(a.id) - order.indexOf(b.id);
  });
  
  const lowerDeckPositions = positions.filter(p => p.deck === 'LOWER').sort((a, b) => {
    const order = ['11P', '13L', '13R', '21P', '22P', '23P', '31L', '31R', '32L', '32R', '33L', '33R', '41L', '41R', '42L', '42R', '43L', '43R', '44L', '44R', '45L', '45R', 'H5'];
    return order.indexOf(a.id) - order.indexOf(b.id);
  });
  
  // Group main deck positions for side-by-side display
  const mainDeckGroups: Array<{left: LoadedPosition; right?: LoadedPosition}> = [];
  const leftPositions = mainDeckPositions.filter(p => p.id === 'A1' || p.id.endsWith('L'));
  const rightPositions = mainDeckPositions.filter(p => p.id === 'A2' || p.id.endsWith('R'));
  const centerPositions = mainDeckPositions.filter(p => !p.id.endsWith('L') && !p.id.endsWith('R') && p.id !== 'A1' && p.id !== 'A2');
  
  // Pair up positions
  for (let i = 0; i < Math.max(leftPositions.length, rightPositions.length, centerPositions.length); i++) {
    const left = leftPositions[i] || centerPositions[i];
    const right = rightPositions[i];
    if (left) {
      mainDeckGroups.push({ left, right });
    }
  }

  const route = flight
    ? `${flight.origin} ${flight.stopover ? `${flight.stopover} ` : ''}${flight.destination}`
    : '—';

  return (
    <div className="font-mono text-[10px] leading-[1.2] text-slate-900 print:text-black bg-white p-8 evionica-loadsheet">
      {/* Header Section */}
      <div className="mb-4 pb-2">
        <div className="text-[11px] font-bold mb-2">LOADSHEET               CHECKED                APPROVED            EDNO</div>
        <div className="text-[10px] mb-1">ALL WEIGHTS IN KILOGRAMS    L.Burns                                     1P</div>
        <div className="mt-2">
          <div className="grid grid-cols-[100px_80px_160px_auto] gap-x-4 text-[9px]">
            <div>FROM/TO</div>
            <div>FLIGHT</div>
            <div>A/C REG VERSION</div>
            <div>CREW    DATE         TIME</div>
          </div>
          
          <div className="grid grid-cols-[100px_80px_160px_auto] gap-x-4 font-bold">
            <div>{route}</div>
            <div>{flight?.flightNumber ?? 'LB001'}</div>
            <div>{flight?.registration ?? 'N-258SN'} Freighter</div>
            <div>{crewCount}/2  {flight?.date ? flight.date.split('-').reverse().join(' ') : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase().replace(/\./g, ' ')}  {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </div>

      {/* Captain's Information */}
      <div className="mb-3 text-[10px] leading-[1.3]">
        <div>                     WEIGHT</div>
        <div>LOAD IN COMPARTMENTS  {Math.round(cargoWeight)}</div>
      </div>

      <div className="mb-3 text-[10px] leading-[1.3]">
        <div className="font-bold">CAPTAINS INFORMATION/NOTES</div>
        <div>BI {balanceIndex.toFixed(2)}</div>
        <div>LATERAL IMBALANCE: L {Math.round(lateralImbalance)} / R {Math.round(lateralImbalance)} / DIFF {Math.round(lateralImbalance)}</div>
        <div>ADJ     {Math.round(adjustment)} KG {adjustment.toFixed(2)}  COMAT</div>
        <div>NOTOC: {flight?.notocRequired ? 'YES' : 'NO'}</div>
      </div>

      <div className="mb-3 text-[10px]">
        <div>SI</div>
        <div>VERSION {env.appVersion}</div>
        <div>NOT VALID FOR FLIGHT</div>
      </div>

      {/* Load Distribution Table */}
      <div className="mb-3">
        <div className="font-bold text-[10px] mb-1">DISTRIBUTION</div>
        
        <div className="grid grid-cols-[1fr_1fr] gap-x-8 text-[10px] leading-[1.3]">
          {/* Main Deck Column */}
          <div>
            <div className="mb-1">MAIN DECK                    LOWER DECK</div>
            {(() => {
              // Group main deck L/R pairs
              const grouped = new Map<string, {l: LoadedPosition | null, r: LoadedPosition | null}>();
              for (const p of mainDeckPositions) {
                const baseId = p.id.replace(/[LR]$/, '');
                const entry = grouped.get(baseId) || {l: null, r: null};
                if (p.id.endsWith('L')) entry.l = p;
                else if (p.id.endsWith('R')) entry.r = p;
                else {
                  // Centerline positions (A1, A2, B1, T)
                  entry.l = p;
                }
                grouped.set(baseId, entry);
              }
              
              // Create rows
              const sortOrder = ['A2', 'A1', 'B1', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'P', 'Q', 'R', 'S', 'T'];
              const sorted = Array.from(grouped.entries()).sort((a, b) => sortOrder.indexOf(a[0]) - sortOrder.indexOf(b[0]));
              
              return sorted.map(([baseId, {l, r}], idx) => {
                const lowerPos = lowerDeckPositions[idx];
                const leftWeight = l?.content?.weight ?? 0;
                const rightWeight = r?.content?.weight ?? 0;
                const lowerWeight = lowerPos?.content?.weight ?? 0;
                
                return (
                  <div key={baseId} className="grid grid-cols-[160px_1fr] gap-x-2">
                    <div className="grid grid-cols-[30px_45px_30px_45px] gap-x-1">
                      <span className="text-right">{l?.id ?? ''}</span>
                      <span className="text-right tabular-nums">{leftWeight || ''}</span>
                      <span className="text-right">{r?.id ?? ''}</span>
                      <span className="text-right tabular-nums">{rightWeight || ''}</span>
                    </div>
                    <div className="grid grid-cols-[40px_1fr] gap-x-1">
                      <span className="text-right">{lowerPos?.id ?? ''}</span>
                      <span className="text-right tabular-nums">{lowerWeight || ''}</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Weight Summary Section */}
      <div className="space-y-0 text-[10px] leading-[1.3] mb-3">
        <div>BASIC OPERATIONAL WEIGHT {Math.round(basicOperationalWeight)}</div>
        <div>*****************************</div>
        {additionalCrewWeight > 0 && <div>ADDITIONAL CREW                     {Math.round(additionalCrewWeight)}</div>}
        {serviceAdjustmentsKg > 0 && <div>SERVICE ADJUSTMENTS                  {Math.round(serviceAdjustmentsKg)}</div>}
        {ballastFuelKg > 0 && <div>BALLAST FUEL                         {Math.round(ballastFuelKg)}</div>}
        <div>DRY OPERATING WEIGHT       {Math.round(dryOperatingWeight)}</div>
        <div>*****************************</div>
        <div>TOTAL TRAFFIC LOAD         {Math.round(totalTrafficLoad)}</div>
        <div>ZERO FUEL WEIGHT ACTUAL {Math.round(zeroFuelWeightActual)} MAX {Math.round(maxZFW)}    ADJ</div>
        <div>*****************************</div>
        <div>TAXI FUEL                  {Math.round(taxiFuel)}</div>
        <div>TAKE OFF FUEL              {Math.round(takeoffFuel)}</div>
        <div>TAXI WEIGHT ACTUAL {Math.round(taxiWeightActual)} MAX {Math.round(maxTOW)}</div>
        <div>*****************************</div>
        <div>TAKE OFF WEIGHT ACTUAL {Math.round(takeoffWeightActual)} MAX {Math.round(maxTOW)}    R   ADJ</div>
        <div>*****************************</div>
        <div>TRIP FUEL                  {Math.round(tripFuel)}</div>
        <div>LANDING WEIGHT ACTUAL  {Math.round(landingWeightActual)} MAX {Math.round(maxLW)}    L   ADJ</div>
      </div>

      {/* Balance and Seating Conditions */}
      <div className="text-[10px] leading-[1.3] space-y-0">
        <div className="font-bold mb-1">BALANCE AND SEATING CONDITIONS</div>
        <div>DOI     {doi.toFixed(2)}                         FWD LIMIT        AFT LIMIT</div>
        <div>LIZFW {physics.zfwCG.toFixed(2)}  MACZFW {physics.zfwCG.toFixed(2)}     {physics.forwardLimit.toFixed(2)}            {physics.aftLimit.toFixed(2)}</div>
        <div>LITXW {physics.zfwCG.toFixed(2)}  MACTXW {physics.zfwCG.toFixed(2)}     {physics.forwardLimit.toFixed(2)}            {physics.aftLimit.toFixed(2)}</div>
        <div>LITOW {physics.towCG.toFixed(2)}  MACTOW {physics.towCG.toFixed(2)}     {physics.forwardLimit.toFixed(2)}            {physics.aftLimit.toFixed(2)}</div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-[9px] text-slate-600">
        <div>POWERED BY EVIONICA</div>
      </div>
    </div>
  );
};

