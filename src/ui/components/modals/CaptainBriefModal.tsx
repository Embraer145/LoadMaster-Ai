/**
 * CaptainBriefModal
 *
 * Print-to-PDF, captain-facing weight & balance brief.
 * Now with tabbed interface: Evionica format and Modern Visual format.
 * Goal: professional, readable on iPad, and print-friendly.
 */

import React, { useState } from 'react';
import { FileText, Printer, X } from 'lucide-react';
import type { FlightInfo, PhysicsResult, AircraftConfig, LoadedPosition } from '@core/types';
import { EvionicaFormatView } from './loadsheet/EvionicaFormatView';
import { ModernVisualView } from './loadsheet/ModernVisualView';

interface CaptainBriefModalProps {
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
  onClose: () => void;
}

export const CaptainBriefModal: React.FC<CaptainBriefModalProps> = ({
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
  operatorCode = 'WGA',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'evionica' | 'modern'>('modern');

  const handlePrint = () => window.print();

  const takeoffFuelKg = Math.max(0, blockFuelKg - taxiFuelKg);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[110] flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="relative w-full max-w-[1200px] max-h-[92vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col print:shadow-none print:border-slate-300 print:rounded-none print:bg-white print:max-h-none print:max-w-none">
        {/* Top controls (sticky, hidden in print) */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur print:hidden">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="text-blue-400" size={18} />
              <div className="text-xs font-bold text-slate-300 uppercase tracking-widest">Loadsheet</div>
            </div>
            
            {/* Tab Selector */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setActiveTab('modern')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'modern'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Modern Visual
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('evionica')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'evionica'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Evionica Format
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-700 flex items-center gap-2"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button type="button" onClick={onClose} className="p-2 text-slate-500 hover:text-white" title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto print:overflow-visible">
          {activeTab === 'evionica' ? (
            <EvionicaFormatView
              flight={flight}
              aircraftConfig={aircraftConfig}
              positions={positions}
              physics={physics}
              blockFuelKg={blockFuelKg}
              taxiFuelKg={taxiFuelKg}
              tripBurnKg={tripBurnKg}
              ballastFuelKg={ballastFuelKg}
              crewCount={crewCount}
              crewWeightKg={crewWeightKg}
              serviceAdjustmentsKg={serviceAdjustmentsKg}
              operatorCode={operatorCode}
            />
          ) : (
            <ModernVisualView
              flight={flight}
              aircraftConfig={aircraftConfig}
              positions={positions}
              physics={physics}
              blockFuelKg={blockFuelKg}
              taxiFuelKg={taxiFuelKg}
              tripBurnKg={tripBurnKg}
              operatorCode={operatorCode}
            />
          )}
        </div>
      </div>
    </div>
  );
};
