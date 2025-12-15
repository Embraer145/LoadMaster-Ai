/**
 * Envelope Geometry
 * 
 * Geometric calculations for envelope operations.
 * Includes point-in-polygon, interpolation, and distance calculations.
 */

import type { EnvelopePoint, EnvelopeBoundary } from './types';

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Calculate the interpolation factor for a value between two bounds
 */
export function inverseLerp(a: number, b: number, value: number): number {
  if (a === b) return 0;
  return (value - a) / (b - a);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Interpolate CG limit at a given weight from boundary points
 * Uses linear interpolation between defined points
 * 
 * @param weight - Weight to interpolate at
 * @param boundary - Boundary definition with points
 * @returns Interpolated CG limit at the weight
 */
export function interpolateCGAtWeight(
  weight: number,
  boundary: EnvelopeBoundary
): number {
  const points = boundary.points;
  
  if (points.length === 0) {
    throw new Error('Boundary has no points defined');
  }
  
  if (points.length === 1) {
    return points[0].cgPercent;
  }
  
  // Sort points by weight (should already be sorted, but ensure)
  const sorted = [...points].sort((a, b) => a.weight - b.weight);
  
  // If weight is below first point, extrapolate or return first
  if (weight <= sorted[0].weight) {
    // Extrapolate using first two points
    if (sorted.length >= 2) {
      const t = inverseLerp(sorted[0].weight, sorted[1].weight, weight);
      return lerp(sorted[0].cgPercent, sorted[1].cgPercent, t);
    }
    return sorted[0].cgPercent;
  }
  
  // If weight is above last point, extrapolate or return last
  if (weight >= sorted[sorted.length - 1].weight) {
    if (sorted.length >= 2) {
      const lastIdx = sorted.length - 1;
      const t = inverseLerp(sorted[lastIdx - 1].weight, sorted[lastIdx].weight, weight);
      return lerp(sorted[lastIdx - 1].cgPercent, sorted[lastIdx].cgPercent, t);
    }
    return sorted[sorted.length - 1].cgPercent;
  }
  
  // Find the two points to interpolate between
  for (let i = 0; i < sorted.length - 1; i++) {
    if (weight >= sorted[i].weight && weight <= sorted[i + 1].weight) {
      const t = inverseLerp(sorted[i].weight, sorted[i + 1].weight, weight);
      return lerp(sorted[i].cgPercent, sorted[i + 1].cgPercent, t);
    }
  }
  
  // Fallback (shouldn't reach here)
  return sorted[0].cgPercent;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * 
 * @param point - Point to check (x = cgPercent, y = weight)
 * @param polygon - Array of points defining the polygon
 * @returns True if point is inside polygon
 */
export function isPointInPolygon(
  point: EnvelopePoint,
  polygon: EnvelopePoint[]
): boolean {
  const x = point.cgPercent;
  const y = point.weight;
  
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].cgPercent;
    const yi = polygon[i].weight;
    const xj = polygon[j].cgPercent;
    const yj = polygon[j].weight;
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Build a closed polygon from forward and aft boundaries
 * 
 * @param forward - Forward limit boundary
 * @param aft - Aft limit boundary
 * @returns Closed polygon as array of points
 */
export function buildEnvelopePolygon(
  forward: EnvelopeBoundary,
  aft: EnvelopeBoundary
): EnvelopePoint[] {
  // Sort forward points by weight ascending
  const forwardSorted = [...forward.points].sort((a, b) => a.weight - b.weight);
  
  // Sort aft points by weight descending (to close the polygon)
  const aftSorted = [...aft.points].sort((a, b) => b.weight - a.weight);
  
  // Combine to form closed polygon
  return [...forwardSorted, ...aftSorted];
}

/**
 * Calculate the distance from a point to the nearest envelope boundary
 * Positive = inside envelope, Negative = outside envelope
 * 
 * @param point - Point to check
 * @param forwardLimit - Forward CG limit at this weight
 * @param aftLimit - Aft CG limit at this weight
 * @returns Distance object with margins
 */
export function calculateMargins(
  cgPercent: number,
  forwardLimit: number,
  aftLimit: number
): { forwardMargin: number; aftMargin: number; minMargin: number } {
  const forwardMargin = cgPercent - forwardLimit;
  const aftMargin = aftLimit - cgPercent;
  const minMargin = Math.min(forwardMargin, aftMargin);
  
  return { forwardMargin, aftMargin, minMargin };
}

/**
 * Calculate optimal CG target (center of envelope at weight)
 * 
 * @param weight - Current weight
 * @param forwardLimit - Forward limit at weight
 * @param aftLimit - Aft limit at weight
 * @param bias - Bias towards aft (0 = center, 1 = aft limit)
 * @returns Target CG percentage
 */
export function calculateOptimalCG(
  forwardLimit: number,
  aftLimit: number,
  bias: number = 0
): number {
  const center = (forwardLimit + aftLimit) / 2;
  return lerp(center, aftLimit, clamp(bias, 0, 0.8)); // Max 80% towards aft
}

