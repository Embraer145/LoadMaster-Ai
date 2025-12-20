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
import { useLoadPlanStore, useSelectedContent, useSelectedPosition } from '@store/loadPlanStore';
import { useOptimizationSettings, useSettings } from '@core/settings';
import { sortWarehouseItems, WAREHOUSE_SORT_LABEL, type WarehouseSortMode } from '@core/warehouse';
import { useAuthStore, getPermissions } from '@core/auth';
import { getDbBroadcastChannel, getDbRevKey, initDatabase, reloadDatabaseFromStorage } from './db/database';
import { logAudit } from './db/repositories/auditRepository';
import { isDatabaseInitialized } from './db/database';
import { getAirframeLayoutByRegistration } from '@db/repositories/airframeLayoutRepository';

// UI Components
import { Header } from '@ui/layouts';
import { 
  DraggableCargo, 
  CargoInspector,
  FlightEnvelope,
  NotocModal,
  CaptainBriefModal,
  FinalizeModal,
  ProofPackModal,
  AirframeInfoModal,
  AircraftDiagram,
  WarehouseSortModal,
  ProfileModal,
} from '@ui/components';
import { AdminSettings } from '@ui/pages';
import { getCargoVisual } from '@/ui/utils/cargoVisual';

declare const __APP_VERSION__: string;

// Data

export default function App() {
  const { currentUser, ensureDefaultUser } = useAuthStore();
  const permissions = useMemo(() => getPermissions(currentUser?.role), [currentUser?.role]);
  const [dbReady, setDbReady] = useState<boolean>(() => isDatabaseInitialized());

  // Store state
  const {
    aircraftConfig,
    flight,
    selectedRegistration,
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
    finalizeLoadPlan,
    setFlight,
    setAircraftType,
    setSelectedRegistration,
    setAircraftOewKg,
    setAircraftMomentArms,
    setPositionConstraintOverrides,
    setAircraftCoreOverrides,
    setOptimizationMode,
    setActiveLegIndex,
    updateLegFuel,
    updateLegMisc,
    importManifest,
    clearAll,
    updateCargoWeight,
    updateCargoHeightIn,
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
    toast,
    clearToast,
    overrideLastDrop,
  } = useLoadPlanStore();

  const selectedContent = useSelectedContent();
  const selectedPosition = useSelectedPosition();
  const optimizationSettings = useOptimizationSettings();
  const settings = useSettings();
  const cargoColorMode = settings.display.cargoColorMode;

  // Version + HMR counter (for verifying updates without relying on timestamps)
  const [hmrRev, setHmrRev] = useState(0);
  useEffect(() => {
    if (!import.meta.hot) return;
    const onAfterUpdate = () => setHmrRev((n) => n + 1);
    import.meta.hot.on('vite:afterUpdate', onAfterUpdate);
    return () => {
      try {
        import.meta.hot?.off('vite:afterUpdate', onAfterUpdate);
      } catch {
        // older typings may not include off()
      }
    };
  }, []);

  const activeRegistration = flight?.registration ?? selectedRegistration;
  const [airframeLayoutRev, setAirframeLayoutRev] = useState(0);

  useEffect(() => {
    const onUpdated = () => {
      // Any airframe layout save should refresh the cached read.
      // If a different reg was updated, harmless to refresh.
      setAirframeLayoutRev((n) => n + 1);
    };
    window.addEventListener('lm:airframeLayoutUpdated', onUpdated);
    return () => window.removeEventListener('lm:airframeLayoutUpdated', onUpdated);
  }, []);

  const airframeLayout = useMemo(() => {
    try {
      const reg = activeRegistration;
      if (!reg) return null;
      if (!dbReady || !isDatabaseInitialized()) return null;
      return getAirframeLayoutByRegistration(reg);
    } catch {
      return null;
    }
  }, [activeRegistration, airframeLayoutRev, dbReady]);

  useEffect(() => {
    // Allow super_admin to override aircraft type per-registration via Airframe Layouts.
    const nextType = airframeLayout?.aircraftType;
    if (!nextType) return;
    if (nextType !== aircraftConfig.type) setAircraftType(nextType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airframeLayout?.aircraftType]);

  useEffect(() => {
    const next = airframeLayout?.oewKg;
    // If DB layout has an OEW override for this registration, apply it to physics/config.
    // If not present, leave as-is (type default).
    if (typeof next === 'number' && Number.isFinite(next) && next > 0) setAircraftOewKg(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airframeLayout?.oewKg]);

  useEffect(() => {
    const positionArms = airframeLayout?.positionArms;
    const stationArms = airframeLayout?.stationArms;
    if (positionArms || stationArms) setAircraftMomentArms({ positionArms, stationArms });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airframeLayout?.positionArms, airframeLayout?.stationArms]);

  useEffect(() => {
    // Per-tail per-slot constraints (geometry/contours)
    setPositionConstraintOverrides(airframeLayout?.positionConstraints ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airframeLayout?.positionConstraints]);

  useEffect(() => {
    // Apply full per-tail "airframe card" overrides (limits/CG/MAC/fuel/max weights/provenance/sample flag).
    // Clear first to avoid carrying fields from a previous registration when the next record is partial.
    setAircraftCoreOverrides(null);
    if (!airframeLayout) return;
    setAircraftCoreOverrides({
      limits:
        airframeLayout.limits ??
        (typeof airframeLayout.oewKg === 'number' ? ({ OEW: airframeLayout.oewKg } as any) : undefined),
      cgLimits: airframeLayout.cgLimits,
      mac: airframeLayout.mac,
      fuelArm: airframeLayout.fuelArm,
      positionMaxWeights: airframeLayout.positionMaxWeights,
      isSampleData: airframeLayout.isSampleData,
      dataProvenance: airframeLayout.dataProvenance,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRegistration, airframeLayoutRev, dbReady]);

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
  const [showProofPack, setShowProofPack] = useState(false);
  const [showAirframeInfo, setShowAirframeInfo] = useState(false);
  const [rightTab, setRightTab] = useState<'envelope' | 'inspector'>('envelope');
  const [warehouseTab, setWarehouseTab] = useState<'payload' | 'misc'>('payload');
  const [warehouseUserCollapsed, setWarehouseUserCollapsed] = useState(false);
  const [warehouseTouchStartY, setWarehouseTouchStartY] = useState<number | null>(null);
  const [warehouseDragPointer, setWarehouseDragPointer] = useState<{ x: number; y: number } | null>(null);
  const [warehouseDragOverId, setWarehouseDragOverId] = useState<string | null>(null);
  const dragOverPosition = useMemo(() => {
    if (!warehouseDragOverId) return null;
    return positions.find((p) => p.id === warehouseDragOverId) ?? null;
  }, [positions, warehouseDragOverId]);
  const [warehouseSortMode, setWarehouseSortMode] = useState<WarehouseSortMode>(
    () => settings.display.defaultWarehouseSort
  );
  const [showWarehouseSort, setShowWarehouseSort] = useState(false);
  const [showCaptainBrief, setShowCaptainBrief] = useState(false);
  const [warehouseBarHeightPx, setWarehouseBarHeightPx] = useState<number>(() => {
    if (typeof window === 'undefined') return 180;
    const raw = window.localStorage.getItem('lm-warehouse-bar-height-v1');
    const n = raw ? Number(raw) : NaN;
    const clamp = (v: number) => Math.max(140, Math.min(280, v));
    return Number.isFinite(n) ? clamp(n) : 180;
  });
  const lastDragEndAtRef = useRef<number>(0);
  const prevDraggingRef = useRef<boolean>(false);
  const startupLoginLoggedRef = useRef(false);
  const workspaceSplitRef = useRef<HTMLDivElement | null>(null);
  const [workspaceSplitRatio, setWorkspaceSplitRatio] = useState<number>(() => {
    if (typeof window === 'undefined') return 0.55;
    const raw = window.localStorage.getItem('lm-workspace-split-v1');
    const n = raw ? Number(raw) : NaN;
    const clamp = (v: number) => Math.max(0.35, Math.min(0.75, v));
    return Number.isFinite(n) ? clamp(n) : 0.55;
  });
  const [isLgUp, setIsLgUp] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  // Init DB in the background (best-effort) and auto-login as TEST.
  useEffect(() => {
    ensureDefaultUser();

    void (async () => {
      try {
        await initDatabase();
        setDbReady(true);
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

  // Cross-tab sync: if another tab saves the DB, reload our in-memory sql.js instance.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key !== getDbRevKey()) return;
      void (async () => {
        try {
          await reloadDatabaseFromStorage();
          setDbReady(true);
          setAirframeLayoutRev((n) => n + 1);
        } catch {
          // ignore (prototype)
        }
      })();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(getDbBroadcastChannel());
    } catch {
      return;
    }
    bc.onmessage = () => {
      void (async () => {
        try {
          await reloadDatabaseFromStorage();
          setDbReady(true);
          setAirframeLayoutRev((n) => n + 1);
        } catch {
          // ignore
        }
      })();
    };
    return () => {
      try {
        bc?.close();
      } catch {
        // ignore
      }
    };
  }, []);

  // iPad-first UX: collapse the warehouse bar when empty to reclaim vertical space.
  // Auto-expands when cargo exists, or while dragging (so it's a clear drop target).
  const warehouseAutoCollapsed = warehouseTab === 'payload' && warehouse.length === 0 && !drag.item;
  const warehouseCollapsed = (warehouseUserCollapsed || warehouseAutoCollapsed) && !drag.item;

  const sortedWarehouse = useMemo(() => {
    if (warehouseTab !== 'payload') return warehouse;
    return sortWarehouseItems(warehouse, warehouseSortMode, route);
  }, [warehouse, warehouseSortMode, warehouseTab, route]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('lm-warehouse-bar-height-v1', String(warehouseBarHeightPx));
  }, [warehouseBarHeightPx]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('lm-workspace-split-v1', String(workspaceSplitRatio));
  }, [workspaceSplitRatio]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsLgUp(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Auto-switch the right panel based on where the user is working:
  // - warehouse click -> inspect cargo
  // - aircraft plan click -> inspect slot (or its cargo)
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
      // Slot selection should always open Inspector (cargo details if loaded, slot limits if empty).
      setRightTab('inspector');
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

  const handleWarehouseDragStart = (e: React.DragEvent, item: Parameters<typeof startDrag>[0]) => {
    // Use a transparent drag image so we can render our own ghost that resizes over slots.
    // Also set a payload for better cross-browser DnD support.
    try {
      const img = new Image();
      img.src =
        'data:image/svg+xml;base64,' +
        btoa('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>');
      e.dataTransfer.setDragImage(img, 0, 0);
      e.dataTransfer.setData('text/plain', item.id);
      e.dataTransfer.effectAllowed = 'move';
    } catch {
      // no-op
    }
    startDrag(item, 'warehouse');
  };

  const handleWarehouseDragEnd = () => {
    setWarehouseDragPointer(null);
    setWarehouseDragOverId(null);
    // In some browsers, `dragend` can fire before the target `drop` handler runs.
    // Defer clearing drag state so drops can still read `drag.item`.
    window.setTimeout(() => endDrag(), 0);
  };

  const handleDrop = (positionId: string) => {
    dropOnPosition(positionId);
    endDrag();
  };

  const handleWarehouseDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dropOnWarehouse();
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => clearToast(), 4800);
    return () => window.clearTimeout(t);
  }, [toast, clearToast]);

  // Dismiss toast on any click/tap (capture so it triggers even if the click is handled elsewhere)
  useEffect(() => {
    if (!toast) return;
    const onDown = (e: Event) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.('[data-lm-toast]')) return; // allow clicking toast buttons
      clearToast();
    };
    window.addEventListener('pointerdown', onDown, { capture: true });
    return () => window.removeEventListener('pointerdown', onDown, { capture: true } as any);
  }, [toast, clearToast]);

  // Track cursor + which slot we're hovering during warehouse drags (for dynamic ghost sizing).
  useEffect(() => {
    if (!(drag.item && drag.source === 'warehouse')) {
      setWarehouseDragPointer(null);
      setWarehouseDragOverId(null);
      return;
    }

    const onWindowDragOver = (e: globalThis.DragEvent) => {
      setWarehouseDragPointer({ x: e.clientX, y: e.clientY });
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const slotEl = el?.closest?.('[data-position-id]') as HTMLElement | null;
      setWarehouseDragOverId(slotEl?.dataset?.positionId ?? null);
    };

    window.addEventListener('dragover', onWindowDragOver);
    return () => {
      window.removeEventListener('dragover', onWindowDragOver);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag.item, drag.source]);

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
      {/* Build stamp (DEV only) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-3 left-3 z-[99999] pointer-events-none">
          <div className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-950/70 backdrop-blur text-[10px] text-slate-200 font-mono shadow-2xl">
            <div className="font-bold tracking-wider text-slate-300">VERSION</div>
            <div className="mt-0.5 tabular-nums">v{__APP_VERSION__} • {import.meta.env.MODE} • HMR+{hmrRev}</div>
            <div className="mt-0.5 text-slate-400">Cargo colors: {settings.display.cargoColorMode}</div>
          </div>
        </div>
      )}

      {/* Warehouse drag ghost (resizes to slot while hovering decks) */}
      {drag.item && drag.source === 'warehouse' && warehouseDragPointer && (
        <div
          className="fixed z-[9998] pointer-events-none"
          style={{
            left: warehouseDragPointer.x,
            top: warehouseDragPointer.y,
            transform: 'translate(-50%, -70%)',
          }}
        >
          {(() => {
            const overPos = warehouseDragOverId
              ? positions.find((p) => p.id === warehouseDragOverId) ?? null
              : null;
            const wClass = overPos?.id === '52' || overPos?.id === '53' ? 'w-8' : 'w-9';
            const hClass = overPos?.deck === 'MAIN' ? 'h-14' : 'h-12';

            if (overPos) {
              return (
                <div
                  className={`${wClass} ${hClass} rounded-md border border-white/20 shadow-2xl flex flex-col items-center justify-center ${getCargoVisual(drag.item!, cargoColorMode).bg} text-white`}
                >
                  <div className="flex items-center gap-0.5 leading-none">
                    <span className="text-[9px]">{drag.item!.dest.flag}</span>
                    <span className="text-[9px] font-bold tracking-wide opacity-95">{drag.item!.dest.code}</span>
                  </div>
                  <div className="text-sm font-bold font-mono leading-tight tabular-nums">
                    {Math.round(drag.item!.weight).toLocaleString()}
                  </div>
                  <div className="text-[7px] font-medium opacity-80 uppercase">
                    {cargoColorMode === 'uld' ? drag.item!.uldType : drag.item!.type.code}
                  </div>
                </div>
              );
            }

            return (
              <div className="w-32 rounded-xl border border-slate-700 bg-slate-950/85 backdrop-blur shadow-2xl overflow-hidden">
                <div className={`h-1 ${getCargoVisual(drag.item!, cargoColorMode).bg}`} />
                <div className="px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg leading-none">{drag.item!.dest.flag}</span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-extrabold text-white tracking-wider truncate">
                          {drag.item!.dest.code} • {Math.round(drag.item!.weight).toLocaleString()} kg
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono truncate">{drag.item!.id}</div>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-300 bg-slate-800/40 border border-slate-700 rounded-lg px-2 py-1">
                      Drag
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
      
      {/* Modals */}
      {showFinalize && (
        <FinalizeModal
          physics={physics}
          onFinalize={finalizeLoadPlan}
          onClose={() => setShowFinalize(false)}
        />
      )}
      {showNotoc && (
        <NotocModal
          positions={positions}
          flight={flight}
          onClose={() => setShowNotoc(false)}
        />
      )}
      {showCaptainBrief && (() => {
        const crewCount = Math.max(2, Math.min(4, activeLeg?.misc.crewCount || 2));
        const crewWeightKg = settings.standardWeights.crewTotalKg > 0
          ? (settings.standardWeights.crewTotalKg * crewCount) / 2
          : (settings.standardWeights.standardRiderKg > 0 ? settings.standardWeights.standardRiderKg * crewCount : 0);
        const serviceAdjustmentsKg = (activeLeg?.misc.itemsFwdKg ?? 0) + (activeLeg?.misc.itemsAftKg ?? 0) + (activeLeg?.misc.itemsOtherKg ?? 0);
        
        return (
          <CaptainBriefModal
            flight={flight}
            aircraftConfig={aircraftConfig}
            positions={positions}
            physics={physics}
            blockFuelKg={activeLeg?.fuel.blockFuelKg ?? 0}
            taxiFuelKg={activeLeg?.fuel.taxiFuelKg ?? 0}
            tripBurnKg={activeLeg?.fuel.tripBurnKg ?? 0}
            ballastFuelKg={activeLeg?.fuel.ballastFuelKg ?? 0}
            crewCount={crewCount}
            crewWeightKg={crewWeightKg}
            serviceAdjustmentsKg={serviceAdjustmentsKg}
            operatorCode={settings.general.defaultOperator}
            onClose={() => setShowCaptainBrief(false)}
          />
        );
      })()}
      {showSettings && (
        <AdminSettings onClose={() => setShowSettings(false)} />
      )}
      <AirframeInfoModal
        isOpen={showAirframeInfo}
        onClose={() => setShowAirframeInfo(false)}
        title={flight?.registration ? `Airframe Info • ${flight.registration}` : 'Airframe / Door Reference'}
        registration={activeRegistration}
        airframeLayout={airframeLayout}
        aircraftConfig={aircraftConfig}
      />
      <ProofPackModal
        isOpen={showProofPack}
        onClose={() => setShowProofPack(false)}
        operatorCode={settings.general.defaultOperator}
        flight={flight}
        aircraftConfig={aircraftConfig}
        positions={positions}
        fuelKg={takeoffFuelKg}
        physics={physics}
        settingsSnapshot={settings as unknown as Record<string, unknown>}
      />
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
        onRegistrationSelect={(reg) => setSelectedRegistration(reg)}
        onAircraftTypeSelect={(t) => setAircraftType(t)}
        onImport={handleImport}
        onTestSetup={handleTestSetup}
        onOpenSettings={permissions.canAccessSettings ? () => setShowSettings(true) : undefined}
        onGoHome={() => {
          window.location.hash = '#';
        }}
        isSampleData={!!aircraftConfig?.isSampleData}
        dbReady={dbReady}
      />

      {/* Role Access Banner (for read-only/limited roles) */}
      {(currentUser?.role === 'pilot' || currentUser?.role === 'dispatcher') && (
        <div className="bg-blue-900/20 border-b border-blue-700/30 px-4 py-2">
          <div className="max-w-[1600px] mx-auto flex items-center gap-3">
            <div className="px-2 py-1 bg-blue-600/20 border border-blue-500/40 rounded">
              <span className="text-xs font-bold text-blue-300">
                {currentUser.role === 'pilot' ? '👨‍✈️ PILOT' : '📋 DISPATCHER'}
              </span>
            </div>
            <div className="text-xs text-slate-300">
              {currentUser.role === 'pilot' 
                ? 'Read-only access: View finalized loadsheets, Captain\'s Brief, and flight envelope'
                : 'Limited access: View load plans and create flight schedules'}
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Staging Area */}
      <div
        className={`bg-slate-900 border-b border-slate-800 shadow-inner relative z-40 overflow-hidden
          transition-[max-height,padding] duration-300 ease-out
          ${warehouseCollapsed ? 'px-3 py-1' : 'px-3 py-2'}
          ${!permissions.canAccessWarehouse ? 'pointer-events-none opacity-50' : ''}
        `}
        style={{
          maxHeight: warehouseCollapsed ? 40 : warehouseBarHeightPx,
        }}
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
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/40 border border-slate-800 rounded-lg order-1">
                <Container size={14} className="text-slate-500" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap">
                  Warehouse (0)
                </span>
              </div>

              {/* Mini-menu (right) */}
              <div className="flex items-center gap-2 order-2">
                <div className="flex flex-col items-stretch gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (warehouseTab === 'misc') setWarehouseUserCollapsed(false);
                      setWarehouseTab('misc');
                    }}
                    className={`px-2 py-1.5 rounded text-[11px] font-extrabold uppercase tracking-wider border ${
                      warehouseTab === 'misc'
                        ? 'bg-slate-800 text-white border-slate-700'
                        : 'bg-slate-950/30 text-slate-300 border-slate-800 hover:text-white'
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
                    className={`px-2 py-1.5 rounded text-[11px] font-extrabold uppercase tracking-wider border ${
                      warehouseTab === 'payload'
                        ? 'bg-slate-800 text-white border-slate-700'
                        : 'bg-slate-950/30 text-slate-300 border-slate-800 hover:text-white'
                    }`}
                  >
                    Payload
                  </button>
                </div>
                {/* Sort is payload-only and irrelevant when warehouse is empty/collapsed */}
              </div>
            </div>
          ) : (
            <div className="flex items-stretch gap-2">
              {/* Mini-menu (right): Payload / Fuel Load / Sort */}
              <div className="w-28 flex flex-col justify-center gap-1 order-4">
                {/* Payload (primary) + Sort (sub-action, visually attached) */}
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => {
                      if (warehouseTab === 'payload') setWarehouseUserCollapsed(true);
                      else {
                        setWarehouseUserCollapsed(false);
                        setWarehouseTab('payload');
                      }
                    }}
                    className={`px-2 py-2 rounded-t-lg text-[11px] font-extrabold uppercase tracking-wider border ${
                      warehouseTab === 'payload'
                        ? 'bg-slate-800 text-white border-slate-700'
                        : 'bg-slate-950/30 text-slate-300 border-slate-800 hover:text-white'
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
                    className={`px-2 py-2 rounded-b-lg border border-t-0 flex flex-col items-center justify-center ${
                      warehouseTab === 'payload'
                        ? 'bg-slate-950/40 border-slate-800 text-slate-200 hover:border-slate-700'
                        : 'bg-slate-950/20 border-slate-900 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                    title={warehouseTab === 'payload' ? 'Sort payload' : 'Sorting not applicable for Fuel & Load'}
                  >
                    <div className="flex items-center w-full">
                      <span className="w-3 text-[9px] font-mono text-slate-500 leading-none"> </span>
                      <span className="flex-1 text-center text-[10px] font-black uppercase tracking-wider leading-none">
                        Sort
                      </span>
                      <span className="w-3 text-[9px] font-mono text-slate-500 leading-none text-right">↕</span>
                    </div>
                    <span className="text-[8px] text-slate-500 font-mono leading-none mt-1 truncate w-full text-center">
                      {WAREHOUSE_SORT_LABEL[warehouseSortMode]}
                    </span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (warehouseTab === 'misc') setWarehouseUserCollapsed(true);
                    else {
                      setWarehouseUserCollapsed(false);
                      setWarehouseTab('misc');
                    }
                  }}
                  className={`px-2 py-2 rounded-lg text-[11px] font-extrabold uppercase tracking-wider border ${
                    warehouseTab === 'misc' ? 'bg-slate-800 text-white border border-slate-700' : 'bg-slate-950/30 text-slate-300 border border-slate-800 hover:text-white'
                  }`}
                >
                  Fuel &amp; Load
                </button>
              </div>

              {/* Vertical label (left) */}
              <div className="w-8 flex items-center justify-center order-1">
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
              <div className="flex-1 min-w-0 order-2">
                {warehouseTab === 'payload' ? (
                  <div className="flex items-end gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 min-h-[84px]">
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
                        onDragEnd={handleWarehouseDragEnd}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-full overflow-hidden">
                    <div className="flex items-start gap-2 h-full">
                      {/* Fuel column (dense, table-like) */}
                      <div className="flex-1 min-w-0 max-w-[420px] bg-slate-950/30 border border-slate-800 rounded-xl p-2 h-full">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Fuel</div>
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

                        <div className="mt-2 grid grid-rows-5 gap-1">
                          <CompactFuelRow
                            label="TOTAL FUEL"
                            value={activeLeg.fuel.blockFuelKg}
                            step={100}
                            min={0}
                            max={200000}
                            onChange={(v) => updateLegFuel(activeLegIndex, { blockFuelKg: v })}
                          />
                          <CompactFuelRow
                            label="TAXI FUEL"
                            value={activeLeg.fuel.taxiFuelKg}
                            step={100}
                            min={0}
                            max={5000}
                            onChange={(v) => updateLegFuel(activeLegIndex, { taxiFuelKg: v })}
                          />
                          <CompactComputedRow
                            label="TAKEOFF FUEL"
                            value={Math.max(0, activeLeg.fuel.blockFuelKg - activeLeg.fuel.taxiFuelKg)}
                          />
                          <CompactFuelRow
                            label="TRIP FUEL"
                            value={activeLeg.fuel.tripBurnKg}
                            step={100}
                            min={0}
                            max={150000}
                            onChange={(v) => updateLegFuel(activeLegIndex, { tripBurnKg: v })}
                          />
                          <CompactComputedRow
                            label="LANDING FUEL"
                            value={Math.max(0, activeLeg.fuel.blockFuelKg - activeLeg.fuel.taxiFuelKg - activeLeg.fuel.tripBurnKg)}
                          />
                        </div>
                      </div>

                      {/* Upper Deck column (crew/jumpseaters/riders) */}
                      <div className="w-[320px] max-w-[40%] bg-slate-950/30 border border-slate-800 rounded-xl p-2 h-full">
                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Upper Deck</div>
                        {(() => {
                          const crewCount = Math.max(2, Math.min(4, activeLeg.misc.crewCount || 2));
                          const jump = Math.max(0, Math.min(1, activeLeg.misc.jumpseatCount || 0));
                          const maxR = settings.standardWeights.maxAdditionalRiders ?? 6;
                          const riders = Math.max(0, Math.min(maxR, activeLeg.misc.riderCount || 0));
                          const riderKg = (settings.standardWeights.standardRiderKg || 0) * (jump + riders);
                          const crewKg =
                            settings.standardWeights.crewTotalKg > 0
                              ? (settings.standardWeights.crewTotalKg * crewCount) / 2
                              : (settings.standardWeights.standardRiderKg > 0 ? settings.standardWeights.standardRiderKg * crewCount : 0);
                          const totalKg = crewKg + riderKg;

                          return (
                            <div className="mt-2 space-y-1">
                              <CompactCountRow
                                label="CREW"
                                value={crewCount}
                                min={2}
                                max={4}
                                onChange={(v) => updateLegMisc(activeLegIndex, { crewCount: v })}
                              />
                              <CompactCountRow
                                label="JUMP"
                                value={jump}
                                min={0}
                                max={1}
                                onChange={(v) => updateLegMisc(activeLegIndex, { jumpseatCount: v })}
                              />
                              <CompactCountRow
                                label="RIDERS"
                                value={riders}
                                min={0}
                                max={maxR}
                                onChange={(v) => updateLegMisc(activeLegIndex, { riderCount: v })}
                              />

                              <div className="h-px bg-slate-800 my-1" />

                              <CompactComputedRow label="CREW KG" value={crewKg} />
                              <CompactComputedRow label="RIDER KG" value={riderKg} />
                              <CompactComputedRow label="TOTAL" value={totalKg} />

                              {settings.standardWeights.crewTotalKg <= 0 && (
                                <div className="text-[10px] text-amber-300/90 mt-1">
                                  Using <span className="font-bold">Standard Weights → Rider</span> as fallback per-crew weight. Set{' '}
                                  <span className="font-bold">Standard Weights → Crew Total</span> to use your operator’s crew standard.
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* W&B column (dense) */}
                      <div className="w-[300px] max-w-[40%] bg-slate-950/30 border border-slate-800 rounded-xl p-2 h-full">
                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">W&B</div>
                        <div className="mt-2 grid grid-rows-6 gap-1">
                          <CompactTextRow
                            label="OEW"
                            value={`${aircraftConfig.limits.OEW.toLocaleString()} kg`}
                          />
                          <CompactWBRow label="ZFW" valueKg={physics.zfw} limitKg={aircraftConfig.limits.MZFW} />
                          <CompactWBRow
                            label="RW"
                            valueKg={physics.zfw + activeLeg.fuel.blockFuelKg}
                            limitKg={aircraftConfig.limits.MTOW}
                          />
                          <CompactWBRow label="TOW" valueKg={physics.weight} limitKg={aircraftConfig.limits.MTOW} />
                          <CompactWBRow label="LW" valueKg={physics.lw} limitKg={aircraftConfig.limits.MLW} />
                          <CompactTextRow label="CG" value={`${physics.towCG.toFixed(1)} %MAC`} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Vertical label (right) */}
              <div className="w-8 flex items-center justify-center order-3">
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

        {/* Vertical resize handle (expanded only) */}
        {!warehouseCollapsed && (
          <div className="absolute left-0 right-0 bottom-0 h-2 flex items-center justify-center">
            <button
              type="button"
              aria-label="Resize warehouse bar"
              title="Drag to resize"
              className="w-24 h-1.5 rounded-full bg-slate-700/60 hover:bg-slate-600/70 cursor-row-resize"
              onPointerDown={(e) => {
                const startY = e.clientY;
                const start = warehouseBarHeightPx;
                const clamp = (v: number) => Math.max(140, Math.min(280, v));
                (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
                document.body.style.cursor = 'row-resize';
                document.body.style.userSelect = 'none';

                const onMove = (ev: PointerEvent) => {
                  const dy = ev.clientY - startY;
                  // drag down increases height
                  setWarehouseBarHeightPx(clamp(start + dy));
                };
                const onUp = () => {
                  document.body.style.cursor = '';
                  document.body.style.userSelect = '';
                  window.removeEventListener('pointermove', onMove);
                  window.removeEventListener('pointerup', onUp);
                  window.removeEventListener('pointercancel', onUp);
                };
                window.addEventListener('pointermove', onMove);
                window.addEventListener('pointerup', onUp, { once: true });
                window.addEventListener('pointercancel', onUp, { once: true });
              }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 max-w-[1600px] mx-auto w-full p-4 space-y-6">

        {/* Primary workspace:
            - Small screens: stacks naturally (Aircraft -> Envelope -> Inspector)
            - Large screens / iPad landscape: Envelope sits next to Aircraft */}
        <div
          ref={workspaceSplitRef}
          className={
            isLgUp
              ? 'flex items-start gap-0'
              : 'grid grid-cols-1 gap-6 items-start'
          }
        >
          {/* Aircraft Visualization with Door Labels */}
          <div
            className="relative w-full"
            style={
              isLgUp
                ? { width: `${(workspaceSplitRatio * 100).toFixed(3)}%` }
                : undefined
            }
          >
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

            {activeRegistration ? (
              <div className={`relative ${!permissions.canEditLoadPlan ? 'pointer-events-none' : ''}`}>
                {!permissions.canEditLoadPlan && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-blue-900/90 border border-blue-600/50 rounded-lg backdrop-blur-sm">
                    <div className="text-xs font-bold text-blue-200">
                      🔒 Read-Only Mode - {currentUser?.role === 'pilot' ? 'Pilot View' : 'View Only'}
                    </div>
                  </div>
                )}
                <AircraftDiagram
                  aircraftType={aircraftConfig.type}
                  aircraftConfig={aircraftConfig}
                  positions={positions}
                  selection={selection}
                  drag={drag}
                  toast={toast}
                  onDismissToast={clearToast}
                  onOverrideToast={() => overrideLastDrop()}
                  onDragEnd={() => endDrag()}
                  flight={flight}
                  airframeLayout={airframeLayout}
                  mainDeckLateralDeltaKg={mainDelta}
                  mainDeckLateralLimitKg={lateralLimitKg}
                  lateralCheckEnabled={lateralCheckEnabled}
                  optimizationMode={optimizationMode}
                  aiStatus={aiStatus}
                  onSelectOptimizationMode={handleSelectModeAndAutoLoad}
                  onClearAll={permissions.canEditLoadPlan ? clearAll : () => {}}
                  physics={physics}
                  onOpenNotoc={() => setShowNotoc(true)}
                  onOpenFinalize={permissions.canFinalizeLoadPlan ? () => setShowFinalize(true) : () => {}}
                  onOpenCaptainBrief={() => setShowCaptainBrief(true)}
                  onOpenProofPack={() => setShowProofPack(true)}
                  onOpenAirframeInfo={() => setShowAirframeInfo(true)}
                  onSelectPosition={selectPosition}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                />
              </div>
            ) : (
              <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">No aircraft selected</div>
                <div className="mt-2 text-white text-lg font-black">Select an A/C registration to begin</div>
                <div className="mt-1 text-slate-400 text-sm">
                  Choose a tail number in the header, or click <span className="font-bold text-slate-200">Test Data</span> to load a sample flight.
                </div>
                <div className="mt-4 text-[11px] text-slate-500">
                  Tip: we intentionally hide the plan view until an airframe is selected to avoid showing misleading “default” door anchors.
                </div>
              </div>
            )}
          </div>

          {/* Draggable divider (large screens only) */}
          {isLgUp && (
            <div className="w-4 px-1 flex items-stretch justify-center">
              <button
                type="button"
                aria-label="Resize panels"
                title="Drag to resize panels"
                className="w-full rounded-lg bg-slate-800/40 hover:bg-slate-700/60 border border-slate-800 cursor-col-resize active:bg-slate-700/80"
                onPointerDown={(e) => {
                  const container = workspaceSplitRef.current;
                  if (!container) return;
                  const rect = container.getBoundingClientRect();
                  const startX = e.clientX;
                  const start = workspaceSplitRatio;
                  const clamp = (v: number) => Math.max(0.35, Math.min(0.75, v));

                  (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
                  document.body.style.cursor = 'col-resize';
                  document.body.style.userSelect = 'none';

                  const onMove = (ev: PointerEvent) => {
                    const dx = ev.clientX - startX;
                    const next = clamp(start + dx / Math.max(1, rect.width));
                    setWorkspaceSplitRatio(next);
                  };
                  const onUp = () => {
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                    window.removeEventListener('pointermove', onMove);
                    window.removeEventListener('pointerup', onUp);
                    window.removeEventListener('pointercancel', onUp);
                  };

                  window.addEventListener('pointermove', onMove);
                  window.addEventListener('pointerup', onUp, { once: true });
                  window.addEventListener('pointercancel', onUp, { once: true });
                }}
              >
                <div className="h-full flex items-center justify-center">
                  <div className="w-0.5 h-16 bg-slate-500/70 rounded-full" />
                </div>
              </button>
            </div>
          )}

          {/* Right info panel (tabs) */}
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden w-full"
            style={isLgUp ? { width: `${((1 - workspaceSplitRatio) * 100).toFixed(3)}%` } : undefined}
          >
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
                  selectedPosition={selectedPosition}
                  dragItem={drag.item}
                  dragOverPosition={dragOverPosition}
                  onWeightChange={handleWeightChange}
                  onHeightChange={(heightIn) => {
                    if (!selectedContent) return;
                    updateCargoHeightIn(selectedContent.id, heightIn);
                  }}
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

function CompactFuelRow(props: {
  label: string;
  value: number;
  step: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(props.min, Math.min(props.max, v));
  const roundStep = (v: number) => Math.round(v / props.step) * props.step;
  const set = (v: number) => props.onChange(clamp(roundStep(v)));

  return (
    <div className="grid grid-cols-[92px,1fr,92px] items-center gap-2">
      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider truncate">
        {props.label}
      </div>

      {/* Drag bar */}
      <div
        className="h-5 rounded border border-slate-800 bg-slate-950/40 overflow-hidden cursor-ew-resize select-none"
        onPointerDown={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          const rect = el.getBoundingClientRect();
          el.setPointerCapture(e.pointerId);
          const apply = (clientX: number) => {
            const t = (clientX - rect.left) / Math.max(1, rect.width);
            const v = props.min + t * (props.max - props.min);
            set(v);
          };
          apply(e.clientX);
          const onMove = (ev: PointerEvent) => apply(ev.clientX);
          const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
          };
          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp, { once: true });
          window.addEventListener('pointercancel', onUp, { once: true });
        }}
        title="Drag to adjust"
      >
        <div
          className="h-full bg-blue-600/50"
          style={{ width: `${((props.value - props.min) / Math.max(1, props.max - props.min)) * 100}%` }}
        />
      </div>

      {/* Value + +/- */}
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => set(props.value - props.step)}
          className="w-6 h-6 rounded bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700 text-slate-200 font-black"
          aria-label={`${props.label} minus`}
        >
          −
        </button>
        <input
          type="number"
          value={props.value}
          onChange={(e) => set(parseInt(e.target.value) || 0)}
          className="w-[58px] h-6 bg-slate-950/50 border border-slate-800 rounded px-1 font-mono text-slate-100 text-[11px] text-right outline-none tabular-nums"
          min={props.min}
          max={props.max}
          step={props.step}
        />
        <button
          type="button"
          onClick={() => set(props.value + props.step)}
          className="w-6 h-6 rounded bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700 text-slate-200 font-black"
          aria-label={`${props.label} plus`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function CompactComputedRow(props: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[92px,1fr,92px] items-center gap-2">
      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider truncate">{props.label}</div>
      <div className="h-5 rounded border border-slate-900 bg-slate-950/20" />
      <div className="text-right font-mono text-[11px] text-slate-200 tabular-nums">
        {Math.round(props.value).toLocaleString()}
      </div>
    </div>
  );
}

function CompactCountRow(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(props.min, Math.min(props.max, v));
  const set = (v: number) => props.onChange(clamp(Math.round(v)));
  return (
    <div className="grid grid-cols-[56px,1fr] items-center gap-2">
      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider truncate">{props.label}</div>
      <div className="flex items-center justify-end gap-1 bg-slate-950/30 border border-slate-800 rounded px-2 py-1">
        <button
          type="button"
          onClick={() => set(props.value - 1)}
          className="w-6 h-6 rounded bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700 text-slate-200 font-black"
          aria-label={`${props.label} minus`}
        >
          −
        </button>
        <input
          type="number"
          value={props.value}
          onChange={(e) => set(parseInt(e.target.value) || 0)}
          className="w-[42px] h-6 bg-slate-950/50 border border-slate-800 rounded px-1 font-mono text-slate-100 text-[11px] text-right outline-none tabular-nums"
          min={props.min}
          max={props.max}
          step={1}
        />
        <button
          type="button"
          onClick={() => set(props.value + 1)}
          className="w-6 h-6 rounded bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700 text-slate-200 font-black"
          aria-label={`${props.label} plus`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function CompactWBRow(props: { label: string; valueKg: number; limitKg: number }) {
  const margin = props.limitKg - props.valueKg;
  const ok = margin >= 0;
  return (
    <div className="grid grid-cols-[56px,1fr] items-center gap-2">
      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{props.label}</div>
      <div className="flex items-center justify-between gap-2 bg-slate-950/30 border border-slate-800 rounded px-2 py-1">
        <div className="font-mono text-[11px] text-slate-200 tabular-nums">{(props.valueKg / 1000).toFixed(1)} t</div>
        <div className={`font-mono text-[10px] tabular-nums ${ok ? 'text-emerald-300' : 'text-red-300'}`}>
          {ok ? '+' : '−'}
          {Math.abs(margin / 1000).toFixed(1)}t
        </div>
      </div>
    </div>
  );
}

function CompactTextRow(props: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[56px,1fr] items-center gap-2">
      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider truncate">{props.label}</div>
      <div className="bg-slate-950/30 border border-slate-800 rounded px-2 py-1 font-mono text-[11px] text-slate-200">
        {props.value}
      </div>
    </div>
  );
}

// (opt mode buttons moved into `AircraftDiagram` under the lower deck)
