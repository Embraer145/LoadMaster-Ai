/**
 * WGA (Western Global Airlines) Operator Configuration
 * 
 * This file contains operator-specific data such as fleet,
 * flight numbers, routes, and operational parameters.
 */

/**
 * Fleet aircraft entry
 */
export interface FleetAircraft {
  /** Registration number */
  reg: string;
  /** Aircraft type code */
  type: string;
}

/**
 * WGA Fleet Configuration
 */
export const WGA_FLEET: FleetAircraft[] = [
  { reg: 'N344KD', type: 'B747-400BCF' },
  { reg: 'N356KD', type: 'B747-400BDSF' },
  { reg: 'N404KZ', type: 'B747-400BCF' },
  { reg: 'N545KD', type: 'B747-400F' },
];

/**
 * WGA Flight Numbers
 */
export const WGA_FLIGHT_NUMBERS: string[] = [
  'KD3402', 
  'KD4405', 
  'KD1022', 
  'KD9901',
];

/**
 * Common Stopover Airports
 */
export const WGA_STOPOVERS: string[] = [
  'NONE', 
  'ANC', 
  'CVG', 
  'LEJ', 
  'ICN', 
  'NRT',
];

/**
 * Origin Airports
 */
export const WGA_ORIGINS: string[] = [
  'LAX', 
  'SFO', 
  'ORD', 
  'MIA', 
  'ANC',
];

/**
 * Destination information
 */
export interface DestinationInfo {
  code: string;
  city: string;
  flag: string;
}

/**
 * Common Destinations
 */
export const WGA_DESTINATIONS: DestinationInfo[] = [
  { code: 'JFK', city: 'New York', flag: '🇺🇸' },
  { code: 'LHR', city: 'London', flag: '🇬🇧' },
  { code: 'HND', city: 'Tokyo', flag: '🇯🇵' },
  { code: 'HKG', city: 'Hong Kong', flag: '🇭🇰' },
  { code: 'SYD', city: 'Sydney', flag: '🇦🇺' },
  { code: 'FRA', city: 'Frankfurt', flag: '🇩🇪' },
  { code: 'DXB', city: 'Dubai', flag: '🇦🇪' },
  { code: 'SIN', city: 'Singapore', flag: '🇸🇬' },
];

/**
 * Operator configuration object
 */
export const WGA_CONFIG = {
  name: 'Western Global Airlines',
  code: 'WGA',
  callsign: 'WORLD WIDE',
  fleet: WGA_FLEET,
  flightNumbers: WGA_FLIGHT_NUMBERS,
  stopovers: WGA_STOPOVERS,
  origins: WGA_ORIGINS,
  destinations: WGA_DESTINATIONS,
};

