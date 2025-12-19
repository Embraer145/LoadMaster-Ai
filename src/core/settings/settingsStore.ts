/**
 * Settings Store
 * 
 * Zustand store for application settings.
 * Settings are persisted to localStorage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, DGClassRule, DGSeparationRule, DGPositionRule } from './types';
import { getDefaultSettings } from './defaults';
import type { OptimizationMode } from '../optimizer/types';

/**
 * Settings store state
 */
interface SettingsState {
  settings: AppSettings;
  
  // Actions
  updateGeneralSettings: (updates: Partial<AppSettings['general']>) => void;
  updateStandardWeightsSettings: (updates: Partial<AppSettings['standardWeights']>) => void;
  updateOptimizationSettings: (updates: Partial<AppSettings['optimization']>) => void;
  updateDGSettings: (updates: Partial<AppSettings['dangerousGoods']>) => void;
  updateUnloadSettings: (updates: Partial<AppSettings['unloadEfficiency']>) => void;
  updateDisplaySettings: (updates: Partial<AppSettings['display']>) => void;
  updateComplianceSettings: (updates: Partial<AppSettings['compliance']>) => void;
  
  // DG rule management
  addDGClassRule: (rule: DGClassRule) => void;
  updateDGClassRule: (classCode: string, updates: Partial<DGClassRule>) => void;
  removeDGClassRule: (classCode: string) => void;
  addDGSeparationRule: (rule: DGSeparationRule) => void;
  removeDGSeparationRule: (class1: string, class2: string) => void;
  addDGPositionRule: (rule: DGPositionRule) => void;
  removeDGPositionRule: (positionPattern: string) => void;
  
  // Reset
  resetToDefaults: () => void;
  resetSection: (section: keyof AppSettings) => void;
  
  // Getters
  getOptimizationMode: () => OptimizationMode;
  isDGEnabled: () => boolean;
  getDGClassRule: (classCode: string) => DGClassRule | undefined;
}

/**
 * Settings store with localStorage persistence
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: getDefaultSettings(),
      
      // General settings
      updateGeneralSettings: (updates) => set((state) => ({
        settings: {
          ...state.settings,
          general: { ...state.settings.general, ...updates },
        },
      })),

      // Standard weights
      updateStandardWeightsSettings: (updates) => set((state) => ({
        settings: {
          ...state.settings,
          standardWeights: { ...state.settings.standardWeights, ...updates },
        },
      })),
      
      // Optimization settings
      updateOptimizationSettings: (updates) => set((state) => ({
        settings: {
          ...state.settings,
          optimization: { ...state.settings.optimization, ...updates },
        },
      })),
      
      // DG settings
      updateDGSettings: (updates) => set((state) => ({
        settings: {
          ...state.settings,
          dangerousGoods: { ...state.settings.dangerousGoods, ...updates },
        },
      })),
      
      // Unload settings
      updateUnloadSettings: (updates) => set((state) => ({
        settings: {
          ...state.settings,
          unloadEfficiency: { ...state.settings.unloadEfficiency, ...updates },
        },
      })),
      
      // Display settings
      updateDisplaySettings: (updates) => set((state) => ({
        settings: {
          ...state.settings,
          display: { ...state.settings.display, ...updates },
        },
      })),

      // Compliance settings
      updateComplianceSettings: (updates) => set((state) => ({
        settings: {
          ...state.settings,
          compliance: { ...state.settings.compliance, ...updates },
        },
      })),
      
      // DG Class Rules
      addDGClassRule: (rule) => set((state) => ({
        settings: {
          ...state.settings,
          dangerousGoods: {
            ...state.settings.dangerousGoods,
            classRules: [...state.settings.dangerousGoods.classRules, rule],
          },
        },
      })),
      
      updateDGClassRule: (classCode, updates) => set((state) => ({
        settings: {
          ...state.settings,
          dangerousGoods: {
            ...state.settings.dangerousGoods,
            classRules: state.settings.dangerousGoods.classRules.map(r =>
              r.classCode === classCode ? { ...r, ...updates } : r
            ),
          },
        },
      })),
      
      removeDGClassRule: (classCode) => set((state) => ({
        settings: {
          ...state.settings,
          dangerousGoods: {
            ...state.settings.dangerousGoods,
            classRules: state.settings.dangerousGoods.classRules.filter(
              r => r.classCode !== classCode
            ),
          },
        },
      })),
      
      // DG Separation Rules
      addDGSeparationRule: (rule) => set((state) => ({
        settings: {
          ...state.settings,
          dangerousGoods: {
            ...state.settings.dangerousGoods,
            separationRules: [...state.settings.dangerousGoods.separationRules, rule],
          },
        },
      })),
      
      removeDGSeparationRule: (class1, class2) => set((state) => ({
        settings: {
          ...state.settings,
          dangerousGoods: {
            ...state.settings.dangerousGoods,
            separationRules: state.settings.dangerousGoods.separationRules.filter(
              r => !(r.class1 === class1 && r.class2 === class2)
            ),
          },
        },
      })),
      
      // DG Position Rules
      addDGPositionRule: (rule) => set((state) => ({
        settings: {
          ...state.settings,
          dangerousGoods: {
            ...state.settings.dangerousGoods,
            positionRules: [...state.settings.dangerousGoods.positionRules, rule],
          },
        },
      })),
      
      removeDGPositionRule: (positionPattern) => set((state) => ({
        settings: {
          ...state.settings,
          dangerousGoods: {
            ...state.settings.dangerousGoods,
            positionRules: state.settings.dangerousGoods.positionRules.filter(
              r => r.positionPattern !== positionPattern
            ),
          },
        },
      })),
      
      // Reset
      resetToDefaults: () => set({ settings: getDefaultSettings() }),
      
      resetSection: (section) => {
        const defaults = getDefaultSettings();
        set((state) => ({
          settings: {
            ...state.settings,
            [section]: defaults[section],
          },
        }));
      },
      
      // Getters
      getOptimizationMode: () => get().settings.optimization.defaultMode,
      
      isDGEnabled: () => get().settings.dangerousGoods.enabled,
      
      getDGClassRule: (classCode) => 
        get().settings.dangerousGoods.classRules.find(r => r.classCode === classCode),
    }),
    {
      name: 'loadmaster-settings',
      version: 3,
      migrate: (persisted: unknown) => {
        // Ensure newly-added settings sections exist for older persisted states.
        // Zustand persist stores shape: { state: ..., version: ... } in localStorage.
        try {
          const defaults = getDefaultSettings();
          const p = persisted as any;
          const prevState = (p?.state ?? p) as any;
          const prevSettings = prevState?.settings ?? {};

          return {
            ...prevState,
            settings: {
              ...defaults,
              ...prevSettings,
              general: { ...defaults.general, ...(prevSettings.general ?? {}) },
              standardWeights: { ...defaults.standardWeights, ...(prevSettings.standardWeights ?? {}) },
              optimization: { ...defaults.optimization, ...(prevSettings.optimization ?? {}) },
              dangerousGoods: { ...defaults.dangerousGoods, ...(prevSettings.dangerousGoods ?? {}) },
              unloadEfficiency: { ...defaults.unloadEfficiency, ...(prevSettings.unloadEfficiency ?? {}) },
              display: { ...defaults.display, ...(prevSettings.display ?? {}) },
              compliance: { ...defaults.compliance, ...(prevSettings.compliance ?? {}) },
            },
          } as any;
        } catch {
          return persisted as any;
        }
      },
    }
  )
);

/**
 * Hook to get current settings
 */
export function useSettings() {
  return useSettingsStore((state) => state.settings);
}

/**
 * Hook to get DG settings
 */
export function useDGSettings() {
  return useSettingsStore((state) => state.settings.dangerousGoods);
}

/**
 * Hook to get optimization settings
 */
export function useOptimizationSettings() {
  return useSettingsStore((state) => state.settings.optimization);
}

/**
 * Hook to get compliance settings
 */
export function useComplianceSettings() {
  return useSettingsStore((state) => state.settings.compliance);
}

