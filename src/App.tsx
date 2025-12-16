/**
 * LoadMaster Pro - Main Application
 * 
 * B747-400F Weight & Balance Load Planning System
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Container,
  BrainCircuit,
} from 'lucide-react';

// Store
import { useLoadPlanStore, useSelectedContent } from '@store/loadPlanStore';
import { useOptimizationSettings, useSettings } from '@core/settings';
import { sortWarehouseItems, WAREHOUSE_SORT_LABEL, type WarehouseSortMode } from '@core/warehouse';
import { useAuthStore } from '@core/auth';
import { initDatabase } from './db/database';
import { logAudit } from './db/repositories/auditRepository';

// UI Components
import { Header } from '@ui/layouts';
import { 
  DraggableCargo, 
  CargoInspector,
  FlightEnvelope,
  NotocModal,
  CaptainBriefModal,
  FinalizeModal,
  AircraftDiagram,
  WarehouseSortModal,
  ProfileModal,
} from '@ui/components';
import { AdminSettings } from '@ui/pages';

// Data

export default function App() {
  const { status: authStatus, currentUser, ensureDefaultUser } = useAuthStore();

  // Store state
  const {
    aircraftConfig,
    flight,
    positions,
    warehouse,
    route,
    legs,
    activeLegIndex,
    physics,
    selection,
    drag,
    aiStatus,
    optimizationMode,
    showFinalize,
    showNotoc,
    setFlight,
    setOptimizationMode,
    setActiveLegIndex,
    updateLegFuel,
    updateLegMisc,
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
    cancelAiOptimization,
    toggleMustFly,
    setShowFinalize,
    setShowNotoc,
  } = useLoadPlanStore();

  const selectedContent = useSelectedContent();
  const optimizationSettings = useOptimizationSettings();
  const settings = useSettings();

  const activeLeg = legs[activeLegIndex] ?? legs[0];
  const takeoffFuelKg = Math.max(0, (activeLeg?.fuel.blockFuelKg ?? 0) - (activeLeg?.fuel.taxiFuelKg ?? 0));

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
  // `lateralIsOk` used to drive a dedicated panel; now the summary lives in `AircraftDiagram`.
  
  // Local state for settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [rightTab, setRightTab] = useState<'envelope' | 'inspector'>('envelope');
  const [warehouseTab, setWarehouseTab] = useState<'payload' | 'misc'>('payload');
  const [warehouseUserCollapsed, setWarehouseUserCollapsed] = useState(false);
  const [warehouseTouchStartY, setWarehouseTouchStartY] = useState<number | null>(null);
  const [warehouseSortMode, setWarehouseSortMode] = useState<WarehouseSortMode>(
    () => settings.display.defaultWarehouseSort
  );
  const [showWarehouseSort, setShowWarehouseSort] = useState(false);
  const [showCaptainBrief, setShowCaptainBrief] = useState(false);
  const lastDragEndAtRef = useRef<number>(0);
  const prevDraggingRef = useRef<boolean>(false);
  const startupLoginLoggedRef = useRef(false);

  // Init DB in the background (best-effort) and auto-login as TEST.
  useEffect(() => {
    ensureDefaultUser();

    void (async () => {
      try {
        await initDatabase();
      } catch {
        // Prototype: DB init can fail (e.g., wasm fetch). App should still run.
        return;
      }

      // Log a single "session start" login audit once per app run if we have a user.
      if (!startupLoginLoggedRef.current) {
        startupLoginLoggedRef.current = true;
        if (currentUser) {
          try {
            logAudit({
              action: 'USER_LOGIN',
              userId: currentUser.id,
              operatorId: undefined,
              entityType: 'user',
              entityId: currentUser.id,
              metadata: { source: 'app_start', username: currentUser.username },
            });
          } catch {
            // ignore
          }
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // iPad-first UX: collapse the warehouse bar when empty to reclaim vertical space.
  // Auto-expands when cargo exists, or while dragging (so it's a clear drop target).
  const warehouseAutoCollapsed = warehouseTab === 'payload' && warehouse.length === 0 && !drag.item;
  const warehouseCollapsed = (warehouseUserCollapsed || warehouseAutoCollapsed) && !drag.item;

  const sortedWarehouse = useMemo(() => {
    if (warehouseTab !== 'payload') return warehouse;
    return sortWarehouseItems(warehouse, warehouseSortMode, route);
  }, [warehouse, warehouseSortMode, warehouseTab, route]);

  // Auto-switch the right panel based on where the user is working:
  // - warehouse click -> inspect cargo
  // - aircraft plan click -> show envelope
  useEffect(() => {
    const isDraggingNow = !!drag.item;

    // If a drag just ended, keep Envelope open (drop updates selection, but that's not a click intent).
    if (prevDraggingRef.current && !isDraggingNow) {
      lastDragEndAtRef.current = Date.now();
      setRightTab('envelope');
      prevDraggingRef.current = false;
      return;
    }
    prevDraggingRef.current = isDraggingNow;

    // While dragging / long-press rearranging, keep Envelope visible so the user can see CG movement.
    if (isDraggingNow) {
      setRightTab('envelope');
      return;
    }

    // Ignore the immediate selection change from drop for a short window.
    if (Date.now() - lastDragEndAtRef.current < 600) {
      setRightTab('envelope');
      return;
    }

    if (selection.source === 'warehouse') {
      setRightTab('inspector');
    } else if (selection.source === 'slot') {
      // Tap on a loaded slot -> inspect that cargo.
      // Tap on an empty slot -> envelope (position context).
      setRightTab(selectedContent ? 'inspector' : 'envelope');
    }
  }, [selection.source, selection.id, drag.item, selectedContent?.id]);

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

  const handleSelectModeAndAutoLoad = (mode: typeof optimizationMode) => {
    if (aiStatus) return;
    setOptimizationMode(mode);
    // Auto-run optimization whenever mode is selected (per UX request).
    void runAiOptimization();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 flex flex-col pb-16 relative">
      
      {/* Modals */}
      {showFinalize && (
        <FinalizeModal physics={physics} onClose={() => setShowFinalize(false)} />
      )}
      {showNotoc && (
        <NotocModal
          positions={positions}
          flight={flight}
          onClose={() => setShowNotoc(false)}
        />
      )}
      {showCaptainBrief && (
        <CaptainBriefModal
          flight={flight}
          physics={physics}
          takeoffFuelKg={takeoffFuelKg}
          taxiFuelKg={activeLeg?.fuel.taxiFuelKg ?? 0}
          tripBurnKg={activeLeg?.fuel.tripBurnKg ?? 0}
          onClose={() => setShowCaptainBrief(false)}
        />
      )}
      {showSettings && (
        <AdminSettings onClose={() => setShowSettings(false)} />
      )}
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <WarehouseSortModal
        isOpen={showWarehouseSort}
        value={warehouseSortMode}
        onClose={() => setShowWarehouseSort(false)}
        onSelect={(mode) => {
          setWarehouseSortMode(mode);
          setShowWarehouseSort(false);
        }}
      />

      {/* Header */}
      <Header 
        flight={flight}
        onFlightChange={setFlight}
        onImport={handleImport}
        onTestSetup={handleTestSetup}
        onOpenSettings={() => setShowSettings(true)}
        onOpenProfile={() => setShowProfile(true)}
        onGoHome={() => {
          window.location.hash = '#';
        }}
        userLabel={authStatus === 'authenticated' && currentUser ? currentUser.username : undefined}
        isSampleData={!!aircraftConfig?.isSampleData}
      />

      {/* Warehouse Staging Area */}
      <div
        className={`bg-slate-900 border-b border-slate-800 shadow-inner relative z-40 overflow-hidden
          transition-[max-height,padding] duration-300 ease-out
          ${warehouseCollapsed ? 'px-3 py-1 max-h-10' : 'px-3 py-2 max-h-[160px]'}
        `}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleWarehouseDrop}
        onTouchStart={(e) => setWarehouseTouchStartY(e.touches[0]?.clientY ?? null)}
        onTouchEnd={(e) => {
          const startY = warehouseTouchStartY;
          const endY = e.changedTouches[0]?.clientY ?? null;
          if (startY != null && endY != null) {
            const delta = endY - startY;
            // swipe up collapses
            if (delta < -25) setWarehouseUserCollapsed(true);
            // swipe down expands
            if (delta > 25) setWarehouseUserCollapsed(false);
          }
          setWarehouseTouchStartY(null);
        }}
      >
        <div className="max-w-[1600px] mx-auto">
          {warehouseCollapsed ? (
            <div className="flex items-center justify-between gap-3">
              {/* Mini-menu (left) */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-stretch gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (warehouseTab === 'misc') setWarehouseUserCollapsed(false);
                      setWarehouseTab('misc');
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      warehouseTab === 'misc'
                        ? 'bg-slate-800 text-white border-slate-700'
                        : 'bg-slate-950/30 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Fuel &amp; Load
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (warehouseTab === 'payload') setWarehouseUserCollapsed(false);
                      setWarehouseTab('payload');
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      warehouseTab === 'payload'
                        ? 'bg-slate-800 text-white border-slate-700'
                        : 'bg-slate-950/30 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Payload
                  </button>
                </div>
                {/* Sort is payload-only and irrelevant when warehouse is empty/collapsed */}
              </div>

              <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/40 border border-slate-800 rounded-lg">
                <Container size={14} className="text-slate-500" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap">
                  Warehouse (0)
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-stretch gap-2">
              {/* Mini-menu (left): Payload / Fuel Load / Sort */}
              <div className="w-28 flex flex-col justify-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (warehouseTab === 'payload') setWarehouseUserCollapsed(true);
                    else {
                      setWarehouseUserCollapsed(false);
                      setWarehouseTab('payload');
                    }
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    warehouseTab === 'payload' ? 'bg-slate-800 text-white border border-slate-700' : 'bg-slate-950/30 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Payload
                </button>
                <button
                  type="button"
                  disabled={warehouseTab !== 'payload'}
                  onClick={() => {
                    if (warehouseTab !== 'payload') return;
                    setShowWarehouseSort(true);
                  }}
                  className={`px-2 py-2 rounded-lg border flex flex-col items-start justify-center ${
                    warehouseTab === 'payload'
                      ? 'bg-slate-950/40 border-slate-800 text-slate-200 hover:border-slate-700'
                      : 'bg-slate-950/20 border-slate-900 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                  title={warehouseTab === 'payload' ? 'Sort payload' : 'Sorting not applicable for Fuel & Load'}
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-wider leading-none">Sort</span>
                  <span className="text-[10px] text-slate-500 font-mono leading-none mt-0.5">
                    {WAREHOUSE_SORT_LABEL[warehouseSortMode]}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (warehouseTab === 'misc') setWarehouseUserCollapsed(true);
                    else {
                      setWarehouseUserCollapsed(false);
                      setWarehouseTab('misc');
                    }
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    warehouseTab === 'misc' ? 'bg-slate-800 text-white border border-slate-700' : 'bg-slate-950/30 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Fuel &amp; Load
                </button>
              </div>

              {/* Vertical label (left) */}
              <div className="w-8 flex items-center justify-center">
                <div className="relative h-full">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90">
                    <div className="flex items-center gap-2 px-2 py-1 bg-slate-950/50 border border-slate-800 rounded-lg">
                      <Container size={14} className="text-slate-500" />
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap">
                        Warehouse ({warehouse.length})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content area */}
              <div className="flex-1 min-w-0">
                {warehouseTab === 'payload' ? (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 min-h-[84px]">
                    {warehouse.length === 0 ? (
                      <div className="w-full h-20 flex items-center justify-center border-2 border-dashed border-slate-800 rounded text-xs text-slate-600">
                        Ready for Import
                      </div>
                    ) : sortedWarehouse.map(item => (
                      <DraggableCargo
                        key={item.id}
                        item={item}
                        isSelected={selection.id === item.id && selection.source === 'warehouse'}
                        onSelect={(i) => selectWarehouseItem(i.id)}
                        onDragStart={handleWarehouseDragStart}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* Fuel (per leg) */}
                    <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Fuel (per leg)</div>
                        {legs.length > 1 && (
                          <div className="flex gap-1">
                            {legs.map((_, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setActiveLegIndex(idx)}
                                className={`px-2 py-1 rounded text-[10px] font-bold ${
                                  activeLegIndex === idx ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                Leg {idx + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Three compact sliders side-by-side (prevents cut-off) */}
                      <div className="grid grid-cols-3 gap-2">
                        <MiniFuelSlider
                          label="Total FOB"
                          value={activeLeg.fuel.blockFuelKg}
                          max={200000}
                          step={500}
                          onChange={(v) => updateLegFuel(activeLegIndex, { blockFuelKg: v })}
                        />
                        <MiniFuelSlider
                          label="Taxi"
                          value={activeLeg.fuel.taxiFuelKg}
                          max={5000}
                          step={100}
                          onChange={(v) => updateLegFuel(activeLegIndex, { taxiFuelKg: v })}
                        />
                        <MiniFuelSlider
                          label="Trip Burn"
                          value={activeLeg.fuel.tripBurnKg}
                          max={150000}
                          step={500}
                          onChange={(v) => updateLegFuel(activeLegIndex, { tripBurnKg: v })}
                        />
                      </div>

                      <div className="mt-1 text-[10px] text-slate-500 font-mono">
                        TO fuel {(Math.max(0, activeLeg.fuel.blockFuelKg - activeLeg.fuel.taxiFuelKg) / 1000).toFixed(1)}t •
                        LDG fuel {(Math.max(0, activeLeg.fuel.blockFuelKg - activeLeg.fuel.taxiFuelKg - activeLeg.fuel.tripBurnKg) / 1000).toFixed(1)}t
                      </div>
                    </div>

                    {/* Loads */}
                    <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Loads (stations)</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Crew std (2 crew): {settings.standardWeights.crewTotalKg}kg
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <MiscField
                          dense
                          label="Crew (2–4)"
                          value={activeLeg.misc.crewCount}
                          onChange={(v) => updateLegMisc(activeLegIndex, { crewCount: Math.max(2, Math.min(4, v)) })}
                        />
                        <MiscField dense label="Items FWD" value={activeLeg.misc.itemsFwdKg} onChange={(v) => updateLegMisc(activeLegIndex, { itemsFwdKg: v })} />
                        <MiscField dense label="Items AFT" value={activeLeg.misc.itemsAftKg} onChange={(v) => updateLegMisc(activeLegIndex, { itemsAftKg: v })} />
                        <MiscField dense label="Items OTHER" value={activeLeg.misc.itemsOtherKg} onChange={(v) => updateLegMisc(activeLegIndex, { itemsOtherKg: v })} />
                        <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-2 col-span-2">
                          <div className="text-[9px] text-slate-500 font-bold uppercase">Computed</div>
                          <div className="text-[10px] text-slate-300 font-mono mt-1">
                            ZFW {(physics.zfw/1000).toFixed(1)}t • TOW {(physics.weight/1000).toFixed(1)}t • LW {(physics.lw/1000).toFixed(1)}t
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Vertical label (right) */}
              <div className="w-8 flex items-center justify-center">
                <div className="relative h-full">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90">
                    <div className="flex items-center gap-2 px-2 py-1 bg-slate-950/50 border border-slate-800 rounded-lg">
                      <Container size={14} className="text-slate-500" />
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap">
                        Warehouse ({warehouse.length})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
            {aiStatus && aiStatus.phase !== 'failed' && aiStatus.phase !== 'cancelled' && (
              <div className="absolute inset-0 bg-slate-950/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm rounded-2xl">
                <BrainCircuit size={64} className="text-blue-500 animate-pulse mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">AI Optimization In Progress</h3>
                <div className="text-white font-black text-4xl tabular-nums">
                  {aiStatus.attempt}/{aiStatus.maxAttempts}
                </div>
                <p className="text-slate-400 font-mono">
                  {aiStatus.message}
                </p>
                <button
                  type="button"
                  onClick={cancelAiOptimization}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-700"
                >
                  Cancel
                </button>
              </div>
            )}

            {aiStatus && (aiStatus.phase === 'failed' || aiStatus.phase === 'cancelled') && (
              <div className="absolute inset-0 bg-slate-950/70 z-50 flex flex-col items-center justify-center backdrop-blur-sm rounded-2xl p-6">
                <div className="max-w-md w-full bg-slate-900/80 border border-slate-700 rounded-2xl p-5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {aiStatus.phase === 'cancelled' ? 'Cancelled' : 'Auto-load failed'}
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap text-[11px] text-slate-200 font-mono">
{aiStatus.message}
                  </pre>
                  <div className="mt-4 flex gap-2">
                    {aiStatus.canRetry && (
                      <button
                        type="button"
                        onClick={() => void runAiOptimization()}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
                      >
                        Try again
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => useLoadPlanStore.setState({ aiStatus: null })}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            <AircraftDiagram
              positions={positions}
              selection={selection}
              drag={drag}
              flight={flight}
              mainDeckLateralDeltaKg={mainDelta}
              mainDeckLateralLimitKg={lateralLimitKg}
              lateralCheckEnabled={lateralCheckEnabled}
              optimizationMode={optimizationMode}
              aiStatus={aiStatus}
              onSelectOptimizationMode={handleSelectModeAndAutoLoad}
              onClearAll={clearAll}
              physics={physics}
              onOpenNotoc={() => setShowNotoc(true)}
              onOpenFinalize={() => setShowFinalize(true)}
              onOpenCaptainBrief={() => setShowCaptainBrief(true)}
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
                  lw={physics.lw}
                  lwCG={physics.lwCG}
                  fwdLimit={physics.forwardLimit}
                  aftLimit={physics.aftLimit}
                  fuel={takeoffFuelKg}
                />
              ) : (
                <CargoInspector
                  embedded
                  selectedContent={selectedContent}
                  onWeightChange={handleWeightChange}
                  onToggleMustFly={toggleMustFly}
                />
              )}
            </div>
          </div>
        </div>

        {/* (Status/Actions moved into the AircraftDiagram right-side corner stack) */}
      </div>
    </div>
  );
}

function MiscField(props: { label: string; value: number; onChange: (v: number) => void; dense?: boolean }) {
  return (
    <div className={`bg-slate-900/30 border border-slate-800 rounded-lg ${props.dense ? 'p-1.5' : 'p-2'}`}>
      <div className="text-[9px] text-slate-500 font-bold uppercase">{props.label}</div>
      <input
        type="number"
        value={props.value}
        onChange={(e) => props.onChange(parseInt(e.target.value) || 0)}
        className={`mt-0.5 w-full bg-transparent font-mono text-slate-100 outline-none ${props.dense ? 'text-[12px]' : 'text-sm'}`}
        min={0}
      />
    </div>
  );
}

function MiniFuelSlider(props: {
  label: string;
  value: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-2 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[9px] text-slate-500 font-bold uppercase truncate">{props.label}</div>
        <div className="text-[10px] text-slate-300 font-mono tabular-nums whitespace-nowrap">
          {(props.value / 1000).toFixed(1)}t
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(parseInt(e.target.value) || 0)}
        className="w-full mt-1"
      />
      <input
        type="number"
        value={props.value}
        onChange={(e) => props.onChange(parseInt(e.target.value) || 0)}
        className="mt-1 w-full bg-slate-950/50 border border-slate-800 rounded px-2 py-1 text-[12px] font-mono text-slate-100 text-right"
        min={0}
      />
    </div>
  );
}

// (opt mode buttons moved into `AircraftDiagram` under the lower deck)
