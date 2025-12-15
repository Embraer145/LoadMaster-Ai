/**
 * Validation Functions
 * Pure TypeScript - No framework dependencies
 * 
 * Functions for validating weight, balance, and operational limits.
 */

import type { AircraftConfig, PhysicsResult } from '../types';

/**
 * Validation result with details
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate Zero Fuel Weight against limits
 */
export function validateZFW(
  zfw: number,
  config: AircraftConfig
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (zfw > config.limits.MZFW) {
    errors.push(`ZFW ${zfw.toLocaleString()}kg exceeds MZFW ${config.limits.MZFW.toLocaleString()}kg`);
  }
  
  const zfwMargin = (config.limits.MZFW - zfw) / config.limits.MZFW;
  if (zfwMargin < 0.05 && zfwMargin > 0) {
    warnings.push(`ZFW is within 5% of MZFW limit`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Takeoff Weight against limits
 */
export function validateTOW(
  tow: number,
  config: AircraftConfig
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (tow > config.limits.MTOW) {
    errors.push(`TOW ${tow.toLocaleString()}kg exceeds MTOW ${config.limits.MTOW.toLocaleString()}kg`);
  }
  
  const towMargin = (config.limits.MTOW - tow) / config.limits.MTOW;
  if (towMargin < 0.05 && towMargin > 0) {
    warnings.push(`TOW is within 5% of MTOW limit`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate CG is within envelope
 */
export function validateCG(
  cgPercent: number,
  forwardLimit: number,
  aftLimit: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (cgPercent < forwardLimit) {
    errors.push(`CG ${cgPercent}% MAC is forward of limit ${forwardLimit}% MAC`);
  }
  
  if (cgPercent > aftLimit) {
    errors.push(`CG ${cgPercent}% MAC is aft of limit ${aftLimit}% MAC`);
  }
  
  // Warning if close to limits
  const forwardMargin = cgPercent - forwardLimit;
  const aftMargin = aftLimit - cgPercent;
  
  if (forwardMargin > 0 && forwardMargin < 2) {
    warnings.push(`CG is within 2% of forward limit`);
  }
  
  if (aftMargin > 0 && aftMargin < 2) {
    warnings.push(`CG is within 2% of aft limit`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Complete flight validation
 */
export function validateFlight(
  physics: PhysicsResult,
  config: AircraftConfig
): ValidationResult {
  const zfwResult = validateZFW(physics.zfw, config);
  const towResult = validateTOW(physics.weight, config);
  const cgResult = validateCG(physics.towCG, physics.forwardLimit, physics.aftLimit);
  
  return {
    isValid: zfwResult.isValid && towResult.isValid && cgResult.isValid,
    errors: [...zfwResult.errors, ...towResult.errors, ...cgResult.errors],
    warnings: [...zfwResult.warnings, ...towResult.warnings, ...cgResult.warnings],
  };
}

