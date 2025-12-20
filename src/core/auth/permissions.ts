/**
 * Permission Helper Functions
 * 
 * Centralized permission logic based on user roles.
 */

import type { UserRole } from './types';

export interface PermissionSet {
  // Load Planning
  canCreateLoadPlan: boolean;
  canEditLoadPlan: boolean;
  canFinalizeLoadPlan: boolean;
  canViewLoadPlan: boolean;
  
  // AI & Optimization
  canRunOptimization: boolean;
  canAccessWarehouse: boolean;
  
  // Aircraft Configuration
  canViewAirframeLayouts: boolean;
  canEditAirframeLayouts: boolean;
  canEditTypeTemplates: boolean;
  canChangeAircraftType: boolean;
  canChangeLabelsPreset: boolean;
  
  // Settings
  canAccessSettings: boolean;
  canEditGeneralSettings: boolean;
  
  // Reporting
  canViewLoadsheet: boolean;
  canExportProofPack: boolean;
  canViewCompliance: boolean;
  
  // Flight Management
  canCreateFlight: boolean;
  canScheduleFlight: boolean;
}

export function getPermissions(role: UserRole | undefined): PermissionSet {
  if (!role) {
    // Anonymous/unauthenticated
    return {
      canCreateLoadPlan: false,
      canEditLoadPlan: false,
      canFinalizeLoadPlan: false,
      canViewLoadPlan: false,
      canRunOptimization: false,
      canAccessWarehouse: false,
      canViewAirframeLayouts: false,
      canEditAirframeLayouts: false,
      canEditTypeTemplates: false,
      canChangeAircraftType: false,
      canChangeLabelsPreset: false,
      canAccessSettings: false,
      canEditGeneralSettings: false,
      canViewLoadsheet: false,
      canExportProofPack: false,
      canViewCompliance: false,
      canCreateFlight: false,
      canScheduleFlight: false,
    };
  }

  switch (role) {
    case 'loadmaster':
      return {
        canCreateLoadPlan: true,
        canEditLoadPlan: true,
        canFinalizeLoadPlan: true,
        canViewLoadPlan: true,
        canRunOptimization: true,
        canAccessWarehouse: true,
        canViewAirframeLayouts: false,
        canEditAirframeLayouts: false,
        canEditTypeTemplates: false,
        canChangeAircraftType: false,
        canChangeLabelsPreset: false,
        canAccessSettings: false,
        canEditGeneralSettings: false,
        canViewLoadsheet: true,
        canExportProofPack: true,
        canViewCompliance: true,
        canCreateFlight: false,
        canScheduleFlight: false,
      };

    case 'mechanic':
      return {
        canCreateLoadPlan: true,
        canEditLoadPlan: true,
        canFinalizeLoadPlan: true,
        canViewLoadPlan: true,
        canRunOptimization: true,
        canAccessWarehouse: true,
        canViewAirframeLayouts: true,
        canEditAirframeLayouts: true,
        canEditTypeTemplates: false,
        canChangeAircraftType: false,
        canChangeLabelsPreset: false,
        canAccessSettings: true,
        canEditGeneralSettings: false,
        canViewLoadsheet: true,
        canExportProofPack: true,
        canViewCompliance: true,
        canCreateFlight: false,
        canScheduleFlight: false,
      };

    case 'pilot':
      return {
        canCreateLoadPlan: false,
        canEditLoadPlan: false,
        canFinalizeLoadPlan: false,
        canViewLoadPlan: true,
        canRunOptimization: false,
        canAccessWarehouse: false,
        canViewAirframeLayouts: false,
        canEditAirframeLayouts: false,
        canEditTypeTemplates: false,
        canChangeAircraftType: false,
        canChangeLabelsPreset: false,
        canAccessSettings: false,
        canEditGeneralSettings: false,
        canViewLoadsheet: true,
        canExportProofPack: false,
        canViewCompliance: true,
        canCreateFlight: false,
        canScheduleFlight: false,
      };

    case 'dispatcher':
      return {
        canCreateLoadPlan: false,
        canEditLoadPlan: false,
        canFinalizeLoadPlan: false,
        canViewLoadPlan: true,
        canRunOptimization: false,
        canAccessWarehouse: false,
        canViewAirframeLayouts: false,
        canEditAirframeLayouts: false,
        canEditTypeTemplates: false,
        canChangeAircraftType: false,
        canChangeLabelsPreset: false,
        canAccessSettings: false,
        canEditGeneralSettings: false,
        canViewLoadsheet: true,
        canExportProofPack: true,
        canViewCompliance: true,
        canCreateFlight: true,
        canScheduleFlight: true,
      };

    case 'admin':
      return {
        canCreateLoadPlan: true,
        canEditLoadPlan: true,
        canFinalizeLoadPlan: true,
        canViewLoadPlan: true,
        canRunOptimization: true,
        canAccessWarehouse: true,
        canViewAirframeLayouts: true,
        canEditAirframeLayouts: true,
        canEditTypeTemplates: false,
        canChangeAircraftType: false,
        canChangeLabelsPreset: false,
        canAccessSettings: true,
        canEditGeneralSettings: true,
        canViewLoadsheet: true,
        canExportProofPack: true,
        canViewCompliance: true,
        canCreateFlight: true,
        canScheduleFlight: true,
      };

    case 'super_admin':
      return {
        canCreateLoadPlan: true,
        canEditLoadPlan: true,
        canFinalizeLoadPlan: true,
        canViewLoadPlan: true,
        canRunOptimization: true,
        canAccessWarehouse: true,
        canViewAirframeLayouts: true,
        canEditAirframeLayouts: true,
        canEditTypeTemplates: true,
        canChangeAircraftType: true,
        canChangeLabelsPreset: true,
        canAccessSettings: true,
        canEditGeneralSettings: true,
        canViewLoadsheet: true,
        canExportProofPack: true,
        canViewCompliance: true,
        canCreateFlight: true,
        canScheduleFlight: true,
      };

    default:
      // Fallback: no permissions
      return getPermissions(undefined);
  }
}

/**
 * Quick permission checks
 */
export function canUserEdit(role: UserRole | undefined): boolean {
  return getPermissions(role).canEditLoadPlan;
}

export function canUserAccessSettings(role: UserRole | undefined): boolean {
  return getPermissions(role).canAccessSettings;
}

export function canUserEditAirframes(role: UserRole | undefined): boolean {
  return getPermissions(role).canEditAirframeLayouts;
}

export function isSuperAdmin(role: UserRole | undefined): boolean {
  return role === 'super_admin';
}

