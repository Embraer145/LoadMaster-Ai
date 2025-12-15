/**
 * B747-400F Envelope Definition
 * 
 * Actual envelope data for Boeing 747-400 Freighter.
 * This is sample data - real data should come from aircraft manual.
 */

import type { EnvelopeDefinition } from './types';

/**
 * B747-400F Takeoff Envelope
 * 
 * Note: This is simplified sample data.
 * Real envelope has more complex curves and additional limits.
 */
export const B747_TAKEOFF_ENVELOPE: EnvelopeDefinition = {
  id: 'b747-400f-takeoff',
  name: 'B747-400F Takeoff Envelope',
  phase: 'takeoff',
  
  forwardLimit: {
    label: 'Forward Limit',
    points: [
      { weight: 160000, cgPercent: 13 },
      { weight: 200000, cgPercent: 11 },
      { weight: 240000, cgPercent: 9 },
      { weight: 280000, cgPercent: 9 },
      { weight: 320000, cgPercent: 13 },
      { weight: 360000, cgPercent: 17 },
      { weight: 396890, cgPercent: 20 },
    ],
  },
  
  aftLimit: {
    label: 'Aft Limit',
    points: [
      { weight: 160000, cgPercent: 33 },
      { weight: 240000, cgPercent: 33 },
      { weight: 300000, cgPercent: 33 },
      { weight: 350000, cgPercent: 33 },
      { weight: 396890, cgPercent: 33 },
    ],
  },
  
  weightLimits: {
    min: 160000,
    max: 396890, // MTOW
  },
  
  cgLimits: {
    forward: 9,
    aft: 33,
  },
};

/**
 * B747-400F Zero Fuel Envelope
 */
export const B747_ZFW_ENVELOPE: EnvelopeDefinition = {
  id: 'b747-400f-zfw',
  name: 'B747-400F Zero Fuel Weight Envelope',
  phase: 'zero_fuel',
  
  forwardLimit: {
    label: 'Forward Limit',
    points: [
      { weight: 160000, cgPercent: 14 },
      { weight: 200000, cgPercent: 12 },
      { weight: 240000, cgPercent: 10 },
      { weight: 288000, cgPercent: 14 },
    ],
  },
  
  aftLimit: {
    label: 'Aft Limit',
    points: [
      { weight: 160000, cgPercent: 32 },
      { weight: 240000, cgPercent: 32 },
      { weight: 288000, cgPercent: 32 },
    ],
  },
  
  weightLimits: {
    min: 160000,
    max: 288000, // MZFW
  },
  
  cgLimits: {
    forward: 10,
    aft: 32,
  },
};

/**
 * B747-400F Landing Envelope
 */
export const B747_LANDING_ENVELOPE: EnvelopeDefinition = {
  id: 'b747-400f-landing',
  name: 'B747-400F Landing Envelope',
  phase: 'landing',
  
  forwardLimit: {
    label: 'Forward Limit',
    points: [
      { weight: 160000, cgPercent: 13 },
      { weight: 200000, cgPercent: 11 },
      { weight: 240000, cgPercent: 10 },
      { weight: 280000, cgPercent: 12 },
      { weight: 302090, cgPercent: 15 },
    ],
  },
  
  aftLimit: {
    label: 'Aft Limit',
    points: [
      { weight: 160000, cgPercent: 33 },
      { weight: 240000, cgPercent: 33 },
      { weight: 302090, cgPercent: 33 },
    ],
  },
  
  weightLimits: {
    min: 160000,
    max: 302090, // MLW
  },
  
  cgLimits: {
    forward: 10,
    aft: 33,
  },
};

/**
 * Get envelope by phase
 */
export function getB747Envelope(phase: 'takeoff' | 'zero_fuel' | 'landing'): EnvelopeDefinition {
  switch (phase) {
    case 'takeoff':
      return B747_TAKEOFF_ENVELOPE;
    case 'zero_fuel':
      return B747_ZFW_ENVELOPE;
    case 'landing':
      return B747_LANDING_ENVELOPE;
    default:
      return B747_TAKEOFF_ENVELOPE;
  }
}

/**
 * Get all B747 envelopes
 */
export function getAllB747Envelopes(): EnvelopeDefinition[] {
  return [
    B747_TAKEOFF_ENVELOPE,
    B747_ZFW_ENVELOPE,
    B747_LANDING_ENVELOPE,
  ];
}

