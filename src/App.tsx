/**
 * LoadMaster Pro - Main Application
 * 
 * B747-400F Weight & Balance Load Planning System
 */

import React, { useEffect, useState } from 'react';
import { 
  Fuel, 
  Zap, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle,
  Container,
  GripHorizontal,
  BrainCircuit,
  Shield,
  Gauge as GaugeIcon,
  Clock,
} from 'lucide-react';

// Store
import { useLoadPlanStore, useSelectedContent } from '@store/loadPlanStore';
import { useOptimizationSettings } from '@core/settings';

// UI Components
import { Header } from '@ui/layouts';
import { 
  Gauge, 
  DraggableCargo, 
  CargoInspector,
  FlightEnvelope,
  NotocModal,
  FinalizeModal,
  AircraftDiagram,
} from '@ui/components';
import { AdminSettings } from '@ui/pages';

// Data

export default function App() {
  // Store state
  const {
    aircraftConfig,
    flight,
    positions,
    warehouse,
    fuel,
    physics,
    selection,
    drag,
    aiStatus,
    optimizationMode,
    showFinalize,
    showNotoc,
    setFlight,
    setOptimizationMode,
    setFuel,
    importManifest,
    clearAll,
    updateCargoWeight,
    selectWarehouseItem,
    selectPosition,
    startDrag,
    endDrag,
    dropOnPosition,
    dropOnWarehouse,
    runAiOptimization,
    setShowFinalize,
    setShowNotoc,
  } = useLoadPlanStore();

  const selectedContent = useSelectedContent();
  const optimizationSettings = useOptimizationSettings();

  // Lateral balance (VIEW ONLY)
  // IMPORTANT:
  // - Meaningful L/R is primarily on MAIN deck positions ending in L/R (plus A1/A2).
  // - LOWER deck positions are treated as "centerline/not modeled" for lateral until we have real geometry.
  const lateral = positions.reduce(
    (acc, p) => {
      const w = p.content?.weight ?? 0;
      const isMain = p.deck === 'MAIN';
      const isLower = p.deck === 'LOWER';

      if (isMain) {
        if (p.id === 'A1' || p.id.endsWith('L')) acc.main.left += w;
        else if (p.id === 'A2' || p.id.endsWith('R')) acc.main.right += w;
        else acc.main.center += w; // e.g., B1
      } else if (isLower) {
        acc.lower.center += w; // Until we model lower-deck lateral offsets
      } else {
        acc.other += w;
      }

      return acc;
    },
    {
      main: { left: 0, right: 0, center: 0 },
      lower: { center: 0 },
      other: 0,
    }
  );

  const mainDelta = Math.abs(lateral.main.left - lateral.main.right);
  const lateralLimitKg = optimizationSettings.maxLateralImbalance;
  const lateralCheckEnabled = optimizationSettings.checkLateralBalance;
  const lateralIsOk = !lateralCheckEnabled || mainDelta <= lateralLimitKg;
  
  // Local state for settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [rightTab, setRightTab] = useState<'envelope' | 'inspector'>('envelope');

  // Auto-switch the right panel based on where the user is working:
  // - warehouse click -> inspect cargo
  // - aircraft plan click -> show envelope
  useEffect(() => {
    if (selection.source === 'warehouse') {
      setRightTab('inspector');
    } else if (selection.source === 'slot') {
      setRightTab('envelope');
    }
  }, [selection.source, selection.id]);

  // Handlers
  const handleTestSetup = () => {
    setFlight({
      registration: 'N344KD',
      flightNumber: 'KD3402',
      origin: 'LAX',
      destination: 'HKG',
      stopover: 'ANC',
      date: new Date().toISOString().split('T')[0],
    });
    importManifest(30);
  };

  const handleImport = () => {
    importManifest(30);
  };

  const handleDragStart = (item: Parameters<typeof startDrag>[0], source: string) => {
    startDrag(item, source);
  };

  const handleWarehouseDragStart = (_e: React.DragEvent, item: Parameters<typeof startDrag>[0]) => {
    startDrag(item, 'warehouse');
  };

  const handleDrop = (positionId: string) => {
    const success = dropOnPosition(positionId);
    if (!success && drag.item) {
      alert(`Limit Exceeded: Position ${positionId} max weight exceeded`);
    }
    endDrag();
  };

  const handleWarehouseDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dropOnWarehouse();
  };

  const handleWeightChange = (newWeight: number) => {
    if (selectedContent) {
      updateCargoWeight(selectedContent.id, newWeight);
    }
  };

  const handleAiOptimize = async () => {
    if (warehouse.length === 0 && positions.every(p => !p.content)) {
      alert("Please import a load first.");
      return;
    }
    await runAiOptimization();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 flex flex-col pb-16 relative">
      
      {/* Modals */}
      {showFinalize && (
        <FinalizeModal physics={physics} onClose={() => setShowFinalize(false)} />
      )}
      {showNotoc && (
        <NotocModal positions={positions} onClose={() => setShowNotoc(false)} />
      )}
      {showSettings && (
        <AdminSettings onClose={() => setShowSettings(false)} />
      )}

      {/* Header */}
      <Header 
        flight={flight}
        onFlightChange={setFlight}
        onImport={handleImport}
        onTestSetup={handleTestSetup}
        onOpenSettings={() => setShowSettings(true)}
        isSampleData={!!aircraftConfig?.isSampleData}
      />

      {/* Warehouse Staging Area */}
      <div 
        className="bg-slate-900 border-b border-slate-800 p-3 shadow-inner relative z-40" 
        onDragOver={(e) => e.preventDefault()} 
        onDrop={handleWarehouseDrop}
      >
        <div className="max-w-[1600px] mx-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Container size={14} /> Warehouse Staging ({warehouse.length})
            </h3>
            <span className="text-[10px] text-slate-500 italic">
              <GripHorizontal size={10} className="inline mr-1" />Drag to Load
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 min-h-[90px]">
            {warehouse.length === 0 ? (
              <div className="w-full h-20 flex items-center justify-center border-2 border-dashed border-slate-800 rounded text-xs text-slate-600">
                Ready for Import
              </div>
            ) : warehouse.map(item => (
              <DraggableCargo 
                key={item.id} 
                item={item} 
                isSelected={selection.id === item.id && selection.source === 'warehouse'} 
                onSelect={(i) => selectWarehouseItem(i.id)} 
                onDragStart={handleWarehouseDragStart} 
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1600px] mx-auto w-full p-4 space-y-6">

        {/* Primary workspace:
            - Small screens: stacks naturally (Aircraft -> Envelope -> Inspector)
            - Large screens / iPad landscape: Envelope sits next to Aircraft */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Aircraft Visualization with Door Labels */}
          <div className="relative">
            {/* AI Optimization Overlay */}
            {aiStatus && (
              <div className="absolute inset-0 bg-slate-950/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm rounded-2xl">
                <BrainCircuit size={64} className="text-blue-500 animate-pulse mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">AI Optimization In Progress</h3>
                <p className="text-slate-400 font-mono">
                  {aiStatus === 'thinking' ? 'Analyzing Cargo Manifest...' : 'Iterative Balancing Strategy...'}
                </p>
              </div>
            )}

            <AircraftDiagram
              positions={positions}
              selection={selection}
              drag={drag}
              flight={flight}
              onSelectPosition={selectPosition}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          </div>

          {/* Right info panel (tabs) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-950/60 border-b border-slate-800">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setRightTab('envelope')}
                  className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    rightTab === 'envelope'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Envelope
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab('inspector')}
                  className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    rightTab === 'inspector'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Inspector
                </button>
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                {rightTab === 'inspector'
                  ? (selectedContent ? `Selected: ${selectedContent.id}` : 'Select cargo to inspect')
                  : 'Weight & Balance'}
              </div>
            </div>

            <div className="p-4">
              {rightTab === 'envelope' ? (
                <FlightEnvelope
                  embedded
                  currentWeight={physics.weight}
                  currentCG={physics.towCG}
                  zfw={physics.zfw}
                  zfwCG={physics.zfwCG}
                  fwdLimit={physics.forwardLimit}
                  aftLimit={physics.aftLimit}
                  fuel={fuel}
                />
              ) : (
                <CargoInspector
                  embedded
                  selectedContent={selectedContent}
                  onWeightChange={handleWeightChange}
                />
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Footer Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fuel & AI Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col min-w-0">
            {/* Fuel Slider */}
            <div className="mb-4">
              <div className="flex justify-between items-end mb-2">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <Fuel size={14} className="text-blue-500" /> FUEL
                </label>
                <span className="font-mono text-lg font-bold text-blue-400">
                  {(fuel/1000).toFixed(0)}t
                </span>
              </div>
              <input 
                type="range" 
                min="5000" 
                max="150000" 
                step="1000" 
                value={fuel} 
                onChange={(e) => setFuel(Number(e.target.value))} 
                className="w-full h-2 bg-slate-800 rounded-full appearance-none accent-blue-600 cursor-pointer" 
              />
            </div>
            
            {/* Optimization Mode Selector */}
            <div className="mb-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                AI Optimization Mode
              </label>
              <div className="grid grid-cols-3 gap-1">
                <OptModeButton 
                  mode="safety"
                  icon={<Shield size={14} />}
                  label="Safety"
                  active={optimizationMode === 'safety'}
                  onClick={() => setOptimizationMode('safety')}
                />
                <OptModeButton 
                  mode="fuel_efficiency"
                  icon={<GaugeIcon size={14} />}
                  label="Fuel Eff."
                  active={optimizationMode === 'fuel_efficiency'}
                  onClick={() => setOptimizationMode('fuel_efficiency')}
                />
                <OptModeButton 
                  mode="unload_efficiency"
                  icon={<Clock size={14} />}
                  label="Unload"
                  active={optimizationMode === 'unload_efficiency'}
                  onClick={() => setOptimizationMode('unload_efficiency')}
                />
              </div>
            </div>
            
            {/* AI Button */}
            <div className="bg-slate-950 rounded-lg p-2 border border-slate-800 flex items-center gap-2 mt-auto">
              <button 
                onClick={handleAiOptimize} 
                disabled={!!aiStatus} 
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <Zap size={14} className={aiStatus ? 'animate-pulse' : ''} /> 
                {aiStatus ? 'OPTIMIZING...' : 'AI AUTO-LOAD'}
              </button>
              <button 
                onClick={clearAll} 
                className="w-10 h-10 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700 flex items-center justify-center transition-colors"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Weight, CG, and Lateral Balance */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
              <div className="flex items-center justify-center min-w-0">
              <Gauge 
                label="GROSS WEIGHT" 
                value={(physics.weight / 1000).toFixed(1)} 
                unit="t" 
                max={400} 
                danger={physics.isOverweight} 
              />
            </div>

              <div className="flex items-center justify-center min-w-0">
              <Gauge 
                label="CENTER OF GRAVITY" 
                value={physics.towCG} 
                unit="%" 
                max={40} 
                danger={physics.isUnbalanced} 
              />
            </div>
            </div>

            {/* Main Deck L/R Balance (full-width row under gauges) */}
            <div className="mt-6 bg-slate-950/60 border border-slate-800 rounded-xl p-4 sm:p-5 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Main Deck L/R Balance
                  </div>
                  <div className="text-[10px] text-slate-500">
                    MAIN deck L/R only (lower deck treated as centerline)
                  </div>
                </div>

                <div className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold whitespace-nowrap tabular-nums ${
                  lateralIsOk
                    ? 'bg-slate-800/40 text-slate-200 border-slate-700'
                    : 'bg-amber-500/15 text-amber-200 border-amber-500/30'
                }`}>
                  Δ(L−R) {(mainDelta / 1000).toFixed(1)}t
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Left (L)</span>
                  <span className="text-sm font-mono font-bold text-slate-100 tabular-nums whitespace-nowrap">
                    {(lateral.main.left / 1000).toFixed(1)}t
                  </span>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Right (R)</span>
                  <span className="text-sm font-mono font-bold text-slate-100 tabular-nums whitespace-nowrap">
                    {(lateral.main.right / 1000).toFixed(1)}t
                  </span>
                </div>
              </div>

              {lateralCheckEnabled && (
                <div className="mt-3 flex items-center justify-between gap-3 text-[10px]">
                  <div className="text-slate-500">
                    Limit: {(lateralLimitKg / 1000).toFixed(1)}t
                  </div>
                  {!lateralIsOk && (
                    <div className="text-amber-300 font-bold">
                      Caution: imbalance exceeds configured limit
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status & Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between min-w-0">
            <div className={`p-3 rounded border flex items-center gap-3 ${
              physics.isOverweight || physics.isUnbalanced 
                ? 'bg-red-900/20 border-red-900/50 text-red-400' 
                : 'bg-emerald-900/20 border-emerald-900/50 text-emerald-400'
            }`}>
              {physics.isOverweight || physics.isUnbalanced ? <AlertTriangle /> : <CheckCircle />}
              <div>
                <div className="font-bold text-sm">
                  {physics.isOverweight || physics.isUnbalanced ? 'RESTRICTED' : 'READY FOR DISPATCH'}
                </div>
                <div className="text-[10px] opacity-70">
                  ZFW: {((physics.weight - fuel) / 1000).toFixed(1)}t
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => setShowNotoc(true)} 
                className="flex-1 bg-slate-800 text-slate-300 py-2 rounded text-xs font-bold border border-slate-700 hover:bg-slate-700"
              >
                NOTOC
              </button>
              <button 
                onClick={() => setShowFinalize(true)} 
                disabled={physics.isOverweight || physics.isUnbalanced} 
                className="flex-1 bg-emerald-600 disabled:opacity-50 text-white py-2 rounded text-xs font-bold shadow-lg hover:bg-emerald-500"
              >
                FINALIZE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Optimization Mode Button Component
interface OptModeButtonProps {
  mode: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function OptModeButton({ icon, label, active, onClick }: OptModeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center p-2 rounded-lg border transition-all
        ${active 
          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
        }
      `}
    >
      {icon}
      <span className="text-[9px] font-bold mt-1 uppercase tracking-wide">{label}</span>
    </button>
  );
}
