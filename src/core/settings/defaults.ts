/**
 * Default Settings
 * 
 * Default values for all application settings.
 * These are based on industry standards and best practices.
 * 
 * SOURCES:
 * - IATA Dangerous Goods Regulations (DGR)
 * - ICAO Technical Instructions
 * - IATA Ground Operations Manual
 * - Boeing Freighter Operations Guidelines
 */

import type {
  AppSettings,
  GeneralSettings,
  OptimizationSettings,
  DGSettings,
  DGClassRule,
  DGSeparationRule,
  DGPositionRule,
  UnloadSettings,
  DisplaySettings,
} from './types';

/**
 * Default general settings
 */
export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  defaultOperator: 'WGA',
  autoSaveInterval: 30,
  weightUnit: 'kg',
  dateFormat: 'YYYY-MM-DD',
  auditLogging: true,
  requireFinalizeConfirmation: true,
};

/**
 * Default optimization settings
 */
export const DEFAULT_OPTIMIZATION_SETTINGS: OptimizationSettings = {
  defaultMode: 'safety',
  allowModeChange: true,
  minCGMargin: 2.0, // 2% MAC minimum margin from limits
  fuelEfficientCGTarget: 28.0, // 28% MAC for B747
  maxIterations: 1000,
  checkLateralBalance: true,
  maxLateralImbalance: 5000, // 5000 kg max difference left/right
};

/**
 * IATA Dangerous Goods Classes
 * Based on IATA DGR 65th Edition
 */
export const DEFAULT_DG_CLASS_RULES: DGClassRule[] = [
  // Class 1 - Explosives
  {
    classCode: '1.1',
    name: 'Explosives - Mass Explosion Hazard',
    description: 'Substances with mass explosion hazard',
    color: '#FF4444',
    allowedOnPassenger: false,
    allowedOnCargo: false, // Generally forbidden
    requiresSpecialHandling: true,
    mustBeAccessible: true,
    maxQuantity: 0,
  },
  {
    classCode: '1.2',
    name: 'Explosives - Projection Hazard',
    description: 'Substances with projection hazard but not mass explosion',
    color: '#FF4444',
    allowedOnPassenger: false,
    allowedOnCargo: false,
    requiresSpecialHandling: true,
    mustBeAccessible: true,
    maxQuantity: 0,
  },
  {
    classCode: '1.3',
    name: 'Explosives - Fire Hazard',
    description: 'Substances with fire hazard and minor blast/projection',
    color: '#FF6644',
    allowedOnPassenger: false,
    allowedOnCargo: true,
    requiresSpecialHandling: true,
    mustBeAccessible: true,
    maxQuantity: 100,
  },
  {
    classCode: '1.4',
    name: 'Explosives - No Significant Hazard',
    description: 'Substances presenting no significant hazard',
    color: '#FF8844',
    allowedOnPassenger: true,
    allowedOnCargo: true,
    requiresSpecialHandling: true,
    mustBeAccessible: false,
    maxQuantity: 500,
  },
  
  // Class 2 - Gases
  {
    classCode: '2.1',
    name: 'Flammable Gas',
    description: 'Gases which are flammable',
    color: '#FF0000',
    allowedOnPassenger: false,
    allowedOnCargo: true,
    requiresSpecialHandling: true,
    mustBeAccessible: false,
    maxQuantity: 0, // No limit
  },
  {
    classCode: '2.2',
    name: 'Non-Flammable Non-Toxic Gas',
    description: 'Gases which are neither flammable nor toxic',
    color: '#00CC00',
    allowedOnPassenger: true,
    allowedOnCargo: true,
    requiresSpecialHandling: false,
    mustBeAccessible: false,
    maxQuantity: 0,
  },
  {
    classCode: '2.3',
    name: 'Toxic Gas',
    description: 'Gases which are toxic',
    color: '#FFFFFF',
    allowedOnPassenger: false,
    allowedOnCargo: true,
    requiresSpecialHandling: true,
    mustBeAccessible: true,
    maxQuantity: 0,
  },
  
  // Class 3 - Flammable Liquids
  {
    classCode: '3',
    name: 'Flammable Liquid',
    description: 'Liquids with flash point below 60°C',
    color: '#FF0000',
    allowedOnPassenger: true, // Limited quantities
    allowedOnCargo: true,
    requiresSpecialHandling: true,
    mustBeAccessible: false,
    maxQuantity: 0,
  },
  
  // Class 4 - Flammable Solids
  {
    classCode: '4.1',
    name: 'Flammable Solid',
    description: 'Solids easily ignited by friction or heat',
    color: '#FF4444',
    allowedOnPassenger: true,
    allowedOnCargo: true,
    requiresSpecialHandling: true,
    mustBeAccessible: false,
    maxQuantity: 0,
  },
  {
    classCode: '4.2',
    name: 'Spontaneously Combustible',
    description: 'Substances liable to spontaneous combustion',
    color: '#FF4444',
    allowedOnPassenger: false,
    allowedOnCargo: true,
    requiresSpecialHandling: true,
    mustBeAccessible: true,
    maxQuantity: 0,
  },
  {
    classCode: '4.3',
    name: 'Dangerous When Wet',
    description: 'Substances emitting flammable gases when wet',
    color: '#0000FF',
    allowedOnPassenger: false,
    allowedOnCargo: true,
    requiresSpecialHandling: true,
    mustBeAccessible: true,
    maxQuantity: 0,
  },
  
  // Class 5 - Oxidizers
  {
    classCode: '5.1',
    name: 'Oxidizer',
    description: 'Substances that cause or enhance combustion',
    color: '#FFFF00',
    allowedOnPassenger: true,
    allowedOnCargo: true,
    requiresSpecialHandling: true,
    mustBeAccessible: false,
    maxQuantity: 0,
  },
  {
    classCode: '5.2',
    name: 'Organic Peroxide',
    description: 'Organic compounds containing oxygen',
    color: '#FFFF00',
    allowedOnPassenger: false,
    allowedOnCargo: true,
    requiresSpecialHandling: true,
    mustBeAccessible: true,
    maxQuantity: 0,
  },
  
  // Class 6 - Toxic/Infectious
  {
    classCode: '6.1',
    name: 'Toxic Substance',
    description: 'Substances liable to cause death or injury',
    color: '#FFFFFF',
    allowedOnPassenger: true,
    allowedOnCargo: true,
    requiresSpecialHandling: true,
    mustBeAccessible: false,
    maxQuantity: 0,
  },
  {
    classCode: '6.2',
    name: 'Infectious Substance',
    description: 'Substances containing pathogens',
    color: '#FFFFFF',
    allowedOnPassenger: true,
    allowedOnCargo: true,
    requiresSpecialHandling: true,
    mustBeAccessible: true,
    maxQuantity: 0,
  },
  
  // Class 7 - Radioactive
  {
    classCode: '7',
    name: 'Radioactive Material',
    description: 'Materials with specific activity > 70 kBq/kg',
    color: '#FFFF00',
    allowedOnPassenger: true, // Categories I-II only
    allowedOnCargo: true,
    requiresSpecialHandling: true,
    mustBeAccessible: true,
    maxQuantity: 0,
  },
  
  // Class 8 - Corrosives
  {
    classCode: '8',
    name: 'Corrosive Substance',
    description: 'Substances causing destruction of living tissue',
    color: '#000000',
    allowedOnPassenger: true,
    allowedOnCargo: true,
    requiresSpecialHandling: true,
    mustBeAccessible: false,
    maxQuantity: 0,
  },
  
  // Class 9 - Miscellaneous
  {
    classCode: '9',
    name: 'Miscellaneous Dangerous Goods',
    description: 'Substances presenting hazards not covered by other classes',
    color: '#FFFFFF',
    allowedOnPassenger: true,
    allowedOnCargo: true,
    requiresSpecialHandling: false,
    mustBeAccessible: false,
    maxQuantity: 0,
  },
];

/**
 * DG Separation Rules
 * Based on IATA DGR Table 9.3.A
 * 
 * Separation types:
 * - prohibited: Cannot be on same aircraft
 * - segregated: Must be in different compartments
 * - separated: Must have at least one non-DG ULD between them
 * - allowed: Can be adjacent
 */
export const DEFAULT_DG_SEPARATION_RULES: DGSeparationRule[] = [
  // Explosives separation
  { class1: '1.1', class2: '1.1', separation: 'prohibited', minPositions: 0, description: 'Multiple 1.1 forbidden' },
  { class1: '1.1', class2: '3', separation: 'prohibited', minPositions: 0, description: 'Explosives/Flammable Liquids forbidden' },
  { class1: '1.3', class2: '2.1', separation: 'segregated', minPositions: 3, description: 'Explosives/Flammable Gas segregation' },
  { class1: '1.4', class2: '3', separation: 'separated', minPositions: 1, description: 'Minor explosives/Flammable separation' },
  
  // Oxidizer separation
  { class1: '5.1', class2: '3', separation: 'separated', minPositions: 1, description: 'Oxidizer/Flammable Liquid separation' },
  { class1: '5.1', class2: '4.1', separation: 'separated', minPositions: 1, description: 'Oxidizer/Flammable Solid separation' },
  { class1: '5.2', class2: '3', separation: 'segregated', minPositions: 2, description: 'Organic Peroxide/Flammable segregation' },
  
  // Corrosive separation
  { class1: '8', class2: '1.4', separation: 'separated', minPositions: 1, description: 'Corrosive/Explosives separation' },
  
  // Radioactive separation
  { class1: '7', class2: '7', separation: 'separated', minPositions: 1, description: 'Radioactive materials must be separated' },
  { class1: '7', class2: '6.2', separation: 'segregated', minPositions: 2, description: 'Radioactive/Infectious segregation' },
  
  // Infectious separation
  { class1: '6.2', class2: '3', separation: 'separated', minPositions: 1, description: 'Infectious/Flammable separation' },
];

/**
 * DG Position Rules
 * Based on aircraft-specific requirements
 */
export const DEFAULT_DG_POSITION_RULES: DGPositionRule[] = [
  // Accessible positions for DG requiring inspection
  {
    positionPattern: 'A*',
    allowedClasses: [],
    prohibitedClasses: ['1.1', '1.2', '7'], // No high-risk DG near nose door
    maxDGWeight: 5000,
    reason: 'Nose section restrictions for crew safety',
  },
  {
    positionPattern: '*L',
    allowedClasses: [],
    prohibitedClasses: [],
    maxDGWeight: 0, // No limit
    reason: 'Left side positions - standard rules apply',
  },
  {
    positionPattern: '*R',
    allowedClasses: [],
    prohibitedClasses: [],
    maxDGWeight: 0,
    reason: 'Right side positions - standard rules apply',
  },
  // Lower deck bulk - no DG
  {
    positionPattern: '5*',
    allowedClasses: ['9'], // Only Class 9 allowed in bulk
    prohibitedClasses: ['1.*', '2.*', '3', '4.*', '5.*', '6.*', '7', '8'],
    maxDGWeight: 500,
    reason: 'Bulk cargo compartment - limited DG',
  },
];

/**
 * Default DG settings
 */
export const DEFAULT_DG_SETTINGS: DGSettings = {
  enabled: true,
  requireNotoc: true,
  classRules: DEFAULT_DG_CLASS_RULES,
  separationRules: DEFAULT_DG_SEPARATION_RULES,
  positionRules: DEFAULT_DG_POSITION_RULES,
};

/**
 * Default Unload Efficiency Settings
 * 
 * Based on:
 * - IATA Ground Operations Manual
 * - Airline turnaround optimization studies
 * - Standard cargo door locations on B747
 */
export const DEFAULT_UNLOAD_SETTINGS: UnloadSettings = {
  enabled: true,
  strategy: 'destination_group',
  accessibilityOverrides: {}, // Use defaults from optimizer/config.ts
  groupByDestination: true,
  // First-off cargo should be near main deck side door (G-K positions)
  firstOffZones: ['GL', 'GR', 'HL', 'HR', 'JL', 'JR'],
  // Last-off cargo in tail section
  lastOffZones: ['RL', 'RR', 'SL', 'SR', 'T'],
};

/**
 * Default display settings
 */
export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  theme: 'dark',
  showPositionIds: true,
  showWeightOnPositions: true,
  highlightOverweight: true,
  showCGTravel: true,
  aiAnimationSpeed: 150,
};

/**
 * Complete default settings
 */
export const DEFAULT_SETTINGS: AppSettings = {
  general: DEFAULT_GENERAL_SETTINGS,
  optimization: DEFAULT_OPTIMIZATION_SETTINGS,
  dangerousGoods: DEFAULT_DG_SETTINGS,
  unloadEfficiency: DEFAULT_UNLOAD_SETTINGS,
  display: DEFAULT_DISPLAY_SETTINGS,
};

/**
 * Get default settings
 */
export function getDefaultSettings(): AppSettings {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

