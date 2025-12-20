/**
 * Auth / User profile types (local-only prototype).
 *
 * NOTE: This is scaffolding for future real auth + billing attribution.
 */

export type UserRole = 'loadmaster' | 'mechanic' | 'pilot' | 'dispatcher' | 'admin' | 'super_admin';

export const ROLE_LABELS: Record<UserRole, string> = {
  loadmaster: 'Loadmaster',
  mechanic: 'Mechanic',
  pilot: 'Pilot (FO/CA)',
  dispatcher: 'Dispatcher',
  admin: 'Manager',
  super_admin: 'LoadMaster Pro Agent',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  loadmaster: 'Create and manage load plans',
  mechanic: 'Update aircraft configurations',
  pilot: 'View finalized loadsheets',
  dispatcher: 'Schedule flights and assign aircraft',
  admin: 'Management oversight and reporting',
  super_admin: 'Full system access',
};

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  operatorCode: string;
  createdAt: string;
}


