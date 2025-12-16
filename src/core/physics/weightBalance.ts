/**
 * Weight & Balance Physics Engine
 * Pure TypeScript - No framework dependencies
 * 
 * This module contains all physics calculations for aircraft
 * weight and balance. These are pure functions that can be
 * unit tested and certified independently of the UI.
 */

import type { 
  AircraftConfig, 
  LoadedPosition, 
  PhysicsResult,
  StationLoad,
} from '../types';

/**
 * Calculate the moment for a single loaded position
 * Moment = Weight × Arm
 * 
 * @param position - The loaded position
 * @returns Moment in kg-inches
 */
export function calculatePositionMoment(position: LoadedPosition): number {
  if (!position.content) return 0;
  return position.content.weight * position.arm;
}

/**
 * Calculate total cargo weight from all positions
 * 
 * @param positions - Array of loaded positions
 * @returns Total cargo weight in kg
 */
export function calculateTotalCargoWeight(positions: LoadedPosition[]): number {
  return positions.reduce((total, pos) => {
    return total + (pos.content?.weight ?? 0);
  }, 0);
}

/**
 * Calculate total cargo moment from all positions
 * 
 * @param positions - Array of loaded positions
 * @returns Total cargo moment in kg-inches
 */
export function calculateTotalCargoMoment(positions: LoadedPosition[]): number {
  return positions.reduce((total, pos) => {
    return total + calculatePositionMoment(pos);
  }, 0);
}

export function calculateStationWeight(stations: StationLoad[] | undefined): number {
  if (!stations || stations.length === 0) return 0;
  return stations.reduce((sum, s) => sum + (s.weight ?? 0), 0);
}

export function calculateStationMoment(
  stations: StationLoad[] | undefined,
  config: AircraftConfig
): number {
  if (!stations || stations.length === 0) return 0;
  const stationDefs = config.stations ?? [];
  const armById = new Map(stationDefs.map(s => [s.id, s.arm]));
  return stations.reduce((sum, s) => {
    const arm = armById.get(s.stationId);
    if (!arm) return sum;
    return sum + (s.weight ?? 0) * arm;
  }, 0);
}

/**
 * Convert CG location to %MAC
 * 
 * Formula: %MAC = ((CG Location - LEMAC) / MAC Length) × 100
 * 
 * @param cgLocation - CG location in inches from datum
 * @param leMAC - Leading edge of MAC position
 * @param refChord - MAC reference chord length
 * @returns CG as percentage of MAC
 */
export function cgToPercentMAC(
  cgLocation: number, 
  leMAC: number, 
  refChord: number
): number {
  return ((cgLocation - leMAC) / refChord) * 100;
}

/**
 * Calculate the CG location from total weight and moment
 * 
 * Formula: CG Location = Total Moment / Total Weight
 * 
 * @param totalWeight - Total weight in kg
 * @param totalMoment - Total moment in kg-inches
 * @returns CG location in inches from datum
 */
export function calculateCGLocation(
  totalWeight: number, 
  totalMoment: number
): number {
  if (totalWeight === 0) return 0;
  return totalMoment / totalWeight;
}

/**
 * Calculate the forward CG limit at a given weight
 * The forward limit typically becomes more restrictive at higher weights
 * 
 * @param weight - Current weight in kg
 * @param config - Aircraft configuration
 * @returns Forward CG limit in %MAC
 */
export function calculateForwardLimit(
  weight: number, 
  config: AircraftConfig
): number {
  // Linear interpolation: limit moves aft as weight increases
  // This is a simplified model - actual envelopes are more complex
  const baseLimit = config.cgLimits.forward;
  const weightFactor = Math.max(0, (weight - 250000) / 150000);
  return baseLimit + (weightFactor * 12);
}

/**
 * Calculate the aft CG limit at a given weight
 * 
 * @param weight - Current weight in kg
 * @param config - Aircraft configuration
 * @returns Aft CG limit in %MAC
 */
export function calculateAftLimit(
  _weight: number, 
  config: AircraftConfig
): number {
  // For now, aft limit is constant - can be made dynamic if needed
  return config.cgLimits.aft;
}

/**
 * Calculate Operating Empty Weight moment
 * OEW is assumed to have CG at 25% MAC
 * 
 * @param config - Aircraft configuration
 * @returns OEW moment in kg-inches
 */
export function calculateOEWMoment(config: AircraftConfig): number {
  const oewCGLocation = config.mac.leMAC + (config.mac.refChord * 0.25);
  return config.limits.OEW * oewCGLocation;
}

/**
 * Calculate fuel moment
 * 
 * @param fuelWeight - Fuel weight in kg
 * @param fuelArm - Fuel arm (station) in inches
 * @returns Fuel moment in kg-inches
 */
export function calculateFuelMoment(
  fuelWeight: number, 
  fuelArm: number
): number {
  return fuelWeight * fuelArm;
}

/**
 * Main physics calculation function
 * Calculates complete weight and balance for the current load
 * 
 * @param positions - Array of loaded positions
 * @param fuel - Fuel weight in kg
 * @param config - Aircraft configuration
 * @returns Complete physics result
 */
export function calculateFlightPhysics(
  positions: LoadedPosition[],
  fuel: number,
  config: AircraftConfig,
  options?: {
    /** Non-cargo station loads (crew/riders/equipment) */
    stationLoads?: StationLoad[];
    /** Taxi fuel burned before takeoff (kg) */
    taxiFuelKg?: number;
    /** Trip fuel burned by landing (kg) */
    tripBurnKg?: number;
  }
): PhysicsResult {
  const taxiFuelKg = Math.max(0, options?.taxiFuelKg ?? 0);
  const tripBurnKg = Math.max(0, options?.tripBurnKg ?? 0);

  // Calculate OEW contribution
  const oewMoment = calculateOEWMoment(config);
  
  // Calculate cargo contribution
  const cargoWeight = calculateTotalCargoWeight(positions);
  const cargoMoment = calculateTotalCargoMoment(positions);

  // Calculate station (non-cargo) contribution
  const stationWeight = calculateStationWeight(options?.stationLoads);
  const stationMoment = calculateStationMoment(options?.stationLoads, config);
  
  // Zero Fuel Weight calculations
  const zfw = config.limits.OEW + cargoWeight + stationWeight;
  const zfwMoment = oewMoment + cargoMoment + stationMoment;
  const zfwCGLocation = calculateCGLocation(zfw, zfwMoment);
  const zfwCG = cgToPercentMAC(zfwCGLocation, config.mac.leMAC, config.mac.refChord);
  
  // Fuel: treat `fuel` as block/ramp fuel, subtract taxi before takeoff
  const takeoffFuel = Math.max(0, fuel - taxiFuelKg);
  const towFuelMoment = calculateFuelMoment(takeoffFuel, config.fuelArm);

  // Takeoff Weight calculations (ZFW + takeoff fuel)
  const totalWeight = zfw + takeoffFuel;
  const totalMoment = zfwMoment + towFuelMoment;
  const towCGLocation = calculateCGLocation(totalWeight, totalMoment);
  const towCG = cgToPercentMAC(towCGLocation, config.mac.leMAC, config.mac.refChord);

  // Landing Weight calculations (burn trip fuel)
  const landingFuel = Math.max(0, takeoffFuel - tripBurnKg);
  const lw = zfw + landingFuel;
  const lwMoment = zfwMoment + calculateFuelMoment(landingFuel, config.fuelArm);
  const lwCGLocation = calculateCGLocation(lw, lwMoment);
  const lwCG = cgToPercentMAC(lwCGLocation, config.mac.leMAC, config.mac.refChord);
  
  // Calculate limits at current weight
  const forwardLimit = calculateForwardLimit(totalWeight, config);
  const aftLimit = calculateAftLimit(totalWeight, config);
  
  // Check if within limits
  const isOverweight =
    totalWeight > config.limits.MTOW ||
    zfw > config.limits.MZFW ||
    lw > config.limits.MLW;
  const isUnbalanced = towCG < forwardLimit || towCG > aftLimit;
  
  return {
    weight: totalWeight,
    towCG: parseFloat(towCG.toFixed(1)),
    zfw,
    zfwCG: parseFloat(zfwCG.toFixed(1)),
    lw,
    lwCG: parseFloat(lwCG.toFixed(1)),
    totalMoment,
    isOverweight,
    isUnbalanced,
    forwardLimit: parseFloat(forwardLimit.toFixed(1)),
    aftLimit: parseFloat(aftLimit.toFixed(1)),
  };
}

/**
 * Check if a cargo item can be loaded at a position
 * 
 * @param position - Target position
 * @param cargoWeight - Weight of cargo to load
 * @returns True if cargo can be loaded
 */
export function canLoadAtPosition(
  position: LoadedPosition,
  cargoWeight: number
): boolean {
  // Position must be empty
  if (position.content !== null) return false;
  // Cargo must not exceed position limit
  return cargoWeight <= position.maxWeight;
}

