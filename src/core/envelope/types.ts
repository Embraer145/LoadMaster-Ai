/**
 * Envelope Types
 * 
 * Type definitions for weight & balance envelopes.
 * These define the safe operating zone for aircraft CG.
 */

/**
 * A point on the envelope polygon
 */
export interface EnvelopePoint {
  /** Weight in kg */
  weight: number;
  /** CG position in % MAC */
  cgPercent: number;
}

/**
 * A segment of the envelope boundary
 * Can be a straight line or interpolated curve
 */
export interface EnvelopeSegment {
  /** Start point */
  start: EnvelopePoint;
  /** End point */
  end: EnvelopePoint;
  /** Type of segment */
  type: 'linear' | 'curved';
  /** For curved segments, control points */
  controlPoints?: EnvelopePoint[];
}

/**
 * Envelope boundary (forward or aft limit)
 */
export interface EnvelopeBoundary {
  /** Points defining this boundary from low weight to high weight */
  points: EnvelopePoint[];
  /** Label for this boundary */
  label: string;
}

/**
 * Complete envelope definition
 */
export interface EnvelopeDefinition {
  /** Unique identifier */
  id: string;
  /** Envelope name/description */
  name: string;
  /** Flight phase this envelope applies to */
  phase: EnvelopePhase;
  /** Forward limit boundary */
  forwardLimit: EnvelopeBoundary;
  /** Aft limit boundary */
  aftLimit: EnvelopeBoundary;
  /** Weight limits */
  weightLimits: {
    min: number;
    max: number;
  };
  /** CG limits (overall) */
  cgLimits: {
    forward: number;
    aft: number;
  };
}

/**
 * Flight phase for envelope selection
 */
export type EnvelopePhase = 
  | 'takeoff'
  | 'cruise'
  | 'landing'
  | 'zero_fuel';

/**
 * Result of CG limit calculation at a specific weight
 */
export interface CGLimitsAtWeight {
  /** Weight used for calculation */
  weight: number;
  /** Forward limit at this weight (% MAC) */
  forwardLimit: number;
  /** Aft limit at this weight (% MAC) */
  aftLimit: number;
  /** Is the weight within envelope weight limits */
  withinWeightLimits: boolean;
}

/**
 * Result of envelope validation
 */
export interface EnvelopeValidationResult {
  /** Is the point inside the envelope */
  isValid: boolean;
  /** Current CG position */
  currentCG: number;
  /** Current weight */
  currentWeight: number;
  /** Forward limit at current weight */
  forwardLimit: number;
  /** Aft limit at current weight */
  aftLimit: number;
  /** Margin to forward limit (positive = inside) */
  forwardMargin: number;
  /** Margin to aft limit (positive = inside) */
  aftMargin: number;
  /** Violation details if invalid */
  violations: EnvelopeViolation[];
}

/**
 * Details of an envelope violation
 */
export interface EnvelopeViolation {
  type: 'forward' | 'aft' | 'overweight' | 'underweight';
  message: string;
  severity: 'warning' | 'error';
  value: number;
  limit: number;
}

/**
 * CG travel point during flight (for fuel burn visualization)
 */
export interface CGTravelPoint {
  /** Fuel remaining (kg) */
  fuelRemaining: number;
  /** Weight at this point */
  weight: number;
  /** CG at this point (% MAC) */
  cgPercent: number;
  /** Label (e.g., "Takeoff", "TOD", "Landing") */
  label?: string;
}

