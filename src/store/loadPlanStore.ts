/**
 * Load Plan Store - Zustand State Management
 * 
 * Central state management for the load plan application.
 * This store manages:
 * - Flight information
 * - Loaded positions
 * - Warehouse items
 * - Fuel settings
 * - UI state (selection, drag)
 */

import { create } from 'zustand';
import type { 
  LoadedPosition, 
  CargoItem, 
  FlightInfo, 
  PhysicsResult,
  DragState,
  SelectionState,
  AircraftConfig,
  CargoTypeInfo,
  Destination,
} from '@core/types';
import { calculateFlightPhysics } from '@core/physics';
import type { OptimizationMode } from '@core/optimizer';
import { B747_400F_CONFIG } from '@data/aircraft';
import { WGA_DESTINATIONS, WGA_ORIGINS } from '@data/operators';
import { useSettingsStore } from '@core/settings';

/**
 * Cargo types registry
 */
export const CARGO_TYPES: Record<string, CargoTypeInfo> = {
  GENERAL: { label: 'General', color: 'bg-blue-500', border: 'border-blue-400', code: 'GEN' },
  // Avoid using green (reserved for "OK / in-limits" UI semantics)
  PERISHABLE: { label: 'Perishable', color: 'bg-cyan-500', border: 'border-cyan-400', code: 'PER' },
  HAZMAT: { label: 'Hazmat', color: 'bg-red-500', border: 'border-red-400', code: 'DG' },
  PRIORITY: { label: 'Priority', color: 'bg-amber-500', border: 'border-amber-400', code: 'PRI' },
  MAIL: { label: 'Mail', color: 'bg-indigo-500', border: 'border-indigo-400', code: 'MAL' },
};

/**
 * Route stop definition
 */
export interface RouteStop {
  sequence: number;
  code: string;
  city: string;
  flag: string;
  isOrigin: boolean;
  isDestination: boolean;
}

interface LegFuel {
  /** Block/Ramp fuel for this leg (kg) */
  blockFuelKg: number;
  /** Taxi fuel burned before takeoff (kg) */
  taxiFuelKg: number;
  /** Trip burn to landing (kg) */
  tripBurnKg: number;
}

interface LegMisc {
  /** Flight crew count (min 2, max 4 for this simulator UI) */
  crewCount: number;
  /** Additional items/equipment weights (kg) */
  itemsFwdKg: number;
  itemsAftKg: number;
  itemsOtherKg: number;
}

interface LegInputs {
  fuel: LegFuel;
  misc: LegMisc;
}

/**
 * Store state interface
 */
interface LoadPlanState {
  // Aircraft config
  aircraftConfig: AircraftConfig;
  
  // Flight info
  flight: FlightInfo | null;
  
  // Route (determines valid cargo destinations)
  route: RouteStop[];
  
  // Load state
  positions: LoadedPosition[];
  warehouse: CargoItem[];
  /** Active leg index (0-based). If a stopover exists, there are 2 legs (0 and 1). */
  activeLegIndex: number;
  /** Inputs per leg (fuel + misc loads) */
  legs: LegInputs[];
  
  // Computed physics
  physics: PhysicsResult;
  
  // UI state
  selection: SelectionState;
  drag: DragState;
  aiStatus:
    | null
    | {
        phase: 'thinking' | 'placing' | 'repacking' | 'failed' | 'cancelled';
        attempt: number;
        maxAttempts: number;
        message: string;
        canRetry?: boolean;
      };
  aiCancelRequested: boolean;
  optimizationMode: OptimizationMode;
  
  // Modal state
  showFinalize: boolean;
  showNotoc: boolean;
  
  // Actions
  setFlight: (flight: FlightInfo | null) => void;
  setRoute: (route: RouteStop[]) => void;
  /** Set block/ramp fuel for the active leg (kg) */
  setFuel: (fuel: number) => void;
  /** Select which leg is active for W&B calculations + envelope display */
  setActiveLegIndex: (idx: number) => void;
  /** Update fuel for a specific leg */
  updateLegFuel: (idx: number, updates: Partial<LegFuel>) => void;
  /** Update misc loads for a specific leg */
  updateLegMisc: (idx: number, updates: Partial<LegMisc>) => void;
  setOptimizationMode: (mode: OptimizationMode) => void;
  
  // Cargo actions
  importManifest: (count?: number) => void;
  clearAll: () => void;
  updateCargoWeight: (cargoId: string, newWeight: number) => void;
  
  // Position actions
  loadCargoAtPosition: (positionId: string, cargo: CargoItem) => void;
  unloadPosition: (positionId: string) => void;
  moveCargoToWarehouse: (positionId: string) => void;
  
  // Selection actions
  selectWarehouseItem: (itemId: string) => void;
  selectPosition: (positionId: string) => void;
  clearSelection: () => void;
  
  // Drag actions
  startDrag: (item: CargoItem, source: 'warehouse' | string) => void;
  endDrag: () => void;
  
  // Drop handlers
  dropOnPosition: (positionId: string) => boolean;
  dropOnWarehouse: () => void;
  
  // AI optimization
  runAiOptimization: () => Promise<void>;
  cancelAiOptimization: () => void;
  toggleMustFly: (cargoId: string) => void;
  
  // Modal actions
  setShowFinalize: (show: boolean) => void;
  setShowNotoc: (show: boolean) => void;
  
  // Helper getters
  getValidDestinations: () => Destination[];
}

/**
 * Airport lookup table
 */
const AIRPORT_INFO: Record<string, { city: string; flag: string }> = {
  'LAX': { city: 'Los Angeles', flag: '🇺🇸' },
  'SFO': { city: 'San Francisco', flag: '🇺🇸' },
  'ORD': { city: 'Chicago', flag: '🇺🇸' },
  'JFK': { city: 'New York', flag: '🇺🇸' },
  'MIA': { city: 'Miami', flag: '🇺🇸' },
  'ANC': { city: 'Anchorage', flag: '🇺🇸' },
  'CVG': { city: 'Cincinnati', flag: '🇺🇸' },
  'MEM': { city: 'Memphis', flag: '🇺🇸' },
  'FRA': { city: 'Frankfurt', flag: '🇩🇪' },
  'LHR': { city: 'London', flag: '🇬🇧' },
  'CDG': { city: 'Paris', flag: '🇫🇷' },
  'AMS': { city: 'Amsterdam', flag: '🇳🇱' },
  'LEJ': { city: 'Leipzig', flag: '🇩🇪' },
  'HKG': { city: 'Hong Kong', flag: '🇭🇰' },
  'PVG': { city: 'Shanghai', flag: '🇨🇳' },
  'ICN': { city: 'Seoul', flag: '🇰🇷' },
  'NRT': { city: 'Tokyo', flag: '🇯🇵' },
  'SIN': { city: 'Singapore', flag: '🇸🇬' },
  'DXB': { city: 'Dubai', flag: '🇦🇪' },
  'DOH': { city: 'Doha', flag: '🇶🇦' },
  'SYD': { city: 'Sydney', flag: '🇦🇺' },
};

function getAirportCity(code: string): string {
  return AIRPORT_INFO[code]?.city ?? code;
}

function getAirportFlag(code: string): string {
  return AIRPORT_INFO[code]?.flag ?? '✈️';
}

/**
 * Default route for testing (LAX -> ANC -> ICN -> HKG)
 */
export const DEFAULT_ROUTE: RouteStop[] = [
  { sequence: 0, code: 'LAX', city: 'Los Angeles', flag: '🇺🇸', isOrigin: true, isDestination: false },
  { sequence: 1, code: 'ANC', city: 'Anchorage', flag: '🇺🇸', isOrigin: false, isDestination: false },
  { sequence: 2, code: 'ICN', city: 'Seoul', flag: '🇰🇷', isOrigin: false, isDestination: false },
  { sequence: 3, code: 'HKG', city: 'Hong Kong', flag: '🇭🇰', isOrigin: false, isDestination: true },
];

/**
 * Generate random manifest items based on current route
 * Cargo destinations are ONLY stops on the current route (excluding origin)
 */
function generateManifest(count: number = 35, route: RouteStop[]): CargoItem[] {
  const manifest: CargoItem[] = [];
  const typeKeys = Object.keys(CARGO_TYPES);
  
  // Get valid destinations (all stops except origin)
  const validDestinations = route.filter(stop => !stop.isOrigin);
  
  // If no route defined, fall back to WGA destinations
  const destinations = validDestinations.length > 0 
    ? validDestinations.map(s => ({ code: s.code, city: s.city, flag: s.flag }))
    : WGA_DESTINATIONS;
  
  // Get origin from route, or default
  const origin = route.find(s => s.isOrigin)?.code ?? WGA_ORIGINS[0];
  
  for (let i = 0; i < count; i++) {
    const isMain = Math.random() > 0.3;
    const typeKey = typeKeys[Math.floor(Math.random() * typeKeys.length)];
    const dest = destinations[Math.floor(Math.random() * destinations.length)];

    const uldType = pickUldType(isMain ? 'MAIN' : 'LOWER');
    const compatibleDoors = getCompatibleDoors(uldType, isMain ? 'MAIN' : 'LOWER');
    
    manifest.push({
      id: `ULD-${Math.floor(Math.random() * 90000) + 10000}`,
      awb: `016-${Math.floor(Math.random() * 8999999) + 1000000}`,
      weight: Math.floor(Math.random() * (isMain ? 5000 : 2500) + 500),
      type: CARGO_TYPES[typeKey],
      dest: {
        code: dest.code,
        city: dest.city,
        flag: dest.flag,
      },
      origin: origin,
      preferredDeck: isMain ? 'MAIN' : 'LOWER',
      offloadPoint: dest.code, // Cargo gets offloaded at its destination
      mustFly: false,
      uldType,
      compatibleDoors,
      handlingFlags: deriveHandlingFlags(CARGO_TYPES[typeKey].code),
    });
  }
  
  return manifest;
}

function pickUldType(deck: 'MAIN' | 'LOWER'): CargoItem['uldType'] {
  // NOTE: simplified assumptions until we load an operator-specific ULD catalog.
  if (deck === 'MAIN') {
    const types: CargoItem['uldType'][] = ['PMC', 'P6P'];
    return types[Math.floor(Math.random() * types.length)];
  }
  const types: CargoItem['uldType'][] = ['LD3', 'LD1'];
  return types[Math.floor(Math.random() * types.length)];
}

function getCompatibleDoors(
  uldType: CargoItem['uldType'],
  deck: 'MAIN' | 'LOWER'
): CargoItem['compatibleDoors'] {
  // NOTE: heuristic only. Real version should use door dimensions + ULD contour.
  if (deck === 'MAIN') return ['NOSE', 'SIDE'];
  if (uldType === 'BULK') return ['BULK'];
  return ['LOWER_FWD', 'LOWER_AFT'];
}

function deriveHandlingFlags(code: CargoItem['type']['code']): string[] {
  switch (code) {
    case 'DG':
      return ['DG'];
    case 'PER':
      return ['PER'];
    case 'PRI':
      return ['PRI'];
    case 'MAL':
      return ['MAIL'];
    case 'GEN':
    default:
      return [];
  }
}

/**
 * Initialize positions from aircraft config
 */
function initializePositions(config: AircraftConfig): LoadedPosition[] {
  return config.positions.map(pos => ({
    ...pos,
    content: null,
  }));
}

function legCountForFlight(flight: FlightInfo | null): number {
  if (!flight) return 1;
  return flight.stopover ? 2 : 1;
}

function createDefaultLegs(count: number): LegInputs[] {
  const std = useSettingsStore.getState().settings.standardWeights;
  return Array.from({ length: count }, () => ({
    fuel: {
      blockFuelKg: 40000,
      taxiFuelKg: 0,
      tripBurnKg: 0,
    },
    misc: {
      crewCount: 2,
      itemsFwdKg: std.additionalItemsDefaultKg,
      itemsAftKg: 0,
      itemsOtherKg: 0,
    },
  }));
}

function computeStationLoads(
  config: AircraftConfig,
  leg: LegInputs
): { stationLoads: { stationId: string; weight: number }[] } {
  const std = useSettingsStore.getState().settings.standardWeights;
  const stations = config.stations ?? [];
  const has = (id: string) => stations.some(s => s.id === id);

  const loads: { stationId: string; weight: number }[] = [];

  // Crew weight:
  // - settings.standardWeights.crewTotalKg is treated as the standard *2-crew* total (pilots).
  // - UI allows 2–4 crew, so we scale linearly from the 2-crew baseline.
  const crewCount = Math.max(2, Math.min(4, leg.misc.crewCount || 2));
  const crewWeightKg = std.crewTotalKg > 0 ? (std.crewTotalKg * crewCount) / 2 : 0;
  if (has('CREW_FLIGHT_DECK') && crewWeightKg > 0) {
    loads.push({ stationId: 'CREW_FLIGHT_DECK', weight: crewWeightKg });
  }

  // Additional items / equipment
  if (has('ITEMS_FWD') && leg.misc.itemsFwdKg > 0) loads.push({ stationId: 'ITEMS_FWD', weight: leg.misc.itemsFwdKg });
  if (has('ITEMS_AFT') && leg.misc.itemsAftKg > 0) loads.push({ stationId: 'ITEMS_AFT', weight: leg.misc.itemsAftKg });
  if (has('ITEMS_OTHER') && leg.misc.itemsOtherKg > 0) loads.push({ stationId: 'ITEMS_OTHER', weight: leg.misc.itemsOtherKg });

  return { stationLoads: loads };
}

function computePhysics(
  positions: LoadedPosition[],
  config: AircraftConfig,
  leg: LegInputs
): PhysicsResult {
  const { stationLoads } = computeStationLoads(config, leg);
  return calculateFlightPhysics(positions, leg.fuel.blockFuelKg, config, {
    stationLoads,
    taxiFuelKg: leg.fuel.taxiFuelKg,
    tripBurnKg: leg.fuel.tripBurnKg,
  });
}

/**
 * Create the Zustand store
 */
export const useLoadPlanStore = create<LoadPlanState>((set, get) => {
  // Initialize with default config
  const initialPositions = initializePositions(B747_400F_CONFIG);
  const initialLegs = createDefaultLegs(1);
  const initialPhysics = computePhysics(initialPositions, B747_400F_CONFIG, initialLegs[0]);
  const initialMode = useSettingsStore.getState().settings.optimization.defaultMode ?? 'fuel_efficiency';
  
  return {
    // Initial state
    aircraftConfig: B747_400F_CONFIG,
    flight: null,
    route: DEFAULT_ROUTE,
    positions: initialPositions,
    warehouse: [],
    activeLegIndex: 0,
    legs: initialLegs,
    physics: initialPhysics,
    selection: { id: null, source: null },
    drag: { item: null, source: null },
    aiStatus: null,
    aiCancelRequested: false,
    optimizationMode: initialMode,
    cancelAiOptimization: () => {
      set({ aiCancelRequested: true });
    },

    toggleMustFly: (cargoId) => {
      const state = get();
      const toggle = (c: CargoItem) => ({ ...c, mustFly: !c.mustFly });

      const wIdx = state.warehouse.findIndex(c => c.id === cargoId);
      if (wIdx >= 0) {
        const nextWarehouse = [...state.warehouse];
        nextWarehouse[wIdx] = toggle(nextWarehouse[wIdx]);
        set({ warehouse: nextWarehouse });
        return;
      }

      const nextPositions = state.positions.map(p => {
        if (p.content?.id === cargoId) return { ...p, content: toggle(p.content) };
        return p;
      });
      set({ positions: nextPositions });
    },
    showFinalize: false,
    showNotoc: false,
    
    // Flight actions
    setFlight: (flight) => {
      if (flight) {
        // Build route from flight info
        const route: RouteStop[] = [
          { 
            sequence: 0, 
            code: flight.origin, 
            city: getAirportCity(flight.origin), 
            flag: getAirportFlag(flight.origin), 
            isOrigin: true, 
            isDestination: false 
          },
        ];
        
        // Add stopover if present
        if (flight.stopover) {
          route.push({
            sequence: 1,
            code: flight.stopover,
            city: getAirportCity(flight.stopover),
            flag: getAirportFlag(flight.stopover),
            isOrigin: false,
            isDestination: false,
          });
        }
        
        // Add destination
        route.push({
          sequence: route.length,
          code: flight.destination,
          city: getAirportCity(flight.destination),
          flag: getAirportFlag(flight.destination),
          isOrigin: false,
          isDestination: true,
        });
        
        const nextLegCount = legCountForFlight(flight);
        const prev = get();
        const legs =
          prev.legs.length === nextLegCount ? prev.legs : createDefaultLegs(nextLegCount);
        const activeLegIndex = Math.min(prev.activeLegIndex, legs.length - 1);

        const physics = computePhysics(prev.positions, prev.aircraftConfig, legs[activeLegIndex]);
        set({ flight, route, legs, activeLegIndex, physics });
      } else {
        const legs = createDefaultLegs(1);
        const prev = get();
        const activeLegIndex = 0;
        const physics = computePhysics(prev.positions, prev.aircraftConfig, legs[0]);
        set({ flight: null, route: DEFAULT_ROUTE, legs, activeLegIndex, physics });
      }
    },
    
    setRoute: (route) => set({ route }),
    
    setFuel: (fuel) => {
      const state = get();
      const nextLegs = [...state.legs];
      nextLegs[state.activeLegIndex] = {
        ...nextLegs[state.activeLegIndex],
        fuel: { ...nextLegs[state.activeLegIndex].fuel, blockFuelKg: fuel },
      };
      const physics = computePhysics(state.positions, state.aircraftConfig, nextLegs[state.activeLegIndex]);
      set({ legs: nextLegs, physics });
    },

    setActiveLegIndex: (idx) => {
      const state = get();
      const nextIdx = Math.max(0, Math.min(state.legs.length - 1, idx));
      const physics = computePhysics(state.positions, state.aircraftConfig, state.legs[nextIdx]);
      set({ activeLegIndex: nextIdx, physics });
    },

    updateLegFuel: (idx, updates) => {
      const state = get();
      const nextLegs = [...state.legs];
      const targetIdx = Math.max(0, Math.min(nextLegs.length - 1, idx));
      nextLegs[targetIdx] = {
        ...nextLegs[targetIdx],
        fuel: { ...nextLegs[targetIdx].fuel, ...updates },
      };
      const physics = computePhysics(state.positions, state.aircraftConfig, nextLegs[state.activeLegIndex]);
      set({ legs: nextLegs, physics });
    },

    updateLegMisc: (idx, updates) => {
      const state = get();
      const nextLegs = [...state.legs];
      const targetIdx = Math.max(0, Math.min(nextLegs.length - 1, idx));
      nextLegs[targetIdx] = {
        ...nextLegs[targetIdx],
        misc: { ...nextLegs[targetIdx].misc, ...updates },
      };
      const physics = computePhysics(state.positions, state.aircraftConfig, nextLegs[state.activeLegIndex]);
      set({ legs: nextLegs, physics });
    },
    
    setOptimizationMode: (mode) => set({ optimizationMode: mode }),
    
    // Cargo actions
    importManifest: (count = 30) => {
      const { aircraftConfig, route, legs, activeLegIndex } = get();
      const warehouse = generateManifest(count, route);
      const positions = initializePositions(aircraftConfig);
      const physics = computePhysics(positions, aircraftConfig, legs[activeLegIndex]);
      set({ 
        warehouse, 
        positions, 
        physics,
        selection: { id: null, source: null },
      });
    },
    
    // Helper: get valid destinations based on current route
    getValidDestinations: () => {
      const { route } = get();
      return route
        .filter(stop => !stop.isOrigin)
        .map(stop => ({
          code: stop.code,
          city: stop.city,
          flag: stop.flag,
        }));
    },
    
    clearAll: () => {
      const { aircraftConfig, legs, activeLegIndex } = get();
      const positions = initializePositions(aircraftConfig);
      const physics = computePhysics(positions, aircraftConfig, legs[activeLegIndex]);
      set({ 
        warehouse: [], 
        positions, 
        physics,
        selection: { id: null, source: null },
      });
    },
    
    updateCargoWeight: (cargoId, newWeight) => {
      const { positions, warehouse, aircraftConfig, legs, activeLegIndex } = get();
      
      // Check if in warehouse
      const warehouseIdx = warehouse.findIndex(i => i.id === cargoId);
      if (warehouseIdx >= 0) {
        const newWarehouse = [...warehouse];
        newWarehouse[warehouseIdx] = { ...newWarehouse[warehouseIdx], weight: newWeight };
        set({ warehouse: newWarehouse });
        return;
      }
      
      // Check if in position
      const newPositions = positions.map(p => {
        if (p.content?.id === cargoId) {
          return { ...p, content: { ...p.content, weight: newWeight } };
        }
        return p;
      });
      
      const physics = computePhysics(newPositions, aircraftConfig, legs[activeLegIndex]);
      set({ positions: newPositions, physics });
    },
    
    // Position actions
    loadCargoAtPosition: (positionId, cargo) => {
      const { positions, aircraftConfig, legs, activeLegIndex } = get();
      const newPositions = positions.map(p => 
        p.id === positionId ? { ...p, content: cargo } : p
      );
      const physics = computePhysics(newPositions, aircraftConfig, legs[activeLegIndex]);
      set({ positions: newPositions, physics });
    },
    
    unloadPosition: (positionId) => {
      const { positions, aircraftConfig, legs, activeLegIndex } = get();
      const newPositions = positions.map(p => 
        p.id === positionId ? { ...p, content: null } : p
      );
      const physics = computePhysics(newPositions, aircraftConfig, legs[activeLegIndex]);
      set({ positions: newPositions, physics });
    },
    
    moveCargoToWarehouse: (positionId) => {
      const { positions, warehouse, aircraftConfig, legs, activeLegIndex } = get();
      const position = positions.find(p => p.id === positionId);
      if (!position?.content) return;
      
      const cargo = position.content;
      const newPositions = positions.map(p => 
        p.id === positionId ? { ...p, content: null } : p
      );
      const physics = computePhysics(newPositions, aircraftConfig, legs[activeLegIndex]);
      set({ 
        positions: newPositions, 
        warehouse: [...warehouse, cargo],
        physics,
      });
    },
    
    // Selection actions
    selectWarehouseItem: (itemId) => {
      set({ selection: { id: itemId, source: 'warehouse' } });
    },
    
    selectPosition: (positionId) => {
      set({ selection: { id: positionId, source: 'slot' } });
    },
    
    clearSelection: () => {
      set({ selection: { id: null, source: null } });
    },
    
    // Drag actions
    startDrag: (item, source) => {
      set({ drag: { item, source } });
    },
    
    endDrag: () => {
      set({ drag: { item: null, source: null } });
    },
    
    // Drop handlers
    dropOnPosition: (positionId) => {
      const { drag, positions, warehouse, aircraftConfig, legs, activeLegIndex } = get();
      if (!drag.item) return false;
      
      const targetPos = positions.find(p => p.id === positionId);
      if (!targetPos) return false;
      
      // Check weight limit
      if (drag.item.weight > targetPos.maxWeight) {
        return false;
      }
      
      const prevContent = targetPos.content;
      let newPositions = positions.map(p => 
        p.id === positionId ? { ...p, content: drag.item } : p
      );
      
      let newWarehouse = warehouse;
      
      if (drag.source === 'warehouse') {
        // Remove from warehouse
        newWarehouse = warehouse.filter(i => i.id !== drag.item!.id);
        // If target had content, add to warehouse
        if (prevContent) {
          newWarehouse = [...newWarehouse, prevContent];
        }
      } else {
        // Moving from another position
        // Clear the source position (or swap)
        newPositions = newPositions.map(p => {
          if (p.content?.id === drag.item!.id && p.id !== positionId) {
            return { ...p, content: prevContent };
          }
          return p;
        });
      }
      
      const physics = computePhysics(newPositions, aircraftConfig, legs[activeLegIndex]);
      set({ 
        positions: newPositions, 
        warehouse: newWarehouse,
        physics,
        drag: { item: null, source: null },
        selection: { id: positionId, source: 'slot' },
      });
      
      return true;
    },
    
    dropOnWarehouse: () => {
      const { drag, positions, warehouse, aircraftConfig, legs, activeLegIndex } = get();
      if (!drag.item || drag.source === 'warehouse') return;
      
      // Remove from position
      const newPositions = positions.map(p => 
        p.content?.id === drag.item!.id ? { ...p, content: null } : p
      );
      
      const physics = computePhysics(newPositions, aircraftConfig, legs[activeLegIndex]);
      set({
        positions: newPositions,
        warehouse: [...warehouse, drag.item],
        physics,
        drag: { item: null, source: null },
        selection: { id: drag.item.id, source: 'warehouse' },
      });
    },
    
    // AI optimization with different strategies
    runAiOptimization: async () => {
      const { warehouse, positions, aircraftConfig, optimizationMode, route, legs, activeLegIndex } = get();
      const appSettings = useSettingsStore.getState().settings;
      const optSettings = appSettings.optimization;
      const leg = legs[activeLegIndex];
      const fuel = leg.fuel.blockFuelKg;
      const { stationLoads } = computeStationLoads(aircraftConfig, leg);
      
      if (warehouse.length === 0 && positions.every(p => !p.content)) {
        return;
      }

      // Snapshot current state (for safe rollback on failure/cancel)
      const snapshotPositions = positions.map(p => ({ ...p, content: p.content ? { ...p.content } : null }));
      const snapshotWarehouse = warehouse.map(c => ({ ...c }));
      const snapshotPhysics = get().physics;

      set({ aiCancelRequested: false });

      // Convert route to simple format for optimizer
      const routeStops = route.map(r => ({ code: r.code, city: r.city, flag: r.flag }));

      // CG target based on mode
      const cgTargets: Record<OptimizationMode, number> = {
        safety: (aircraftConfig.cgLimits.forward + aircraftConfig.cgLimits.aft) / 2,
        fuel_efficiency: optSettings.fuelEfficientCGTarget,
        unload_efficiency: (aircraftConfig.cgLimits.forward + aircraftConfig.cgLimits.aft) / 2,
      };
      const targetCG = cgTargets[optimizationMode];

      // CG limits with safety margin
      const safetyMargin = optSettings.minCGMargin; // Stay away from limits (configurable)
      const safeFwdLimit = aircraftConfig.cgLimits.forward + safetyMargin;
      const safeAftLimit = aircraftConfig.cgLimits.aft - safetyMargin;

      const maxAttempts = Math.max(1, optSettings.maxAutoloadAttempts || 10);

      // Collect all cargo
      const currentCargo = positions.filter(p => p.content).map(p => p.content!);
      const allCargo = [...warehouse, ...currentCargo];

      // Fast impossibility check for MUST FLY (weight > any position max)
      const maxPosWeight = Math.max(...aircraftConfig.positions.map(p => p.maxWeight));
      const impossibleMust = allCargo.filter(c => c.mustFly && c.weight > maxPosWeight);
      if (impossibleMust.length > 0) {
        set({
          positions: snapshotPositions,
          warehouse: snapshotWarehouse,
          physics: snapshotPhysics,
          aiStatus: {
            phase: 'failed',
            attempt: 1,
            maxAttempts,
            message: `MUST FLY too heavy for any position: ${impossibleMust.map(c => c.id).join(', ')}`,
            canRetry: false,
          },
        });
        return;
      }

      const seedRand = (seed: number) => {
        let t = seed >>> 0;
        return () => {
          t += 0x6D2B79F5;
          let r = Math.imul(t ^ (t >>> 15), 1 | t);
          r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
          return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
        };
      };

      const shuffleInPlace = <T,>(arr: T[], rand: () => number) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      };

      const explainLeftover = (item: CargoItem, emptyPositions: LoadedPosition[]): string => {
        const available = emptyPositions.filter(p => !p.content);
        const fitsWeight = available.some(p => p.maxWeight >= item.weight);
        if (!fitsWeight) return 'No position can accept this weight';
        return 'No CG/lateral-safe position available under current limits';
      };

      // Attempt loop (bounded repacks)
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const state = get();
        if (state.aiCancelRequested) {
          set({
            positions: snapshotPositions,
            warehouse: snapshotWarehouse,
            physics: snapshotPhysics,
            aiStatus: {
              phase: 'cancelled',
              attempt,
              maxAttempts,
              message: 'Cancelled',
              canRetry: true,
            },
          });
          return;
        }

        set({
          aiStatus: {
            phase: attempt === 1 ? 'thinking' : 'repacking',
            attempt,
            maxAttempts,
            message: attempt === 1 ? 'Analyzing manifest…' : `Repacking attempt ${attempt}/${maxAttempts}…`,
          },
        });

        // Start from empty plan each attempt
        let tempPositions = initializePositions(aircraftConfig);
        set({ positions: tempPositions, warehouse: [] });

        const rand = seedRand(attempt * 9973);

        // MUST FLY first, then mode-specific sorting for the rest
        const mustFly = allCargo.filter(c => !!c.mustFly).sort((a, b) => b.weight - a.weight);
        const normal = allCargo.filter(c => !c.mustFly);
        let sortedNormal = sortCargoForMode(normal, optimizationMode, routeStops);
        if (attempt > 1) {
          // Controlled variation to escape greedy dead-ends
          shuffleInPlace(sortedNormal, rand);
        }
        const cargoOrder = [...mustFly, ...sortedNormal];

        const remaining: CargoItem[] = [];

        const jitter = () => (attempt > 1 ? (rand() - 0.5) * 0.01 : 0);

        for (let idx = 0; idx < cargoOrder.length; idx++) {
          const item = cargoOrder[idx];
          const cur = get();
          if (cur.aiCancelRequested) {
            set({
              positions: snapshotPositions,
              warehouse: snapshotWarehouse,
              physics: snapshotPhysics,
              aiStatus: {
                phase: 'cancelled',
                attempt,
                maxAttempts,
                message: 'Cancelled',
                canRetry: true,
              },
            });
            return;
          }

          // Find best position that keeps CG in limits and moves toward target
          const bestPosition = findBestPositionWithCGCheck(
            item,
            tempPositions,
            aircraftConfig,
            fuel,
            targetCG,
            safeFwdLimit,
            safeAftLimit,
            optimizationMode,
            routeStops,
            optSettings.checkLateralBalance,
            optSettings.maxLateralImbalance,
            stationLoads,
            leg.fuel.taxiFuelKg,
            leg.fuel.tripBurnKg,
            jitter
          );

          if (!bestPosition) {
            remaining.push(item);
            continue;
          }

          const posIdx = tempPositions.findIndex(p => p.id === bestPosition.id);
          tempPositions[posIdx] = { ...tempPositions[posIdx], content: item };

          const physics = computePhysics(tempPositions, aircraftConfig, leg);
          const animMs = Math.max(0, appSettings.display.aiAnimationSpeed ?? 80);
          if (idx % 4 === 0) {
            set({
              aiStatus: {
                phase: 'placing',
                attempt,
                maxAttempts,
                message: `Placing ${idx + 1}/${cargoOrder.length}…`,
              },
            });
          }
          set({ positions: [...tempPositions], physics });

          if (animMs > 0) {
            await new Promise(r => setTimeout(r, Math.min(80, animMs)));
          }
        }

        // Success
        if (remaining.length === 0) {
          set({
            warehouse: [],
            aiStatus: null,
          });
          return;
        }

        // If MUST FLY is present in leftovers, keep trying until attempts exhausted.
        const mustLeft = remaining.filter(c => c.mustFly);
        if (attempt === maxAttempts) {
          // Exhausted
          const reasons = remaining.slice(0, 6).map(c => `${c.id}: ${explainLeftover(c, tempPositions)}`);
          const mustMsg = mustLeft.length > 0 ? `MUST FLY not placed: ${mustLeft.map(c => c.id).join(', ')}. ` : '';
          set({
            positions: snapshotPositions,
            warehouse: snapshotWarehouse,
            physics: snapshotPhysics,
            aiStatus: {
              phase: 'failed',
              attempt,
              maxAttempts,
              message: `${mustMsg}Tried ${maxAttempts} attempts — no safe solution. Try again?\n${reasons.join('\n')}`,
              canRetry: true,
            },
          });
          return;
        }
      }
    },
    
    // Modal actions
    setShowFinalize: (show) => set({ showFinalize: show }),
    setShowNotoc: (show) => set({ showNotoc: show }),
  };
});

// ============================================================================
// OPTIMIZATION HELPER FUNCTIONS
// ============================================================================

/**
 * Default cargo door proximity zones for B747-400F
 * These can be overridden in settings.unloadEfficiency
 */
const DEFAULT_DOOR_ZONES = {
  // Main deck side cargo door - positions G through K
  SIDE_DOOR: ['GL', 'GR', 'HL', 'HR', 'JL', 'JR', 'KL', 'KR'],
  // Nose door - forward positions
  NOSE_DOOR: ['A1', 'A2', 'B1', 'CL', 'CR', 'DL', 'DR', 'EL', 'ER', 'FL', 'FR'],
  // Aft section - furthest from doors
  TAIL: ['PL', 'PR', 'QL', 'QR', 'RL', 'RR', 'SL', 'SR', 'T'],
};

/**
 * Get configured door zones from settings, with fallback to defaults
 */
function getConfiguredDoorZones(): { firstOffZones: string[]; lastOffZones: string[] } {
  try {
    const settings = useSettingsStore.getState().settings.unloadEfficiency;
    return {
      firstOffZones: settings.firstOffZones.length > 0 
        ? settings.firstOffZones 
        : [...DEFAULT_DOOR_ZONES.SIDE_DOOR, ...DEFAULT_DOOR_ZONES.NOSE_DOOR.slice(0, 3)],
      lastOffZones: settings.lastOffZones.length > 0 
        ? settings.lastOffZones 
        : DEFAULT_DOOR_ZONES.TAIL,
    };
  } catch {
    return {
      firstOffZones: [...DEFAULT_DOOR_ZONES.SIDE_DOOR, ...DEFAULT_DOOR_ZONES.NOSE_DOOR.slice(0, 3)],
      lastOffZones: DEFAULT_DOOR_ZONES.TAIL,
    };
  }
}

/**
 * Sort cargo based on optimization mode
 */
function sortCargoForMode(
  cargo: CargoItem[], 
  mode: OptimizationMode, 
  route: { code: string }[]
): CargoItem[] {
  const sorted = [...cargo];
  
  switch (mode) {
    case 'safety':
      // Sort by weight (heaviest first) - place heavy at center
      sorted.sort((a, b) => b.weight - a.weight);
      break;
      
    case 'fuel_efficiency':
      // Sort by weight (heaviest first) - place heavy aft
      sorted.sort((a, b) => b.weight - a.weight);
      break;
      
    case 'unload_efficiency':
      // Sort by offload order - cargo for LATER stops loads FIRST (goes deep)
      // This achieves LIFO - Last In, First Out
      const stopOrder = route.map(r => r.code);
      sorted.sort((a, b) => {
        const aIdx = stopOrder.indexOf(a.offloadPoint);
        const bIdx = stopOrder.indexOf(b.offloadPoint);
        // Higher index (later stop) = load first (goes to back)
        return bIdx - aIdx;
      });
      break;
  }
  
  return sorted;
}


/**
 * Find best position that keeps CG within limits and moves toward target
 * This is the smart optimizer that respects envelope constraints
 */
function findBestPositionWithCGCheck(
  cargo: CargoItem,
  positions: LoadedPosition[],
  config: AircraftConfig,
  fuel: number,
  targetCG: number,
  fwdLimit: number,
  aftLimit: number,
  mode: OptimizationMode,
  route: { code: string }[],
  checkLateralBalance: boolean,
  maxLateralImbalanceKg: number,
  stationLoads: { stationId: string; weight: number }[],
  taxiFuelKg: number,
  tripBurnKg: number,
  scoreJitter?: () => number
): LoadedPosition | null {
  // Filter to available positions that can handle this weight
  const available = positions.filter(p => 
    !p.content && p.maxWeight >= cargo.weight
  );
  
  if (available.length === 0) return null;
  
  // Prefer positions on preferred deck
  const deckPreferred = available.filter(p => p.deck === cargo.preferredDeck);
  const searchPool = deckPreferred.length > 0 ? deckPreferred : available;
  
  // Score each position based on how well it moves CG toward target while staying in limits
  const scoredPositions = searchPool.map(pos => {
    // Simulate placing cargo at this position
    const testPositions = positions.map(p => 
      p.id === pos.id ? { ...p, content: cargo } : p
    );
    const testPhysics = calculateFlightPhysics(testPositions, fuel, config, {
      stationLoads,
      taxiFuelKg,
      tripBurnKg,
    });
    const newCG = testPhysics.towCG;
    
    // Check if still within limits
    const cgWithinLimits = newCG >= fwdLimit && newCG <= aftLimit && !testPhysics.isOverweight;
    const lateralWithinLimits = !checkLateralBalance
      ? true
      : calculateMainDeckLateralDeltaKg(testPositions) <= maxLateralImbalanceKg;
    const inLimits = cgWithinLimits && lateralWithinLimits;
    
    if (!inLimits) {
      return { pos, score: -Infinity, newCG, inLimits: false };
    }
    
    // Calculate score based on mode
    let score = 0;
    
    if (mode === 'safety') {
      // Maximize distance from both limits (best margin)
      const fwdMargin = newCG - fwdLimit;
      const aftMargin = aftLimit - newCG;
      score = Math.min(fwdMargin, aftMargin); // Higher = better margins
    } 
    else if (mode === 'fuel_efficiency') {
      // Move CG toward target (aft), but penalize going past it
      const distanceToTarget = Math.abs(newCG - targetCG);
      const isAftOfTarget = newCG > targetCG;
      // Prefer being close to target, slight preference for aft
      score = 100 - distanceToTarget + (isAftOfTarget ? -5 : 0);
    }
    else if (mode === 'unload_efficiency') {
      // Get configured door zones from settings
      const { firstOffZones, lastOffZones } = getConfiguredDoorZones();
      
      // Score based on unload accessibility for this cargo's stop
      const stopOrder = route.map(r => r.code);
      const cargoStopIdx = stopOrder.indexOf(cargo.offloadPoint);
      const totalStops = stopOrder.length;
      
      // Check if position is in configured zones
      const isFirstOffZone = firstOffZones.includes(pos.id);
      const isLastOffZone = lastOffZones.includes(pos.id);
      
      if (cargoStopIdx <= 1 && totalStops > 1) {
        // First stop cargo - reward door-adjacent positions (from settings)
        score = isFirstOffZone ? 100 : 50;
      } else {
        // Later stops - reward aft positions (from settings)
        score = isLastOffZone ? 100 : (isFirstOffZone ? 30 : 60);
      }
      
      // Also consider CG - don't go out of limits
      const cgMargin = Math.min(newCG - fwdLimit, aftLimit - newCG);
      score += cgMargin * 2; // Bonus for good CG margin
    }
    
    if (scoreJitter) score += scoreJitter();
    return { pos, score, newCG, inLimits: true };
  });
  
  // Filter to only valid positions and sort by score
  const validPositions = scoredPositions
    .filter(sp => sp.inLimits)
    .sort((a, b) => b.score - a.score);
  
  if (validPositions.length === 0) {
    // No position keeps us in limits - can't place this cargo
    return null;
  }
  
  return validPositions[0].pos;
}

/**
 * Main deck lateral imbalance metric (kg).
 * Mirrors the UI: counts MAIN deck L/R only; treats centerline/belly as neutral.
 */
function calculateMainDeckLateralDeltaKg(positions: LoadedPosition[]): number {
  let left = 0;
  let right = 0;

  for (const p of positions) {
    if (p.deck !== 'MAIN') continue;
    const w = p.content?.weight ?? 0;

    if (p.id === 'A1' || p.id.endsWith('L')) left += w;
    else if (p.id === 'A2' || p.id.endsWith('R')) right += w;
  }

  return Math.abs(left - right);
}

/**
 * Selector for currently selected content
 */
export function useSelectedContent() {
  return useLoadPlanStore(state => {
    const { selection, warehouse, positions } = state;
    
    if (!selection.id) return null;
    
    if (selection.source === 'warehouse') {
      return warehouse.find(i => i.id === selection.id) ?? null;
    }
    
    if (selection.source === 'slot') {
      return positions.find(p => p.id === selection.id)?.content ?? null;
    }
    
    return null;
  });
}

