/**
 * Envelope Validation
 * 
 * Functions for validating weight and CG against envelope limits.
 */

import type {
  EnvelopeDefinition,
  EnvelopeValidationResult,
  EnvelopeViolation,
  CGLimitsAtWeight,
} from './types';
import { interpolateCGAtWeight, calculateMargins } from './geometry';

/**
 * Get CG limits at a specific weight
 * 
 * @param weight - Weight to calculate limits for
 * @param envelope - Envelope definition
 * @returns CG limits at the weight
 */
export function getCGLimitsAtWeight(
  weight: number,
  envelope: EnvelopeDefinition
): CGLimitsAtWeight {
  const forwardLimit = interpolateCGAtWeight(weight, envelope.forwardLimit);
  const aftLimit = interpolateCGAtWeight(weight, envelope.aftLimit);
  
  const withinWeightLimits = 
    weight >= envelope.weightLimits.min && 
    weight <= envelope.weightLimits.max;
  
  return {
    weight,
    forwardLimit: parseFloat(forwardLimit.toFixed(2)),
    aftLimit: parseFloat(aftLimit.toFixed(2)),
    withinWeightLimits,
  };
}

/**
 * Validate a weight/CG point against an envelope
 * 
 * @param weight - Weight in kg
 * @param cgPercent - CG in % MAC
 * @param envelope - Envelope definition
 * @returns Detailed validation result
 */
export function validateAgainstEnvelope(
  weight: number,
  cgPercent: number,
  envelope: EnvelopeDefinition
): EnvelopeValidationResult {
  const violations: EnvelopeViolation[] = [];
  
  // Get limits at this weight
  const limits = getCGLimitsAtWeight(weight, envelope);
  
  // Check weight limits
  if (weight > envelope.weightLimits.max) {
    violations.push({
      type: 'overweight',
      message: `Weight ${weight.toLocaleString()}kg exceeds maximum ${envelope.weightLimits.max.toLocaleString()}kg`,
      severity: 'error',
      value: weight,
      limit: envelope.weightLimits.max,
    });
  }
  
  if (weight < envelope.weightLimits.min) {
    violations.push({
      type: 'underweight',
      message: `Weight ${weight.toLocaleString()}kg below minimum ${envelope.weightLimits.min.toLocaleString()}kg`,
      severity: 'warning',
      value: weight,
      limit: envelope.weightLimits.min,
    });
  }
  
  // Check CG limits
  const margins = calculateMargins(cgPercent, limits.forwardLimit, limits.aftLimit);
  
  if (margins.forwardMargin < 0) {
    violations.push({
      type: 'forward',
      message: `CG ${cgPercent.toFixed(1)}% MAC is ${Math.abs(margins.forwardMargin).toFixed(1)}% forward of limit`,
      severity: 'error',
      value: cgPercent,
      limit: limits.forwardLimit,
    });
  } else if (margins.forwardMargin < 2) {
    violations.push({
      type: 'forward',
      message: `CG is within 2% of forward limit`,
      severity: 'warning',
      value: cgPercent,
      limit: limits.forwardLimit,
    });
  }
  
  if (margins.aftMargin < 0) {
    violations.push({
      type: 'aft',
      message: `CG ${cgPercent.toFixed(1)}% MAC is ${Math.abs(margins.aftMargin).toFixed(1)}% aft of limit`,
      severity: 'error',
      value: cgPercent,
      limit: limits.aftLimit,
    });
  } else if (margins.aftMargin < 2) {
    violations.push({
      type: 'aft',
      message: `CG is within 2% of aft limit`,
      severity: 'warning',
      value: cgPercent,
      limit: limits.aftLimit,
    });
  }
  
  const hasErrors = violations.some(v => v.severity === 'error');
  
  return {
    isValid: !hasErrors,
    currentCG: cgPercent,
    currentWeight: weight,
    forwardLimit: limits.forwardLimit,
    aftLimit: limits.aftLimit,
    forwardMargin: margins.forwardMargin,
    aftMargin: margins.aftMargin,
    violations,
  };
}

/**
 * Check if a point is inside the envelope (simple boolean check)
 */
export function isInsideEnvelope(
  weight: number,
  cgPercent: number,
  envelope: EnvelopeDefinition
): boolean {
  const result = validateAgainstEnvelope(weight, cgPercent, envelope);
  return result.isValid;
}

/**
 * Calculate how much weight can be added while staying in envelope
 * 
 * @param currentWeight - Current weight
 * @param currentCG - Current CG
 * @param envelope - Envelope definition
 * @returns Maximum additional weight possible
 */
export function calculateWeightMargin(
  currentWeight: number,
  currentCG: number,
  envelope: EnvelopeDefinition
): number {
  // Binary search for maximum weight
  let low = currentWeight;
  let high = envelope.weightLimits.max;
  
  while (high - low > 100) { // 100kg precision
    const mid = (low + high) / 2;
    const limits = getCGLimitsAtWeight(mid, envelope);
    
    if (currentCG >= limits.forwardLimit && currentCG <= limits.aftLimit) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  return Math.max(0, low - currentWeight);
}

