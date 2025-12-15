/**
 * Airport Database
 * 
 * Common airports used in cargo operations.
 * This list can be extended via admin settings or company imports.
 */

/**
 * Airport information
 */
export interface Airport {
  /** IATA code (3 letters) */
  code: string;
  /** ICAO code (4 letters) */
  icao: string;
  /** Airport name */
  name: string;
  /** City name */
  city: string;
  /** Country */
  country: string;
  /** Country flag emoji */
  flag: string;
  /** Timezone */
  timezone: string;
  /** Is this a common cargo hub */
  isCargoHub: boolean;
}

/**
 * Common cargo airports - major hubs worldwide
 * Sorted by region for easier lookup
 */
export const COMMON_AIRPORTS: Airport[] = [
  // North America
  { code: 'LAX', icao: 'KLAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'USA', flag: '🇺🇸', timezone: 'America/Los_Angeles', isCargoHub: true },
  { code: 'JFK', icao: 'KJFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA', flag: '🇺🇸', timezone: 'America/New_York', isCargoHub: true },
  { code: 'ORD', icao: 'KORD', name: "O'Hare International", city: 'Chicago', country: 'USA', flag: '🇺🇸', timezone: 'America/Chicago', isCargoHub: true },
  { code: 'MIA', icao: 'KMIA', name: 'Miami International', city: 'Miami', country: 'USA', flag: '🇺🇸', timezone: 'America/New_York', isCargoHub: true },
  { code: 'ANC', icao: 'PANC', name: 'Ted Stevens Anchorage International', city: 'Anchorage', country: 'USA', flag: '🇺🇸', timezone: 'America/Anchorage', isCargoHub: true },
  { code: 'SFO', icao: 'KSFO', name: 'San Francisco International', city: 'San Francisco', country: 'USA', flag: '🇺🇸', timezone: 'America/Los_Angeles', isCargoHub: true },
  { code: 'DFW', icao: 'KDFW', name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'USA', flag: '🇺🇸', timezone: 'America/Chicago', isCargoHub: true },
  { code: 'ATL', icao: 'KATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', country: 'USA', flag: '🇺🇸', timezone: 'America/New_York', isCargoHub: true },
  { code: 'CVG', icao: 'KCVG', name: 'Cincinnati/Northern Kentucky International', city: 'Cincinnati', country: 'USA', flag: '🇺🇸', timezone: 'America/New_York', isCargoHub: true },
  { code: 'MEM', icao: 'KMEM', name: 'Memphis International', city: 'Memphis', country: 'USA', flag: '🇺🇸', timezone: 'America/Chicago', isCargoHub: true },
  { code: 'YYZ', icao: 'CYYZ', name: 'Toronto Pearson International', city: 'Toronto', country: 'Canada', flag: '🇨🇦', timezone: 'America/Toronto', isCargoHub: true },
  { code: 'YVR', icao: 'CYVR', name: 'Vancouver International', city: 'Vancouver', country: 'Canada', flag: '🇨🇦', timezone: 'America/Vancouver', isCargoHub: true },
  { code: 'MEX', icao: 'MMMX', name: 'Mexico City International', city: 'Mexico City', country: 'Mexico', flag: '🇲🇽', timezone: 'America/Mexico_City', isCargoHub: true },
  
  // Europe
  { code: 'FRA', icao: 'EDDF', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', flag: '🇩🇪', timezone: 'Europe/Berlin', isCargoHub: true },
  { code: 'AMS', icao: 'EHAM', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱', timezone: 'Europe/Amsterdam', isCargoHub: true },
  { code: 'LHR', icao: 'EGLL', name: 'London Heathrow', city: 'London', country: 'UK', flag: '🇬🇧', timezone: 'Europe/London', isCargoHub: true },
  { code: 'CDG', icao: 'LFPG', name: 'Paris Charles de Gaulle', city: 'Paris', country: 'France', flag: '🇫🇷', timezone: 'Europe/Paris', isCargoHub: true },
  { code: 'LEJ', icao: 'EDDP', name: 'Leipzig/Halle Airport', city: 'Leipzig', country: 'Germany', flag: '🇩🇪', timezone: 'Europe/Berlin', isCargoHub: true },
  { code: 'LGG', icao: 'EBLG', name: 'Liège Airport', city: 'Liège', country: 'Belgium', flag: '🇧🇪', timezone: 'Europe/Brussels', isCargoHub: true },
  { code: 'CGN', icao: 'EDDK', name: 'Cologne Bonn Airport', city: 'Cologne', country: 'Germany', flag: '🇩🇪', timezone: 'Europe/Berlin', isCargoHub: true },
  { code: 'MXP', icao: 'LIMC', name: 'Milan Malpensa', city: 'Milan', country: 'Italy', flag: '🇮🇹', timezone: 'Europe/Rome', isCargoHub: true },
  { code: 'BRU', icao: 'EBBR', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium', flag: '🇧🇪', timezone: 'Europe/Brussels', isCargoHub: true },
  { code: 'ZRH', icao: 'LSZH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', flag: '🇨🇭', timezone: 'Europe/Zurich', isCargoHub: true },
  
  // Middle East
  { code: 'DXB', icao: 'OMDB', name: 'Dubai International', city: 'Dubai', country: 'UAE', flag: '🇦🇪', timezone: 'Asia/Dubai', isCargoHub: true },
  { code: 'DOH', icao: 'OTHH', name: 'Hamad International', city: 'Doha', country: 'Qatar', flag: '🇶🇦', timezone: 'Asia/Qatar', isCargoHub: true },
  { code: 'AUH', icao: 'OMAA', name: 'Abu Dhabi International', city: 'Abu Dhabi', country: 'UAE', flag: '🇦🇪', timezone: 'Asia/Dubai', isCargoHub: true },
  { code: 'BAH', icao: 'OBBI', name: 'Bahrain International', city: 'Manama', country: 'Bahrain', flag: '🇧🇭', timezone: 'Asia/Bahrain', isCargoHub: true },
  { code: 'RUH', icao: 'OERK', name: 'King Khalid International', city: 'Riyadh', country: 'Saudi Arabia', flag: '🇸🇦', timezone: 'Asia/Riyadh', isCargoHub: true },
  
  // Asia Pacific
  { code: 'HKG', icao: 'VHHH', name: 'Hong Kong International', city: 'Hong Kong', country: 'Hong Kong', flag: '🇭🇰', timezone: 'Asia/Hong_Kong', isCargoHub: true },
  { code: 'PVG', icao: 'ZSPD', name: 'Shanghai Pudong International', city: 'Shanghai', country: 'China', flag: '🇨🇳', timezone: 'Asia/Shanghai', isCargoHub: true },
  { code: 'ICN', icao: 'RKSI', name: 'Incheon International', city: 'Seoul', country: 'South Korea', flag: '🇰🇷', timezone: 'Asia/Seoul', isCargoHub: true },
  { code: 'NRT', icao: 'RJAA', name: 'Narita International', city: 'Tokyo', country: 'Japan', flag: '🇯🇵', timezone: 'Asia/Tokyo', isCargoHub: true },
  { code: 'HND', icao: 'RJTT', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan', flag: '🇯🇵', timezone: 'Asia/Tokyo', isCargoHub: true },
  { code: 'SIN', icao: 'WSSS', name: 'Singapore Changi', city: 'Singapore', country: 'Singapore', flag: '🇸🇬', timezone: 'Asia/Singapore', isCargoHub: true },
  { code: 'TPE', icao: 'RCTP', name: 'Taiwan Taoyuan International', city: 'Taipei', country: 'Taiwan', flag: '🇹🇼', timezone: 'Asia/Taipei', isCargoHub: true },
  { code: 'BKK', icao: 'VTBS', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', flag: '🇹🇭', timezone: 'Asia/Bangkok', isCargoHub: true },
  { code: 'KUL', icao: 'WMKK', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'Malaysia', flag: '🇲🇾', timezone: 'Asia/Kuala_Lumpur', isCargoHub: true },
  { code: 'DEL', icao: 'VIDP', name: 'Indira Gandhi International', city: 'New Delhi', country: 'India', flag: '🇮🇳', timezone: 'Asia/Kolkata', isCargoHub: true },
  { code: 'BOM', icao: 'VABB', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'India', flag: '🇮🇳', timezone: 'Asia/Kolkata', isCargoHub: true },
  { code: 'SYD', icao: 'YSSY', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', flag: '🇦🇺', timezone: 'Australia/Sydney', isCargoHub: true },
  { code: 'MEL', icao: 'YMML', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', flag: '🇦🇺', timezone: 'Australia/Melbourne', isCargoHub: true },
  
  // Africa
  { code: 'JNB', icao: 'FAOR', name: 'O.R. Tambo International', city: 'Johannesburg', country: 'South Africa', flag: '🇿🇦', timezone: 'Africa/Johannesburg', isCargoHub: true },
  { code: 'NBO', icao: 'HKJK', name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya', flag: '🇰🇪', timezone: 'Africa/Nairobi', isCargoHub: true },
  { code: 'ADD', icao: 'HAAB', name: 'Addis Ababa Bole International', city: 'Addis Ababa', country: 'Ethiopia', flag: '🇪🇹', timezone: 'Africa/Addis_Ababa', isCargoHub: true },
  
  // South America
  { code: 'GRU', icao: 'SBGR', name: 'São Paulo–Guarulhos International', city: 'São Paulo', country: 'Brazil', flag: '🇧🇷', timezone: 'America/Sao_Paulo', isCargoHub: true },
  { code: 'BOG', icao: 'SKBO', name: 'El Dorado International', city: 'Bogotá', country: 'Colombia', flag: '🇨🇴', timezone: 'America/Bogota', isCargoHub: true },
  { code: 'SCL', icao: 'SCEL', name: 'Arturo Merino Benítez International', city: 'Santiago', country: 'Chile', flag: '🇨🇱', timezone: 'America/Santiago', isCargoHub: true },
];

/**
 * Get airport by IATA code
 */
export function getAirportByCode(code: string): Airport | undefined {
  return COMMON_AIRPORTS.find(a => a.code.toUpperCase() === code.toUpperCase());
}

/**
 * Get airport by ICAO code
 */
export function getAirportByICAO(icao: string): Airport | undefined {
  return COMMON_AIRPORTS.find(a => a.icao.toUpperCase() === icao.toUpperCase());
}

/**
 * Search airports by name, city, or code
 */
export function searchAirports(query: string): Airport[] {
  const q = query.toLowerCase();
  return COMMON_AIRPORTS.filter(a => 
    a.code.toLowerCase().includes(q) ||
    a.icao.toLowerCase().includes(q) ||
    a.city.toLowerCase().includes(q) ||
    a.name.toLowerCase().includes(q) ||
    a.country.toLowerCase().includes(q)
  );
}

/**
 * Get all cargo hub airports
 */
export function getCargoHubs(): Airport[] {
  return COMMON_AIRPORTS.filter(a => a.isCargoHub);
}

/**
 * Get airports by region
 */
export function getAirportsByCountry(country: string): Airport[] {
  return COMMON_AIRPORTS.filter(a => 
    a.country.toLowerCase() === country.toLowerCase()
  );
}

/**
 * Create a custom airport entry for manual input
 */
export function createCustomAirport(
  code: string,
  city: string,
  country: string = 'Unknown',
  flag: string = '🏳️'
): Airport {
  return {
    code: code.toUpperCase(),
    icao: code.toUpperCase(), // Use IATA as fallback
    name: `${city} Airport`,
    city,
    country,
    flag,
    timezone: 'UTC',
    isCargoHub: false,
  };
}

/**
 * Validate IATA code format
 */
export function isValidIATACode(code: string): boolean {
  return /^[A-Z]{3}$/i.test(code);
}

