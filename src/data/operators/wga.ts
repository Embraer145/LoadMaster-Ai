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
  /** Fleet group (used by UI to select aircraft family) */
  fleet: 'B747' | 'MD11';
  /** Aircraft type code */
  type: string;
}

/**
 * WGA Fleet Configuration
 */
export const WGA_FLEET: FleetAircraft[] = [
  // 747 fleet (as provided by user; also appears in public fleet listings)
  { reg: 'N258SN', fleet: 'B747', type: 'B747-400F' },
  { reg: 'N344KD', fleet: 'B747', type: 'B747-400F' },
  { reg: 'N356KD', fleet: 'B747', type: 'B747-400F' },
  { reg: 'N452SN', fleet: 'B747', type: 'B747-400F' },

  // Demo prototypes (for showing different operator naming/layout conventions)
  { reg: 'KOREAN', fleet: 'B747', type: 'B747-400F' },
  { reg: 'ATLAS', fleet: 'B747', type: 'B747-400F-NUMERIC' },
  { reg: 'UPS', fleet: 'B747', type: 'B747-400F-UPS' },
  { reg: 'CUSTOM', fleet: 'B747', type: 'B747-400F' },

  // MD-11 fleet (best-effort from public fleet listings; verify/adjust as needed)
  { reg: 'N411SN', fleet: 'MD11', type: 'MD-11F' },
  { reg: 'N412SN', fleet: 'MD11', type: 'MD-11F' },
  { reg: 'N415JN', fleet: 'MD11', type: 'MD-11F' },
  { reg: 'N512JN', fleet: 'MD11', type: 'MD-11F' },
  { reg: 'N513SN', fleet: 'MD11', type: 'MD-11F' },
  { reg: 'N542KD', fleet: 'MD11', type: 'MD-11F' },
  { reg: 'N543JN', fleet: 'MD11', type: 'MD-11F' },
  { reg: 'N545JN', fleet: 'MD11', type: 'MD-11F' },
  { reg: 'N546JN', fleet: 'MD11', type: 'MD-11F' },
  { reg: 'N581JN', fleet: 'MD11', type: 'MD-11F' },
  { reg: 'N781SN', fleet: 'MD11', type: 'MD-11F' },
  { reg: 'N783SN', fleet: 'MD11', type: 'MD-11F' },
  { reg: 'N784SN', fleet: 'MD11', type: 'MD-11F' },
  { reg: 'N799JN', fleet: 'MD11', type: 'MD-11F' },
  { reg: 'N804SN', fleet: 'MD11', type: 'MD-11F' },
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

